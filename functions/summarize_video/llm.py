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

"""LLM Module to define LLM models, and generate prompts"""

from vertexai.preview.language_models import TextGenerationModel


def send_transcript_to_llm(text: str,
                           model_name: str,
                           temperature: float = 0.2,
                           max_output_tokens: int = 1024,
                           top_k: int = 40,
                           top_p: int = 0.8) -> str:
  """Sends a transcript to Vertex LLM.

  Args:
    text: A prompt to generate the response from the model.
    model: The Language Model to use.
    temperature: A temperature indicates the degree of randomness in token selection.
    max_output_tokens: The maximum number of tokens that can be generated in the response.
    top_k: A value indicates how the model selects tokens for output.
    top_p: A value indicates how the model selects tokens for output.

  Returns:
    A string of the summarized transcript.
  """
  # AdClip uses the default value for parameters
  # https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/text
  model = TextGenerationModel.from_pretrained(model_name=model_name)
  response = model.predict(text,
    temperature=temperature,
    max_output_tokens=max_output_tokens,
    top_k=top_k,
    top_p=top_p,
  )
  if response.is_blocked is False: # Responsible AI
    # "Transcript:" is used as part of the prompt, so this additional logic removes
    # the trailing string "Transcript:" in the response.
    if response.text.lstrip().startswith('Transcript:\n'):
      return response.text.lstrip().replace('Transcript:\n', '', 1)
    return response.text
  else:
    return "The response was blocked"

def make_prompt(transcript: str,
                user_prompt: str = '') -> str:
  """Constructs a prompt to send to the LLM.

  Args:
    root_prompt: The root prompt of AdClip to summarize the transcript.
    user_prompt: The prompt that users may input on the UI.
    transcript: The transcript of the video.

  Returns:
    The full prompt to send to LLM.
  """
  root_prompt = """You are a senior copy writer for an advertising agency who excels at summarizing transcript for video ads.
    Shorten the transcript by keeping important lines and removing other lines.
    Keep the first and last lines of the transcript.
    Keep the format of the output the same with the input.
    Don't make the response too short."""
  user_prompt = f"{user_prompt if type(user_prompt) == 'str' and len(user_prompt) > 0 else ''}"
  transcript = f"Transcript:{transcript}"
  return root_prompt + '\n' +  user_prompt + '\n' + transcript

def make_prompt_summarize(transcript: str,
                user_prompt: str = '') -> str:
  """Constructs a prompt to send to the LLM.

  Args:
    root_prompt: The root prompt of AdClip to summarize the transcript.
    user_prompt: The prompt that users may input on the UI.
    transcript: The transcript of the video.

  Returns:
    The full prompt to send to LLM.
  """
  user_prompt = f"{user_prompt if type(user_prompt) == 'str' and len(user_prompt) > 0 else ''}"
  transcript = f"input:{transcript} '\n' output:"
  root_prompt = """Summarize the main idea of the following video ad transcript to 3-5 bullet points.
  """
  return f"{root_prompt} '\n' {user_prompt} '\n' + {transcript}"

def make_prompt_match_sentence_to_bullet_points(transcript: str,
                bullet_points: str = '') -> str:
  """Constructs a prompt to send to the LLM.

  Args:
    transcript: The transcript of the video.
    bullet_points: The main idea of the transcript in bullet points.

  Returns:
    The full prompt to send to LLM.
  """
  root_prompt = """Show me all of the lines that support the following ideas and include the line number."""
  return f"{root_prompt} '\n' {bullet_points} '\n' {transcript}"

def keep_branding_sentences(transcript: str) -> str:
  root_prompt = """What are the most important sentences from the following transcript
  if I want to emphasize on the brand or product in the transcript?
  Include the line number and do not include delimiter.

  Format:
  **Important Sentences to Keep for Branding**
  - Line 1: text
  """
  return f"{root_prompt} '\n' {transcript}"

def transform_sentences_to_dict(text: str):
 """Converts text to a dictionary to show sentences grouped by topics in the UI

 Args:
   text: The text to convert, organized as headings followed by lines
     with "Line <number>:" prefixes.

 Returns:
   The JSON representation of the text.
 """
 data = {}
 current_heading = None

 for line in text.splitlines():
   if line.startswith("**"):
     current_heading = line.strip("** ")
   if line.startswith("+") or line.startswith("-"):
     line_number, text = line.split(":", 1)
     line_number = line_number.split(" ")[-1]

     if current_heading not in data:
        data[current_heading] = {}
     data[current_heading][int(line_number)] = text.lstrip()
 return data

def make_shortened_text(transformed_text: dict):
  """Converts the dictionary to string with sentences sorted by line number

  Args:
   transformed_text: The text in dictionary format

  Returns:
   The text in string
 """
  shortened_text = {}
  for sentences in transformed_text.values():
      shortened_text.update(sentences)
  sorted_sentence = list(sorted(shortened_text.items()))
  shortened_text = ""
  for sentence in sorted_sentence:
    shortened_text += sentence[1] + "\n"
  return shortened_text.strip()