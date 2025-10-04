import json
import openai

from enum import Enum

from .api_provider import APIProvider
from ..prompt_formatters import OpenAIFormatter

class MODELS(str, Enum):
    GPT_3_5_TURBO = "gpt-3.5-turbo"
    GPT_4 = "gpt-4"
    GPT_4O = "gpt-4o"


class OpenAIProvider(APIProvider):

    def __init__(self, api_key):
        self.client = openai.OpenAI(api_key=api_key)
        self.formatter = OpenAIFormatter()

    def prompt(self, model, prompt_system, messages_json, user_input, parameters_json):       
        if not model:
            model = MODELS.GPT_3_5_TURBO

        messages = self.formatter.format(prompt_system, messages_json, user_input)
        parameters = json.loads(parameters_json) if parameters_json else {}
        final_parameters = {
            "temperature": parameters.get("temperature", 0.0),
            "max_tokens": parameters.get("max_tokens", 60)
        }

        response = self.client.chat.completions.create(model=model, messages=messages, **final_parameters)

        return response.choices[0].message.content, model
        
    def get_active_models(self):
        return [m.value for m in MODELS]