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