# Copyright 2023 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
from google.cloud import speech, storage
import moviepy.editor as mpy
import itertools

from firebase_functions import https_fn, options
from firebase_admin import initialize_app, firestore

from video_intelligence import process_video

initialize_app()

GCLOUD_BUCKET_NAME = 'adclip.appspot.com'
AUDIO_FOLDER = 'videos/audio/'
TEMP_FOLDER = '/tmp/'
GS_PATH = f'gs://{GCLOUD_BUCKET_NAME}/'
GAP_MULTIPLIER = 2.5
MIN_CLIP_DURATION = 5

storage_client = storage.Client()
bucket = storage_client.get_bucket(GCLOUD_BUCKET_NAME)

def get_speech_recognition_config(language_code: str, model: str):
  """Get speech recognition config from the given language code and model.
  Check all supported language code and model here:
  https://cloud.google.com/speech-to-text/docs/speech-to-text-supported-languages

  Args:
    language_code: A langauge code for transribing.
    model: A video transcribe model.

  Return:
    A speech recognition config.
  """
  return speech.RecognitionConfig(
    enable_word_time_offsets=True,
    audio_channel_count=2, #2 is default for wav files
    # Enable automatic punctuation
    # enable_automatic_punctuation=True,
    language_code=language_code,
    # alternative_language_codes=alternate_languages,
    model=model,
    # Works only for model="video" or "phone call"
    use_enhanced=True)

def does_file_exist(file_path: str) -> bool:
  """Validate if file already existing in the bucket.

  Args:
    file_path: A file location.

  Return:
    True if file existed, otherwise, False
  """
  blob = bucket.get_blob(file_path)
  return blob is not None

def upload_blob(source_file_name: str, destination_blob_name: str) -> None:
  """Upload file to bucket."""
  blob = bucket.blob(destination_blob_name)
  blob.upload_from_filename(source_file_name)

  print('File {} uploaded to {}.'.format(source_file_name, destination_blob_name))

def extract_audio(video_full_path, file_name, output_name = None) -> str:
  """Extract audio from the video by the given video path.

  Args:
    video_full_path: A full video path that store in GCS.
    file_name: A file name for temp use.
    output_name: A custom output name.

  Returns:
    A path to video audio file.
  """
  file_name_without_extension = file_name.rsplit('.', 1)[0]
  if output_name is None:
    audio_output_file = file_name_without_extension  + '.wav'
  else:
    audio_output_file = output_name + '.wav'
  gcs_file_path = AUDIO_FOLDER + audio_output_file

  if does_file_exist(gcs_file_path):
    print('File {} exists'.format(gcs_file_path))
    return GS_PATH + gcs_file_path
  tmp_file_path = TEMP_FOLDER + file_name

  # use video file_path
  blob = bucket.blob(video_full_path)
  blob.download_to_filename(tmp_file_path)
  clip = mpy.VideoFileClip(tmp_file_path)
  audio_output_path = TEMP_FOLDER + audio_output_file
  clip.audio.write_audiofile(audio_output_path)

  upload_blob(audio_output_path, gcs_file_path)

  return GS_PATH + gcs_file_path

