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

"""Summarize Transcript by Topics.

This function is the microservice to process the following tasks:
  - Sends the full transcript to Vertex LLM and processes the following tasks:
      1. Gets the main points of the transcript
      2. Matches sentences in the transcript to each main point (Note: depending
      on the length of the transcript, this step will exclude some to many
      sentences from the original transcript)
  - Returns each sentence in the "shortened transcript" with its video shot
"""

import itertools
import re

from firebase_admin import firestore
from firebase_admin import initialize_app
from firebase_functions import https_fn
import llm


LANGUAGE_CODE = "en-US"
MODEL_NAME = "text-bison@002"
TRANSCRIPT_PREFIX = "transcript:"


initialize_app()


def match_with_video_shots(video_shots: list,
                           transcript: list,
                           words: list) -> list:
  """Adjusts the startTime and endTime of each line in the transcript.

  This implementation helps with "jumpy" transition in the final output video.

  Args:
    video_shots: The list containing video shots in format of [{end_time,
      start_time}, {end_time, start_time},]
    transcript: The video transcript transcribed by Speech to Text AI.
    words: A list containing the startTime and eachTime of each word in the full
      transcript.

  Returns:
    The transcript with the adjusted startTime and endTime.
  """
  shot_index = 0
  word_index = 0
  for index, line in enumerate(transcript):
    while video_shots[shot_index]["end_time"] < line["startTime"]:
      shot_index += 1
    video_shot = video_shots[shot_index]

    start_time = min(line["startTime"], video_shot["start_time"])
    transcript[index]["startTime"] = start_time
    print(f"start_time: {start_time}")

    while video_shots[shot_index]["end_time"] < line["endTime"]:
      shot_index += 1
    video_shot = video_shots[shot_index]

    while (
        word_index < len(words) - 1
        and words[word_index]["startTime"] < line["endTime"]
    ):
      word_index += 1

    end_time = max(line["endTime"], video_shot["end_time"])

    if words[word_index]["endTime"] != line["endTime"]:
      end_time = max(
          line["endTime"],
          min(video_shot["end_time"], words[word_index]["startTime"]),
      )
    print(f"end_time: {end_time}")
    transcript[index]["endTime"] = end_time
    transcript[index]["duration"] = end_time - start_time
  return transcript


def get_video_shots(file_name: str) -> bool | None:
  """Retrieves data on shot detection of the video file from Firestore."""
  db = firestore.client()
  doc = db.collection("video_shots").document(file_name).get()
  if not doc.exists:
    return None
  return doc.to_dict().get("data")


