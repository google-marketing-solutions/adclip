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
from firebase_functions import https_fn, options
from firebase_admin import initialize_app
import requests
import moviepy.editor as mpy
from moviepy.editor import VideoFileClip
from moviepy.video.fx.all import crop
from google.cloud import storage
from firebase_functions.params import (
  StringParam,
  ResourceInput,
  ResourceType,
)
import os

initialize_app()

TMP_FOLDER = '/tmp/'
OUTPUT_FOLDER = 'output/'
STORAGE_BUCKET = StringParam(
  'BUCKET',
  input=ResourceInput(type=ResourceType.STORAGE_BUCKET),
  description='This is where all video and audio files will be stored',
)
storage_client = storage.Client()


def upload_blob(source_file_name: str, destination_blob_name: str) -> None:
  bucket = storage_client.get_bucket(STORAGE_BUCKET)
  blob = bucket.blob(destination_blob_name)
  blob.upload_from_filename(source_file_name)
  print(f'File {source_file_name} uploaded to {destination_blob_name}.')
  os.remove(source_file_name)


def merge_overlapping_clips(clips: list) -> list:
  """Merges overlapping clips

  Checks each clip if their start and end times overlaps. If they do, they are
  merged into a single clip.

  Args:
      clips: The list of transcript dict with startTime and endTime

  Returns:
      The merged list of clips
  """

  if not clips:
    return []

  output = [clips[0]]

  for index in range(1, len(clips)):
    if clips[index]['startTime'] <= output[-1]['endTime']:
      output[-1]['endTime'] = clips[index]['endTime']
    else:
      output.append(clips[index])

  return output


def clip_video(video_path: str, file_name: str, segments: list) -> any:
  original_clip = VideoFileClip(video_path)
  new_clip = None

  segments = merge_overlapping_clips(segments)

  for segment in segments:
    sub_clip = original_clip.subclip(segment['startTime'], segment['endTime'])
    new_clip = sub_clip if new_clip is None else mpy.concatenate_videoclips(
      [new_clip, sub_clip]
    )

  (w, h) = new_clip.size
  crop_width = h * 9 / 16
  crop_width = crop_width // 2 * 2

  x1, x2 = (w - crop_width) // 2, (w + crop_width) // 2
  y1, y2 = 0, h
  cropped_clip = crop(new_clip, x1=x1, y1=y1, x2=x2, y2=y2)

  video_output_path = f'{TMP_FOLDER}output_{file_name}.mp4'
  video_output_path_original = f'{TMP_FOLDER}output_original_{file_name}.mp4'

  cropped_clip.write_videofile(video_output_path, audio_codec='aac')
  new_clip.write_videofile(video_output_path_original, audio_codec='aac')

  return {
    'video_output_path': video_output_path,
    'video_output_path_original': video_output_path_original
  }


def upload_clips(
    file_name: str,
    video_output_path: str,
    video_output_path_original: str
) -> None:
  upload_blob(video_output_path, f'{OUTPUT_FOLDER}vertical_{file_name}')
  upload_blob(
    video_output_path_original,
    f'{OUTPUT_FOLDER}landscape_{file_name}'
  )


@https_fn.on_call(timeout_sec=600, memory=options.MemoryOption.GB_4, cpu=2,
  region='asia-southeast1')
def cut_video(request: https_fn.CallableRequest) -> any:
  """HTTP Cloud Function.
  Args:
      request (flask.Request): The request object.
      <https://flask.palletsprojects.com/en/1.1.x/api/#incoming-request-data>
  Returns:
      The response text, or any set of values that can be turned into a
      Response object using `make_response`
      <https://flask.palletsprojects.com/en/1.1.x/api/#flask.make_response>.
  """
  summarized_transcript = request.data['transcript']
  video_url = request.data['videoUrl']
  file_name = request.data['fileName']

  r = requests.get(video_url)
  file_path = f'{TMP_FOLDER}{file_name}'
  with open(file_path, 'wb') as file:
    file.write(r.content)

  output_paths = clip_video(file_path, file_name, summarized_transcript)
  upload_clips(
    file_name,
    output_paths['video_output_path'],
    output_paths['video_output_path_original']
  )

  output_urls = {
    'full_path_vertical': f'{OUTPUT_FOLDER}landscape_{file_name}',
    'full_path': f'{OUTPUT_FOLDER}vertical_{file_name}',
  }

  return output_urls