def build_transcript(response) -> list:
  """Build video transcript response with transcript metadata.

  Args:
    response: A transcript response from speech API.

  Return:
    A list of new video transcript strucutre and metadata.
    For example,
    [
      {
        "text": "some sentence"
        "startTime": 0,
        "endTime": 2.8,
        "duration": 2.8
        "words": [
          {
            "text": "some"
            "startTime": 0,
            "endTime": 1.2,
            "duration": 1.2
          },
          {
            "text": "sentence"
            "startTime": 1.2,
            "endTime": 2.8,
            "duration": 1.6
          }
        ]
      }
    ]
  """
  transcript_builder = []
  last_end_time = 0
  # Each result is for a consecutive portion of the audio. Iterate through
  # them to get the transcripts for the entire audio file.
  for result in response.results:
    # The first alternative is the most likely one for this portion.
    for alternative in result.alternatives:

      if len(alternative.words) > 0:
        transcript_item = {
          'text': alternative.transcript,
          'startTime': alternative.words[0].start_time.total_seconds(),
          'endTime': alternative.words[-1].end_time.total_seconds(),
          'duration': (alternative.words[-1].end_time.total_seconds()
                      - alternative.words[0].start_time.total_seconds())
        }

        transcript_item['words'] = []
        for word in alternative.words:
          transcript_item['words'].append({
            'text': word.word,
            'startTime': word.start_time.total_seconds(),
            'endTime': word.end_time.total_seconds(),
            'duration': (word.end_time.total_seconds()
                        - word.start_time.total_seconds()),
            'gap': word.end_time.total_seconds() - last_end_time})
          last_end_time = word.end_time.total_seconds()
        transcript_builder.append(transcript_item)
  return transcript_builder

def generate_transcript_item(
    words: list, start_time: float = None, end_time: float = None) -> dict:
  """Generate transcript item."""
  start_time = words[0]['startTime'] if start_time is None else start_time
  end_time = words[-1]['end_time'] if end_time is None else end_time
  return {
    'text': ' '.join(list(map(lambda word: word['text'], words))),
    'startTime': start_time,
    'endTime': end_time,
    'duration': end_time - start_time,
    'words': words
  }

def refine_by_gaps(transcript: list) -> list:
  """Refines the transcript by the gap time."""
  new_transcript = []

  for line in transcript:
    gaps = list(map(lambda clip: clip['gap'], line['words']))
    gaps.pop(0) #remove first gap

    if len(gaps) == 0:
      continue
    average = sum(gaps) / len(gaps)
    words = []
    for index, word in enumerate(line['words']):
      if index > 1 and word['gap'] > average * GAP_MULTIPLIER:
        new_transcript.append(generate_transcript_item(words))
        words = []
      words.append(word)
    if len(words) > 0:
      new_transcript.append(generate_transcript_item(words))
  return new_transcript

def upload_video_shots(file_name: str, video_shots: list) -> None:
  """Uploads video shot to firestore."""
  db = firestore.client()
  doc_ref = db.collection('video_shots').document(file_name)
  doc_ref.set({'data': video_shots})

def get_video_shots(file_name: str) -> bool:
  """Gets video shots from firestore by file name."""
  db = firestore.client()
  doc = db.collection('video_shots').document(file_name).get()
  if not doc.exists:
    return None
  return doc.to_dict().get('data')

def merge_clips(transcript: list) -> list:
  """Merges clips under 5seconds."""
  if len(transcript) == 0:
    return []

  def merge(transcript1, transcript2):
    """Merges transcript1 and transcript2."""
    start_time = transcript1['startTime']
    end_time = max(transcript1['endTime'], transcript2['endTime'])
    return {
      'text': f"{transcript1['text']} {transcript2['text']}",
      'startTime': start_time,
      'endTime': end_time,
      'duration': end_time - start_time,
      'words': transcript1['words'] + transcript2['words']
      }

  def is_overlapping(transcript1, transcript2):
    """Validate overlapping transcript time."""
    t2_start_time = transcript2['words'][0]['startTime']
    t2_prev_start_time = transcript2['words'][-1]['startTime']
    t1_start_time = transcript1['startTime']
    t1_end_time = transcript1['endTime']
    return (t2_start_time >= t1_start_time and
      t2_prev_start_time <= t1_end_time)

  output = []
  index = 0
  clip = transcript[index]

  for index in range(len(transcript)):
    if index < len(transcript) - 1:
      next = transcript[index + 1]
      if (next['endTime'] - clip['startTime'] <= MIN_CLIP_DURATION or
          is_overlapping(clip, next)):
        clip = merge(clip, next)
      else:
        output.append(clip)
        clip = transcript[index + 1]
    else:
      output.append(clip)
  return output