def get_clips_from_transcript(transcript: list,
                              summary: str) -> list:
  """Identifies the clip from the summarized transcript.

  This function minimizes the hallucination when LLM doesn"t respect the
  original sentences from the full transcripts by adding new words or only
  returning parts of the original sentences in its response.

  Example:
    - Original sentence: "Pixel, the best in Google"s innovation"
    - Response from LLM: "Pixel is the best in Google"s innovation ..."

  Args:
    transcript: The original full transcripts
    summary: The "summarized" transcript from LLM

  Returns:
    A list containing the adjusted text, start_time, end_time, duration

  """
  print("----get_clips_from_transcript-----")
  print(transcript)
  index = 0
  transcript_ptr = 0
  output = []

  # Remove the trailing "transcript:" from the summarized transcript from LLM
  if summary.lstrip().lower().startswith(TRANSCRIPT_PREFIX):
    summary = summary.lower().replace(TRANSCRIPT_PREFIX, "", 1)
  summary = re.sub("[,.?!]", "", summary).lower()
  summary = summary.replace("\n", " ")

  words = summary.split(" ")
  words = list(filter(lambda word: len(word) > 0, words))
  print(words)

  word_ptr = 0


  def does_word_match_transcript(transcript_idx: int, word_idx: int):
    if transcript_idx >= len(transcript) or word_idx >= len(words):
      return False

    return (transcript[transcript_idx].get("text").lower() ==
            words[word_idx].lower())

  while word_ptr < len(words) or transcript_ptr < len(transcript):
    transcript_builder = []

    # loop until the summary word match with transcript
    # or until the transcript has True shouldKeep flag
    while (transcript_ptr < len(transcript)
            and not does_word_match_transcript(transcript_ptr, word_ptr)
            and transcript[transcript_ptr].get("shouldKeep") != True):
      transcript_ptr = transcript_ptr + 1

    # append all matched transcript summary
    # or transcript that has True shouldKeep flag
    while (transcript_ptr < len(transcript)
            and (does_word_match_transcript(transcript_ptr, word_ptr)
                or does_word_match_transcript(transcript_ptr + 1, word_ptr + 1)
                or does_word_match_transcript(transcript_ptr + 2, word_ptr + 1)
                or transcript[transcript_ptr].get("shouldKeep") == True)):
      transcript_builder.append(transcript[transcript_ptr])

      if does_word_match_transcript(transcript_ptr, word_ptr):
        word_ptr += 1

      elif transcript[transcript_ptr].get("shouldKeep") != True:
        transcript_builder.append(transcript[transcript_ptr+1])

        if not does_word_match_transcript(transcript_ptr + 1, word_ptr + 1):
          transcript_builder.append(transcript[transcript_ptr+2])
          transcript_ptr += 1

        transcript_ptr += 1
        word_ptr += 2

      transcript_ptr += 1

    if len(transcript_builder) == 0:
      continue
    if len(transcript_builder) == 1:
      word_ptr -= 1
      continue
    new_text = list(map(lambda item: item.get("text"), transcript_builder))
    output.append({
      "text": " ".join(new_text),
      "startTime": transcript_builder[0].get("startTime"),
      "endTime": transcript_builder[-1].get("endTime"),
      "duration": (transcript_builder[-1].get("endTime") -
             transcript_builder[0].get("startTime")),
      "words": transcript_builder
    })
  return output


def sort_transcript(transcript: list) -> list:
  def get_start_time(line):
    return line.get("startTime")

  transcript.sort(key = get_start_time)
  return transcript


def fix_timestamps(
    video_shots: list,
    text_sorted_by_topics: dict,
    input_transcript: list) -> list:

  transcript_set = set()
  shortened_list = []
  for topic in text_sorted_by_topics:
    for line_number in text_sorted_by_topics[topic]:
      line = text_sorted_by_topics[topic][line_number]
      line["lineNumber"] = line_number

      times = f"{line["startTime"]}-{line["endTime"]}"
      if times not in transcript_set:
        transcript_set.add(times)
        shortened_list.append(line)

  shortened_list = sort_transcript(shortened_list)
  list_of_words = list(map(lambda line: line["words"], input_transcript))
  transcript_words = list(itertools.chain.from_iterable(list_of_words))

  shot_index = 0
  word_ptr = 0

  def does_word_match_transcript(word_idx: int, line: dict):
    line_text = line.get("text")
    if (
        transcript_words[word_idx].get("text").lower()
        != line_text.split(" ")[0].lower()
    ):
      return False

    word_count = len(line_text.split(" "))
    list_of_text = list(map(lambda line: line["text"], transcript_words))
    return line_text == " ".join(list_of_text[word_idx : word_idx + word_count])

  corrected_lines = {}
  for line in shortened_list:
    while word_ptr < len(transcript_words) and not does_word_match_transcript(
        word_ptr, line
    ):
      word_ptr += 1

    word_count = len(line.get("text").split(" "))
    if word_ptr + word_count < len(transcript_words):
      start_time = transcript_words[word_ptr]["startTime"]
      end_time = transcript_words[word_ptr + word_count]["endTime"]

      while (
          shot_index < len(video_shots)
          and video_shots[shot_index]["end_time"] < start_time
      ):
        shot_index += 1

      if shot_index < len(video_shots):
        if word_ptr > 0:
          start_time = min(
              start_time,
              max(
                  transcript_words[word_ptr - 1]["endTime"],
                  video_shots[shot_index]["start_time"],
              ),
          )
        else:
          start_time = min(start_time, video_shots[shot_index]["start_time"])

      while (
          shot_index < len(video_shots)
          and video_shots[shot_index]["start_time"] < end_time
      ):
        shot_index += 1

      if shot_index < len(video_shots):
        if word_ptr < len(transcript_words) - 1:
          end_time = max(
              end_time,
              min(
                  transcript_words[word_ptr + 1]["startTime"],
                  video_shots[shot_index]["end_time"],
              ),
          )
        else:
          end_time = max(end_time, video_shots[shot_index]["end_time"])

      line_number = line["lineNumber"]
      corrected_lines[line_number] = {
          "startTime": start_time,
          "endTime": end_time,
          "duration": end_time - start_time,
          "words": transcript_words[word_ptr : word_ptr + word_count],
          "text": line["text"],
      }

  print("corrected_lines")
  for line_number in corrected_lines:
    line = corrected_lines[line_number]
    print(f"{line["startTime"]} - {line["endTime"]}")
    print(line["text"])

  for topic in text_sorted_by_topics:
    for line_number in text_sorted_by_topics[topic]:
      if line_number in corrected_lines:
        line = text_sorted_by_topics[topic][line_number]
        line["startTime"] = corrected_lines[line_number]["startTime"]
        line["endTime"] = corrected_lines[line_number]["endTime"]
        line["duration"] = corrected_lines[line_number]["duration"]
        line["words"] = corrected_lines[line_number]["words"]

  return text_sorted_by_topics


