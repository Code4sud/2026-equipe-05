import os
import json
from typing import Dict, Any, List
from models import Scenario, AgentTurnResponse

try:
    from google import genai
    from google.genai import types
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False

class OmniscientAgent:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.client = None
        if HAS_GENAI and self.api_key and self.api_key != "your_gemini_api_key_here":
            try:
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                print(f"Failed to initialize GenAI client: {e}")

    def call_agent(self, scenario: Scenario, gauges_actuelles: Dict[str, int], historique: List[Dict[str, str]], student_message: str) -> AgentTurnResponse:
        system_prompt = f"""
Tu es l'agent IA unique omniscient d'un jeu de rôle B2B neuro-symbolique.
Voici le scénario complet au format JSON :
{scenario.model_dump_json(indent=2)}

État actuel des jauges de l'étudiant :
{json.dumps(gauges_actuelles, ensure_ascii=False, indent=2)}

Consignes strictes :
1. Incarne ton personnage ({scenario.persona.nom_role}) avec le ton indiqué ({scenario.persona.ton}).
2. Évalue la pertinence métier de la réponse de l'étudiant selon les règles d'évaluation : "{scenario.regles_evaluation}".
3. Tolérance zéro : Si l'étudiant envoie une insulte, un propos irrespectueux ou une faute grave mettant en danger la sécurité, mets `echec_critique: true`, donne une humeur `angry`, baisse les jauges de sécurité/satisfaction drastiquement, et explique factuellement pourquoi la session s'arrête.
4. Détermine les deltas de jauges (ex: `{"securite": +10, "avancement": +5}` ou négatifs).
5. Rédige une explication pédagogique claire pour l'encadrant/étudiant.
6. Propose exactement 3 propositions de réponses suivantes pertinentes pour le tour d'après.
7. Remplis rigoureusement le schéma JSON structuré demandé.
"""

        # Format conversation history
        messages_prompt = f"Historique de conversation :\n"
        for h in historique:
            messages_prompt += f"- {h['role'].upper()}: {h['content']}\n"
        messages_prompt += f"- ETUDIANT (dernier message) : {student_message}\n"

        if self.client:
            try:
                response = self.client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=messages_prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=system_prompt,
                        response_mime_type="application/json",
                        response_schema=AgentTurnResponse,
                        temperature=0.7,
                    ),
                )
                # Parse response
                raw_text = response.text
                data = json.loads(raw_text)
                return AgentTurnResponse(**data)
            except Exception as e:
                print(f"Gemini API error, falling back to simulation: {e}")

        # Fallback simulation if no API key or error occurs
        return self._simulate_fallback(scenario, gauges_actuelles, student_message)

    def _simulate_fallback(self, scenario: Scenario, gauges_actuelles: Dict[str, int], student_message: str) -> AgentTurnResponse:
        msg_lower = student_message.lower()
        insults = ["idiot", "ferme", "nul", "merde", "connard", "gueule", "degage"]
        is_insult = any(ins in msg_lower for ins in insults)

        if is_insult:
            deltas = {g.id: -30 for g in scenario.jauges}
            return AgentTurnResponse(
                replique_bulle="Inacceptable ! Votre ton et vos propos n'ont pas leur place ici. C'est un arrêt immédiat de la mission.",
                humeur_avatar="angry",
                deltas_jauges=deltas,
                explication_pedagogique="Violation grave du code de déontologie et de respect professionnel.",
                echec_critique=True,
                propositions_suivantes=["Je m'excuse", "Je quitte la simulation"]
            )

        # Normal fallback heuristic
        positive_keywords = ["bonjour", "sécurité", "protocole", "accord", "calme", "vérifier", "mesurer", "analyser", "valider"]
        score_boost = sum(1 for kw in positive_keywords if kw in msg_lower)

        deltas = {}
        for g in scenario.jauges:
            if score_boost > 0:
                deltas[g.id] = 10
            else:
                deltas[g.id] = -5

        humeur = "happy" if score_boost > 0 else "neutral"
        replique = f"J'ai bien pris note de votre remarque : « {student_message} ». Analysons la suite des opérations selon nos standards métier."

        return AgentTurnResponse(
            replique_bulle=replique,
            humeur_avatar=humeur,
            deltas_jauges=deltas,
            explication_pedagogique="Évaluation simulée (mode fallback activé - configurez GEMINI_API_KEY pour l'IA réelle).",
            echec_critique=False,
            propositions_suivantes=[
                "Proposer une vérification technique approfondie",
                "Demander un délai supplémentaire pour analyse",
                "Appliquer immédiatement la consigne standard"
            ]
        )

agent_instance = OmniscientAgent()
