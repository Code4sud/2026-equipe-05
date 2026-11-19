import os, json
from groq import Groq

MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
_client = None

def get_client():
    global _client
    key = os.getenv("GROQ_API_KEY")
    if _client is None and key:
        _client = Groq(api_key=key)
    return _client

def chat_json(system: str, user: str, temperature: float = 0.5) -> dict:
    """Appelle Groq en mode JSON. Lève une exception si pas de clé ou JSON invalide."""
    client = get_client()
    if client is None:
        raise RuntimeError("GROQ_API_KEY manquante")
    resp = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "system", "content": system},
                  {"role": "user", "content": user}],
        response_format={"type": "json_object"},
        temperature=temperature,
    )
    return json.loads(resp.choices[0].message.content)