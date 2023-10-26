"""LLM Module to define LLM models, and generate prompts"""

from vertexai.preview.language_models import TextGenerationModel


def send_transcript_to_llm(text: str,
                           model: str = "text-bison@001",
                           temperature: float = 0.1,
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
  # The best perfoming model for AdClip is currently "text-bison@001"
  model = TextGenerationModel.from_pretrained(model)
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