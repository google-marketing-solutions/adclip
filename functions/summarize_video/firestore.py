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

"""Firestore Module to get and upload data from and to Firestore"""

from firebase_admin import firestore


def get_video_shots(file_name: str) -> list | None:
  """Retrieves data on shot detection of the video file from Firestore."""
  db = firestore.client()
  doc = db.collection('video_shots').document(file_name).get()
  if not doc.exists:
    return None
  return doc.to_dict().get('data')


def upload_summary(full_text: str,
                   summary: str) -> None:
  """Uploads a summarized transcript to a Firestore's collection ("summary").

  Args:
    full_text: The full transcript as transcribed by Speech-to-text
      with optional editing from users in the UI.
    summary: The "summarized" transcript that LLM returns.
  """
  db = firestore.client()
  doc_ref = db.collection('summary').document() #what's the purpose of repr?
  doc_ref.set({"full_text": full_text,
               "summary": summary,
               "summary_repr": repr(summary)})


def upload_summary_transformation(video: str,
                                  full_text: str,
                                  summary: str,
                                  final_output: str) -> None:
  """Uploads transcript after data transforming process
  to Firestore's collection (summary_transformation)."""
  db = firestore.client()
  doc_ref = db.collection('summary_transformation').document()
  doc_ref.set({
    "video": video,
    "full_text": full_text,
    "summary": summary,
    "final_output": final_output,
    })