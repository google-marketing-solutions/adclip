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

import re

class Language:
  def get_clips_from_transcript(
      self,
      transcript_words: list,
      shortened_text: str,
      input_transcript: list) -> list:
    pass

  def _extract_words_from_str(self, summary: str) -> list:
    """Extracts the words from the given summary splitting by space.

    Args:
      summary: A summary of the transcript.

    Return:
      A list of words from the given summary.
    """
    # Remove the trailing "transcript:" from the summarized transcript from LLM
    if summary.lstrip().lower().startswith('transcript:'):
      summary = summary.lower().replace('transcript:', '', 1)

    summary = re.sub('[,.?!]', '', summary).lower()
    summary = summary.replace('\n', ' ')

    words = summary.split(' ')
    words = list(filter(lambda word: len(word) > 0, words))
    print(f'words: {words}')
    return words

class DefaultLanguage(Language):
  _SHOULD_KEEP = 'shouldKeep'
  _TEXT = 'text'

  def get_clips_from_transcript(
      self,
      transcript_words: list,
      shortened_text: str,
      input_transcript: list) -> list:
    """Identifies the clip from the summarized transcript. This function  minimizes the hallucination when LLM
    doesn't respect the original sentences from the full transcripts by adding  new words or only returning parts
    of the original sentences in its response.

    Example:
      - Original sentence: "MacBook Air for the first time ever in 15 inches  we've been dreaming about making this for years we"
      - Response from LLM: "MacBook Air for the first time ever in 15 inches..."

    Args:
      transcript: The original full transcripts
      summary: The "summarized" transcript from LLM

    Returns:
      A list containing the adjusted text, start_time, end_time, duration.
    """
    print("----get_clips_from_transcript-----'")
    print(transcript_words)
    transcript_ptr = 0
    output = []

    summary_words = super()._extract_words_from_str(shortened_text)

    word_ptr = 0

    def does_word_match_transcript(transcript_idx: int, word_idx: int):
      if (transcript_idx >= len(transcript_words) or
          word_idx >= len(summary_words)):
        return False

      return (transcript_words[transcript_idx].get('text').lower() ==
              summary_words[word_idx].lower())

    while transcript_ptr < len(transcript_words):
      transcript_builder = []

      # loop until the summary word match with transcript
      # or until the transcript has True shouldKeep flag
      while (transcript_ptr < len(transcript_words)
             and not does_word_match_transcript(transcript_ptr, word_ptr)
             and transcript_words[transcript_ptr].get('shouldKeep') != True):
        transcript_ptr = transcript_ptr + 1

      # append all matched transcript summary
      # or transcript that has True shouldKeep flag
      while (transcript_ptr < len(transcript_words) and
              (does_word_match_transcript(transcript_ptr, word_ptr)
               or does_word_match_transcript(transcript_ptr + 1, word_ptr + 1)
               or does_word_match_transcript(transcript_ptr + 2, word_ptr + 1)
               or transcript_words[transcript_ptr].get('shouldKeep') == True)):
        transcript_builder.append(transcript_words[transcript_ptr])

        if does_word_match_transcript(transcript_ptr, word_ptr):
          word_ptr += 1

        elif transcript_words[transcript_ptr].get('shouldKeep') != True:
          transcript_builder.append(transcript_words[transcript_ptr+1])

          if not does_word_match_transcript(transcript_ptr + 1, word_ptr + 1):
            transcript_builder.append(transcript_words[transcript_ptr+2])
            transcript_ptr += 1

          transcript_ptr += 1
          word_ptr += 2

        transcript_ptr += 1

      if len(transcript_builder) == 0:
        continue
      if len(transcript_builder) == 1:
        word_ptr -= 1
        continue

      new_text = list(map(lambda item: item.get('text'), transcript_builder))
      output.append({
        'text': ' '.join(new_text),
        'startTime': transcript_builder[0].get('startTime'),
        'endTime': transcript_builder[-1].get('endTime'),
        'duration': (transcript_builder[-1].get('endTime') -
               transcript_builder[0].get('startTime')),
        'words': transcript_builder
      })
    return output

class Thai(Language):
  def get_clips_from_transcript(
      self,
      transcript_words: list,
      shortened_text: str,
      input_transcript: list):
    """Matches the shortened text to the original transcript for getting
    video clips timestamps and duration.

    The script loops thru each words of the shortened text comparing with
    the original transcript text. If the original transcript contains the
    words from shortened text. Add the original transcript into the result.
    The next checking will start from the last added scene of the original
    transcript. Thus, the transcript will not be duplicated. Repeat the
    process until the last word of the shorten text.

    Args:
      shortened_text: The shortened text from the original transcript
        generated by LLM.
      original_transcript: The original transcript from transcribing video.
    """
    original_transcript = input_transcript['transcript']
    words_ptr = 0
    original_ptr = 0
    matched_result = []
    is_matched = False
    latest_added_scene = -1

    extracted_words = super()._extract_words_from_str(shortened_text)

    while words_ptr < len(extracted_words):
      if original_ptr >= len(original_transcript) and latest_added_scene < 0:
        original_ptr = 0
      if original_ptr >= len(original_transcript) or original_ptr > latest_added_scene and latest_added_scene > 0:
        original_ptr = latest_added_scene
      while original_ptr < len(original_transcript):
        is_matched = self._find_the_match(extracted_words[words_ptr], original_transcript[original_ptr]['words'])
        if is_matched:
          if self._already_in_final_result(matched_result, original_transcript[original_ptr]):
            break
          else:
            to_add_transcript = original_transcript[original_ptr]
            to_add_transcript['index'] = original_ptr
            matched_result.append(to_add_transcript)
            latest_added_scene = original_ptr
            is_matched = False
          break
        original_ptr += 1
      words_ptr += 1

    return matched_result

  def _find_the_match(
      words: list,
      original_transcript_word_list: list) -> bool:
    for original_words in original_transcript_word_list:
      if original_words['text'] in words:
        return True
    return False

  def _already_in_final_result(
      final_result_list: list,
      transcript_to_add: str) -> bool:
    if len(final_result_list) == 0:
      return False
    for result in final_result_list:
      if transcript_to_add['text'] == result['text']:
        return True
    return False
