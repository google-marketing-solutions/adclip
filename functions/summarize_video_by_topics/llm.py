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

"""LLM Module to define LLM models, and generate prompts."""

from vertexai.preview.language_models import TextGenerationModel


def transform_sentences_to_dict(text: str, transcript: dict) -> dict:
  """Converts text to a dictionary to return to client side.

  This function is customized for model text-bison@002.

  Args:
    text: The text to convert in this following format
      ** Topic 1 **
      Line 1: foo
      Line 2: bar

      ** Topic 2 **
      Line 3: foo
      Line 4: bar

    transcript: The transcript of the video

  Returns:
    The transformed data
      data = {"Topic 1": {1: "foo", 2: "bar"},
              "Topic 2": {3: "foo", 4: "bar"}}
  """
  data = {}
  current_heading = None

  for line in text.splitlines():
    if line.startswith("*"):
      current_heading = line.strip("* ")
    elif line.startswith("+") or line.startswith("-"):
      if len(line.split(":", 1)) < 2:
        continue  # Skips empty line
      line_number, text = line.split(":", 1)
      line_number = line_number.split(" ")[-1]

      if current_heading not in data:
        data[current_heading] = {}

      if line_number.isdigit() and int(line_number) < len(transcript):
        line_number = int(line_number)
        data[current_heading][line_number] = {
            "text": text.lstrip(),
            "startTime": transcript[line_number]["startTime"],
            "endTime": transcript[line_number]["endTime"],
            "words": transcript[line_number]["words"],
        }
  return data


def send_transcript_to_llm(
    text: str,
    model_name: str,
    temperature: float = 0.2,
    max_output_tokens: int = 2048,
    top_k: int = 40,
    top_p: int = 0.8,
) -> str:
  """Sends a transcript to Vertex LLM.

  Args:
    text: A prompt to generate the response from the model.
    model_name: The Language Model to use.
    temperature: A temperature indicates the degree of randomness in token
      selection.
    max_output_tokens: The maximum number of tokens that can be generated in the
      response.
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
  if not response.is_blocked:  # Responsible AI
    # "Transcript:" is used as part of the prompt, so this additional logic
    # removes the trailing string "Transcript:" in the response.
    if response.text.lstrip().startswith("Transcript:\n"):
      return response.text.lstrip().replace("Transcript:\n", "", 1)
    return response.text
  else:
    return "The response was blocked"


def make_prompt_summarize(transcript: str,
                          user_prompt: str = "") -> str:
  user_prompt = f"{user_prompt if type(user_prompt) == "str" and len(user_prompt) > 0 else ""}"
  transcript = f"input:{transcript} '\n' output:"
  root_prompt = """Summarize the main idea of the following video ad transcript
  to 3-5 bullet points."""
  return f"{root_prompt} '\n' {user_prompt} '\n' + {transcript}"


def make_prompt_match_sentence_to_bullet_points(transcript: str,
                                                bullet_points: str = "") -> str:
  root_prompt = """Show me all of the lines that support the following ideas and
  include the line number."""
  return f"{root_prompt} '\n' {bullet_points} '\n' {transcript}"


def keep_branding_sentences(transcript: str) -> str:
  root_prompt = """What are the most important sentences from the following transcript
  if I want to emphasize on the brand in the transcript? Return 5 lines maximum.
  Include the line number and do not include delimiter.

  Format:
  **Important Sentences to Keep for Branding**
  - Line 1: text
  """
  return f"{root_prompt} '\n' {transcript}"
