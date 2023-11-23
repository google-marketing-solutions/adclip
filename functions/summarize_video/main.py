# Copyright 2023 Google LLC

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     https://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Summarize Transcript

This functions is the microservice to process the following tasks:
  - Sends the full transcript to Vertex LLM and receives the shortened transcript
  - Syncs each sentence in the shortened transcript with its responding video shot
  - Calculates the duration of all segments (text + shots)
  - Returns the final segments of the summarized video
"""


from firebase_functions import https_fn
from firebase_admin import initialize_app, firestore
from languages import Language, DefaultLanguage, Thai
import itertools
import firestore, llm

MAX_DURATION = float(40)
MIN_DURATION = float(10)
LANGUAGE_CODE = "en-US"


initialize_app()


def calculate_duration(shortened_text: str,
                       transcript: list,
                       video_shots: list,
                       input_transcript: list,
                       language: Language) -> float:
  """Returns the total duration of all of the clips. This function evaluates if the
  shortened video fulfills the duration requirements from the users."""
  total_duration = 0
  clips = language.get_clips_from_transcript(
    transcript, shortened_text, input_transcript)
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

  if language_code == 'th-TH':
    language = Thai()
  else:
    language = DefaultLanguage()

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

  duration = calculate_duration(
    shortened_text,
    transcript_words,
    video_shots,
    input_transcript,
    language)
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
      duration = calculate_duration(
        shortened_text,
        transcript_words,
        video_shots,
        input_transcript,
        language)
      count += 1
      print('----LOOP shortened_text-----')
      print(shortened_text)
      print('----duration-----')
      print(duration)

  firestore.upload_summary(full_text, shortened_text)

  segments = language.get_clips_from_transcript(
    transcript_words, shortened_text, input_transcript)
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