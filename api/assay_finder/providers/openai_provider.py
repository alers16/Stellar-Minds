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

import os
from dotenv import load_dotenv
if __name__ == "__main__":
    load_dotenv()
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "Falta OPENAI_API_KEY en el entorno. Exporta la variable o pásala desde tu gestor de secretos."
        )

    provider = OpenAIProvider(api_key=api_key)

    # Puedes sustituir esto por tu objeto PromptSystem real si lo tienes.
    prompt_system = "Eres un asistente conciso que responde en español."

    # Historial opcional (dejamos vacío en la demo)
    messages_json = []

    # Entrada de usuario de ejemplo
    user_input = "Escribe un haiku corto sobre calistenia y constancia."

    # Parámetros opcionales (como JSON)
    parameters_json = json.dumps({"temperature": 0.2, "max_tokens": 100})

    print("→ Probando llamada a OpenAIProvider.prompt()...\n")
    try:
        text, used_model = provider.prompt(
            model=MODELS.GPT_4O,  # o None para usar el default
            prompt_system=prompt_system,
            messages_json=messages_json,
            user_input=user_input,
            parameters_json=parameters_json,
        )
        print(f"[Modelo] {used_model}\n")
        print("[Respuesta]")
        print(text)
    except Exception as e:
        print("❌ Error durante la prueba:", repr(e))
        raise