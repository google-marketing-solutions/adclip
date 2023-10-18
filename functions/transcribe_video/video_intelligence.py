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
"""All Video Intelligence API features run on a video stored on GCS."""
from google.cloud import videointelligence
import math


def process_video(video_gcs_uri: str) -> list:
  """Processing the video to create video shots with timestamps and store the video shots in GCS.

  Args:
    video_gcs_uri: A video gcs uri for processing.

  Returns:
    A list of video shots metadata. For example:
    [
      {
        'start_time': 0.0,
        'end_time': 4.8
      },
      {
        'start_time': 5.2,
        'end_time': 5.6
      }
    ]
  """
  video_client = videointelligence.VideoIntelligenceServiceClient()

  #TODO: b/306068003 - Add speech-to-text feature here.
  features = [
    videointelligence.Feature.SHOT_CHANGE_DETECTION,
    # videointelligence.Feature.SPEECH_TRANSCRIPTION,
  ]

  transcript_config = videointelligence.SpeechTranscriptionConfig(
    language_code="en-US"
  )
  video_context = videointelligence.VideoContext(
    speech_transcription_config=transcript_config
  )

  operation = video_client.annotate_video(
    request={
      "features": features,
      "input_uri": video_gcs_uri,
    }
  )

  print("\nProcessing video.", operation)

  result = operation.result(timeout=300)

  print("\n finished processing.")

  video_shots = []
  # first result is retrieved because a single video was processed
  for i, shot in enumerate(result.annotation_results[0].shot_annotations):
    start_time = (
      shot.start_time_offset.seconds + shot.start_time_offset.microseconds / 1e6
    )
    end_time = (
      shot.end_time_offset.seconds + shot.end_time_offset.microseconds / 1e6
    )
    video_shots.append(
      {
        "start_time": math.floor(start_time * 10) / 10.0,
        "end_time": round(end_time, 1),
      }
    )
    print("\tShot {}: {} to {}".format(i, start_time, end_time))

  return video_shots
