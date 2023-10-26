"""Summarize Transcript

This functions is the microservice to process the following tasks:
  - Sends the full transcript to Vertex LLM and receives the shortened transcript
  - Syncs each sentence in the shortened transcript with its responding video shot
  - Calculates the duration of all segments (text + shots)
  - Returns the final segments of the summarized video
"""


from firebase_functions import https_fn
from firebase_admin import initialize_app, firestore
import re
import itertools
import firestore, llm

MAX_DURATION = float(40)
MIN_DURATION = float(10)
LANGUAGE_CODE = "en-US"


initialize_app()


def calculate_duration(shortened_text: str,
                       transcript: list,
                       video_shots: list) -> float:
  """Returns the total duration of all of the clips. This function evaluates if the
  shortened video fulfills the duration requirements from the users."""
  total_duration = 0
  clips = get_clips_from_transcript(transcript, shortened_text)
  clips = match_with_video_shots(video_shots, clips, transcript)
  print('\\\\\\\\\calculate/////////')
  print(clips)
  for clip in clips:
    total_duration += clip.get('duration')
  return total_duration


def match_with_video_shots(video_shots: list,
                           transcript: list,
                           words: list) -> list:
  """Adjusts the startTime and endTime of each line in the transcript according to the
  start_time and end_time of each shot. This implementation helps with "jumpy" transition
  in the final output video.

  Args:
    video_shots: The list containing video shots in format of [{end_time, start_time}, {end_time, start_time},]
    transcript: The full transcript of the video as transcribed by Speech to Text AI.
    words: A list containing the startTime and eachTime of each word in the full transcript.

  Returns:
    The transcript with the adjusted startTime and endTime.
  """
  shot_index = 0
  word_index = 0
  for index, line in enumerate(transcript):
    while video_shots[shot_index]['end_time'] < line['startTime']:
      shot_index += 1
    video_shot = video_shots[shot_index]

    start_time = min(line['startTime'], video_shot['start_time'])
    transcript[index]['startTime'] = start_time
    print(f'start_time: {start_time}')

    while video_shots[shot_index]['end_time'] < line['endTime']:
      shot_index += 1
    video_shot = video_shots[shot_index]

    while (word_index < len(words) - 1 and words[word_index]['startTime']
        < line['endTime']):
      word_index += 1

    end_time = max(line['endTime'], video_shot['end_time'])

    if words[word_index]['endTime'] != line['endTime']:
      end_time = max(line['endTime'], min(video_shot['end_time'],
        words[word_index]['startTime']))
    print(f'end_time: {end_time}')
    transcript[index]['endTime'] = end_time
    transcript[index]['duration'] = end_time - start_time
  return transcript


def get_clips_from_transcript(transcript: list,
                              summary: str) -> list:
  """Identifies the clip from the summarized transcript. This function minimizes the hallucination when LLM
  doesn't respect the original sentences from the full transcripts by adding new words or only returning parts
  of the original sentences in its response.

  Example:
    - Original sentence: "MacBook Air for the first time ever in 15 inches we've been dreaming about making this for years we"
    - Response from LLM: "MacBook Air for the first time ever in 15 inches..."

  Args:
    transcript: The original full transcripts
    summary: The "summarized" transcript from LLM

  Returns:
    A list containing the adjusted text, start_time, end_time, duration.
  """
  print("----get_clips_from_transcript-----'")
  print(transcript)
  index = 0
  transcript_ptr = 0
  output = []

  # Remove the trailing "transcript:" from the summarized transcript from LLM
  if summary.lstrip().lower().startswith('transcript:'):
    summary = summary.lower().replace('transcript:', '', 1)
  summary = re.sub('[,.?!]', '', summary).lower()
  summary = summary.replace('\n', ' ')

  words = summary.split(' ')
  words = list(filter(lambda word: len(word) > 0, words))
  print(words)

  word_ptr = 0
  while word_ptr < len(words) and transcript_ptr < len(transcript):
    transcript_builder = []

    while (transcript_ptr < len(transcript) and
    word_ptr < len(words) and
    transcript[transcript_ptr].get('shouldKeep') != True and
    transcript[transcript_ptr].get('text').lower() != words[word_ptr]):
      transcript_ptr = transcript_ptr + 1

    while ((transcript_ptr < len(transcript) and
    word_ptr < len(words) and (
      transcript[transcript_ptr].get('shouldKeep') == True or
      transcript[transcript_ptr].get('text').lower() == words[word_ptr]
    ))

    or (transcript_ptr < len(transcript) - 1 and
    word_ptr < len(words) - 1 and
    transcript[transcript_ptr+1].get('text').lower() == words[word_ptr+1])
    or (transcript_ptr < len(transcript) - 2 and
    word_ptr < len(words) - 1 and
    transcript[transcript_ptr+2].get('text').lower() == words[word_ptr+1])):
      transcript_builder.append(transcript[transcript_ptr])
      if (transcript[transcript_ptr].get('shouldKeep') != True and
      transcript[transcript_ptr].get('text').lower() != words[word_ptr]):
        transcript_builder.append(transcript[transcript_ptr+1])
        if transcript[transcript_ptr+1].get('text').lower() != words[word_ptr+1]:
          transcript_builder.append(transcript[transcript_ptr+2])
          transcript_ptr += 1

        transcript_ptr += 1
        word_ptr += 1

      transcript_ptr += 1
      word_ptr += 1

    if len(transcript_builder) == 0:
      continue
    if len(transcript_builder) == 1:
      word_ptr = word_ptr - 1
      continue

    new_text = list(map(lambda item: item.get('text'), transcript_builder))
    output.append({
      'text': ' '.join(new_text),
      'startTime': transcript_builder[0].get('startTime'),
      'endTime': transcript_builder[-1].get('endTime'),
      'duration': (transcript_builder[-1].get('endTime') -
             transcript_builder[0].get('startTime')),
      'words': transcript_builder
    })
  return output


