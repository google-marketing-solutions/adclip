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
                           model: str = "text-bison@002",
                           temperature: float = 0.2,
                           max_output_tokens: int = 1024,
                           top_k: int = 40,
                           top_p: int = 0.8) -> str:
  """Sends a transcript to Vertex LLM.

  Args:
    text: A prompt to generate the response from the model.
    model: The Language Model to use.
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
  # The best performing model for AdClip is currently "text-unicorn@001"
  model = TextGenerationModel.from_pretrained(model)
  response = model.predict(text,
                           temperature=temperature,
                           max_output_tokens=max_output_tokens,
                           top_k=top_k,
                           top_p=top_p,
  )
  if not response.is_blocked:  # Responsible AI
    # "Transcript:" is used as part of the prompt, so this additional logic
    # removes the trailing string "Transcript:" in the response.
    if response.text.lstrip().startswith('Transcript:\n'):
      return response.text.lstrip().replace('Transcript:\n', '', 1)
    return response.text
  else:
    return "The response was blocked"


def make_prompt(transcript: str,
                user_prompt: str = '',
                language_code: str = '') -> str:
  """Constructs a prompt to send to the LLM.

  Args:
    transcript: The transcript of the video.
    user_prompt: The prompt that users may input on the UI.
    language_code: The language code of the transcript.

  Returns:
    The full prompt to send to LLM.
  """
  user_prompt = f"{user_prompt if type(user_prompt) == 'str' and len(user_prompt) > 0 else ''}"
  transcript = f"input:{transcript} '\n' output:"
  if language_code == "zh-TW":
    return f"{root_prompt_zh} '\n' {user_prompt} '\n' + {transcript}"
  return f"{root_prompt_en} '\n' {user_prompt} '\n' + {transcript}"

root_prompt_en = """You are a senior copy writer for an advertising agency
who excels at summarizing transcript for video ads.
Shorten the transcript by keeping important lines and removing other lines.
Keep the format of the output the same with the input. Do not capitalize sentences, add commas, or rewrite the output
"""

root_prompt_zh = """請將以下這段文字縮短，不要添加任何原本沒有的字，
            所有文字順序要保留，留住的句子必須是和原本一樣的文字，請留下重要的句子，不要添加任何字，
            也不要改寫任何字，請保留至少三句話，其中一句請完整保留最後一句。
            請不要新增標點符號，請按照原本的格式保留
            抗 藍 光 專 利 可 以 帶 來 最 佳 的 晶 亮 保 護 我 們
"""
