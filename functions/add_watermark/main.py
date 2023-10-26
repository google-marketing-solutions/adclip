# Copyright 2023 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
import functions_framework
from firebase_functions import https_fn, options
import requests
import subprocess
from google.cloud import storage
import os

TMP_FOLDER = '/tmp/'
OUTPUT_FOLDER = 'output/'
PROJECT_ID = 'adclip'
BUCKET_ID = 'adclip.appspot.com'
BUCKET_FOLDER = f'{BUCKET_ID}/watermark'
STORAGE_HOST = 'https://storage.googleapis.com'
ADCLIP_WATERMARK_URI = f'{STORAGE_HOST}/{BUCKET_FOLDER}/adclip.png'
ADCLIP_WATERMARK_URI_SMALL = f'{STORAGE_HOST}/{BUCKET_FOLDER}/adclip_small.png'

# Initialize a client
storage_client = storage.Client(PROJECT_ID)
# Create a bucket object for our bucket
bucket = storage_client.get_bucket(BUCKET_ID)


def upload_blob(source_file_name: str, destination_blob_name: str) -> None:
  blob = bucket.blob(destination_blob_name)
  blob.upload_from_filename(source_file_name)
  print(f'File {source_file_name} uploaded to {destination_blob_name}.')
  os.remove(source_file_name)


# Download watermarks
def download_watermark(url: str, path: str) -> None:
  watermark_request = requests.get(url)
  with open(path, 'wb') as file:
    file.write(watermark_request.content)


def apply_watermark(input_path: str, watermark_path: str) -> None:
  cmd = (
    f'ffmpeg -i {input_path} -i {watermark_path}'
    f' -filter_complex 'overlay=10:10' '
    f'-codec:a copy -preset ultrafast -async 1 {output_path}'
    )
  subprocess.check_output(cmd, shell=True)


@https_fn.on_call(timeout_sec=600, memory=options.MemoryOption.GB_4, cpu=2,
  region='asia-southeast1')
def add_watermark(request: https_fn.CallableRequest) -> any:
  """HTTP Cloud Function.
  Args:
      request (flask.Request): The request object.
      <https://flask.palletsprojects.com/en/1.1.x/api/#incoming-request-data>
  Returns:
      The response text, or any set of values that can be turned into a
      Response object using `make_response`
      <https://flask.palletsprojects.com/en/1.1.x/api/#flask.make_response>.
  """
  request_json = request.get_json(silent=True)
  file_name = request_json['file_name']
  file_path_landscape = request_json['full_path']
  file_path_vertical = request_json['full_path_vertical']

  video_output_path = f'{TMP_FOLDER}output_916_no_wm.mp4'
  video_output_path_original = f'{TMP_FOLDER}output_original_no_wm.mp4'

  # Download the files
  blob = bucket.blob(file_path_vertical)
  blob_landscape = bucket.blob(file_path_landscape)
  blob.download_to_filename(video_output_path)
  blob_landscape.download_to_filename(video_output_path_original)

  watermark_urls = [
    (ADCLIP_WATERMARK_URI,f'{TMP_FOLDER}adclip_watermark.png'),
    (ADCLIP_WATERMARK_URI_SMALL, f'{TMP_FOLDER}adclip_watermark_small.png')
  ]

  for url, path in watermark_urls:
    download_watermark(url, path)

  video_output_path_final = f'{TMP_FOLDER}output_916.mp4'
  video_output_path_original_final = f'{TMP_FOLDER}output_original.mp4'

  apply_watermark(video_output_path,
                  f'{TMP_FOLDER}adclip_watermark_small.png',
                  video_output_path_final
  )
  apply_watermark(video_output_path_original,
                  f'{TMP_FOLDER}adclip_watermark.png',
                  video_output_path_original_final
  )

  # Upload files with and without watermark
  paths_to_upload = [
    (video_output_path_final, f'{OUTPUT_FOLDER}vertical_' + file_name),
    (
      video_output_path_original_final,
      f'{OUTPUT_FOLDER}landscape_' + file_name
    ),
    (video_output_path, f'{OUTPUT_FOLDER}nowm_vertical_' + file_name),
    (video_output_path_original, f'{OUTPUT_FOLDER}nowm_landscape_' + file_name)
  ]

  for path, destination in paths_to_upload:
    upload_blob(path, destination)

  response_status = {
    'status': 'success'
  }

  return response_status