@https_fn.on_call()
def summarize_transcript_by_topic(request: https_fn.CallableRequest) -> any:
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
            "model_name": "text-unicorn@001"
        }
    }

  Returns:
    An object containing timestamp for segments of the summarized transcript.
  """
  input_transcript = request.data["transcript"]
  user_prompt = request.data.get("prompt")
  filename = request.data.get("filename")
  model_name = request.data.get("model_name") or MODEL_NAME
  language_code = request.data.get("language_code") or LANGUAGE_CODE

  full_text = "\n".join([
      f"Line {counter}: {x["text"]}"
      for counter, x in enumerate(input_transcript)
  ])
  print("----full_text-----")
  print(full_text)

  list_of_words = list(map(lambda line: line["words"], input_transcript))
  transcript_words = list(itertools.chain.from_iterable(list_of_words))

  video_shots = get_video_shots(filename)
  print("=====video_shots======")
  print(video_shots)

  summary_in_bullets = llm.send_transcript_to_llm(
      text=llm.make_prompt_summarize(full_text, user_prompt),
      model_name=model_name
  ).strip(" ")
  print("----main-ideas-in-bullet-----")
  print(summary_in_bullets)

  branding_sentences = llm.send_transcript_to_llm(
      text=llm.keep_branding_sentences(full_text), temperature=0.1,
      model_name=model_name
  ).strip()
  print("----branding_sentences-----")
  print(branding_sentences)

  match_sentences_to_bullet_points = llm.send_transcript_to_llm(
      text=llm.make_prompt_match_sentence_to_bullet_points(
          full_text, summary_in_bullets
      ), model_name=model_name
  ).strip()

  match_sentences_to_bullet_points += "\n" + "\n" + branding_sentences
  print("----match_sentences_to_bullet_points-----")
  print(match_sentences_to_bullet_points)

  text_sorted_by_topics = llm.transform_sentences_to_dict(
      match_sentences_to_bullet_points, transcript=input_transcript
  )
  print("----text_sorted_by_topics-----")
  print(text_sorted_by_topics)

  fixed_topics = fix_timestamps(
      video_shots, text_sorted_by_topics, input_transcript
  )

  print("----fixed_timestamps-----")
  print(fixed_topics)

  return fixed_topics
