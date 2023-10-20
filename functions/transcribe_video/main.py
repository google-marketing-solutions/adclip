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

from firebase_functions import https_fn, options
from firebase_admin import initialize_app

initialize_app()

GCLOUD_BUCKET_NAME = 'adclip.appspot.com'
AUDIO_FOLDER = 'videos/audio/'
TEMP_FOLDER = '/tmp/'
GS_PATH = f'gs://{GCLOUD_BUCKET_NAME}/'

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

  audio_gcs_uri = extract_audio(video_full_path, file_name)
  print(f'Extracted audio is stored at {audio_gcs_uri}')

  audio = speech.RecognitionAudio(uri=audio_gcs_uri)
  client = speech.SpeechClient()

  #TODO: b/306533157 - Get language model and video transcribe model from
  # request payload.
  config = get_speech_recognition_config('en-US', 'video')

  return {'transcript': []}