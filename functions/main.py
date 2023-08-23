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

from firebase_functions import https_fn, options
from firebase_admin import initialize_app
from storage import upload_blob

initialize_app()

def extract_audio(video_full_path, file_name, output_name = None):
    gcs_file_path = 'videos/audio'
    audio_output_path = '/tmp/'
    upload_blob(audio_output_path, gcs_file_path)
    return f'gs://{gcs_file_path}'

@https_fn.on_call(timeout_sec=600, memory=options.MemoryOption.GB_4, cpu=2,
                  region='asia-southeast1')
def transcribe_video(req: https_fn.CallableRequest) -> any:
    return {
        "transcript": []
    }