@https_fn.on_call()
def summarize_transcript(request: https_fn.CallableRequest) -> any:
  """Receives input from a HTTP request and processes data.

  Args:
    request: A request payload from API call. Example:
    {
    "data":
        {
            "transcript": [],
            "prompt": " ",
            "filename": "video",
            "max": 40,
            "min": 10,
            "language_code": "en-US",
        }
    }

  Returns:
    An object containing timestamp for segments of the summarized transcript.
  """
  # Input from client side (UI)
  input_transcript = request.data['transcript']
  user_prompt = request.data.get('prompt')
  filename = request.data.get('filename')
  try:
    max_duration = float(request.data.get('max'))
    min_duration = float(request.data.get('min'))
    language_code = request.data.get('language_code')
  except:
    max_duration = MAX_DURATION
    min_duration = MIN_DURATION
    language_code = LANGUAGE_CODE

  full_text = '\n'.join([x["text"] for x in input_transcript])
  print('----full_text-----')
  print(full_text)

  list_of_words = list(map(lambda line: line['words'], input_transcript))
  transcript_words = list(itertools.chain.from_iterable(list_of_words))

  video_shots = firestore.get_video_shots(filename)

  # 1st attempt to shorten transcript
  shortened_text = llm.send_transcript_to_llm(text=llm.make_prompt(full_text, user_prompt))

  # TODO: Show in UI
  if shortened_text == "The response was blocked":
    return ValueError("The response was blocked due to potential violation of Responsible AI")

  print('----shortened_text-----')
  print(shortened_text)

  duration = calculate_duration(shortened_text, transcript_words, video_shots)
  print('----duration-----')
  print(duration)

  # Validate duration and start a loop if duration condition is not met.
  count = 0
  max_try = 3
  while count < max_try and (duration > max_duration or duration < min_duration):
    if duration < min_duration:
      shortened_text = llm.send_transcript_to_llm(text=llm.make_prompt(full_text, user_prompt))
    else:
      shortened_text = llm.send_transcript_to_llm(text=llm.make_prompt(shortened_text, user_prompt))
      duration = calculate_duration(shortened_text, transcript_words, video_shots)
      count += 1
      print('----LOOP shortened_text-----')
      print(shortened_text)
      print('----duration-----')
      print(duration)

  firestore.upload_summary(full_text, shortened_text)

  segments = get_clips_from_transcript(transcript_words, shortened_text)
  print('----segments-----')
  print(segments)

  segments = match_with_video_shots(video_shots, segments, transcript_words)
  print('----segments + video shots-----')
  print(segments)

  output_text = '\n'.join(list(map(lambda line: line['text'], segments)))
  firestore.upload_summary_transformation(filename,
                                          full_text,
                                          shortened_text,
                                          output_text)

  return  {
      "summarized_transcript": segments
    }