def refine_by_video_shots(
    file_name: str, video_gcs_uri: str, transcript: list) -> list:
  """Refines transcript with video shots data."""

  new_transcript = []
  video_shots = get_video_shots(file_name)

  if video_shots is None:
    video_shots = process_video(video_gcs_uri)
    upload_video_shots(file_name, video_shots)

  video_shots_index = 0
  list_of_words = list(map(lambda line: line['words'], transcript))
  transcript_words = list(itertools.chain.from_iterable(list_of_words))
  print('\\\\\transcript_words////')
  print(transcript_words)
  words = []

  for index, word in enumerate(transcript_words):
    words.append(word)
    while video_shots[video_shots_index]['end_time'] < words[0]['startTime']:
      video_shots_index = video_shots_index + 1
    video_shot = video_shots[video_shots_index]
    if word['endTime'] > video_shot['end_time']:
      start_time = min(words[0]['startTime'], video_shot['start_time'])
      if index < len(transcript_words) - 1:
        end_time = max(
          word['endTime'],
          min(video_shot['end_time'],
          transcript_words[index+1]['startTime']))
      else:
        end_time = max(word['endTime'], video_shot['end_time'])
      video_shots_index = video_shots_index + 1
      new_transcript.append(
        generate_transcript_item(words, start_time, end_time))
      words = []
  if len(words) > 0:
    start_time = min(
      words[0]['startTime'],
      video_shots[video_shots_index]['start_time'])
    end_time = max(
      word['endTime'],
      video_shots[video_shots_index]['end_time'])
    video_shots_index = video_shots_index + 1
    new_transcript.append(
      generate_transcript_item(words, start_time, end_time))

  return new_transcript

def get_transcript(file_name: str) -> bool:
  """Get transcript from firestore by file name."""
  db = firestore.client()
  doc = db.collection('transcripts').document(file_name).get()
  if not doc.exists:
      return None

  return doc.to_dict().get('original')

@https_fn.on_call(timeout_sec=600, memory=options.MemoryOption.GB_4, cpu=2,
  region='asia-southeast1')
def transcribe_video(request: https_fn.CallableRequest) -> any:
  """Transcribe video audio and store the transcript in GCS.

  Args:
    request: A request payload from API call.

  Return:
    An object that contain video transcript with the timestamp data.
  """

  video_full_path = request.data['full_path']
  file_name = request.data['file_name']

  try:
    language_code = request.data['language_code']
    model = request.data['model']
  except:
    language_code = 'en-US'
    model = 'video'

  if video_full_path is None:
    return {
      'error': 'Missing video uri, sample format: https://googleapis.com/Welcome to World Class.wav'
    }

  transcript_in_firestore = get_transcript(file_name)
  if transcript_in_firestore is not None:
    return {
      'transcript': merge_clips(
        refine_by_video_shots(
          file_name,
          GS_PATH + video_full_path,
          transcript_in_firestore)),
      'original': transcript_in_firestore,
      'v1': refine_by_gaps(transcript_in_firestore),
    }

  audio_gcs_uri = extract_audio(video_full_path, file_name)
  print(f'Extracted audio is stored at {audio_gcs_uri}')

  audio = speech.RecognitionAudio(uri=audio_gcs_uri)
  client = speech.SpeechClient()

  #TODO: b/306533157 - Get language model and video transcribe model from request payload.
  config = get_speech_recognition_config(language_code, model)

  operation = client.long_running_recognize(config=config, audio=audio)

  print("Waiting for operation to complete...")
  response = operation.result(timeout=900)

  transcript = build_transcript(response)

  return {
    'transcript': merge_clips(
      refine_by_video_shots(
        file_name,
        GS_PATH + video_full_path,
        transcript)),
    'original': transcript,
    'v1': refine_by_gaps(transcript)
  }
