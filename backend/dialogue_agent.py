import json
from typing import Dict, List
from models import Scenario, AgentTurnResponse
from llm import chat_json, get_client

RULES = """
=== RÈGLES TECHNIQUES (priment sur tout le reste) ===
Réponds UNIQUEMENT par un objet JSON avec exactement ces clés :
- "replique_bulle" (str) : ta réplique, courte (2 à 4 phrases), dans ton rôle.
- "humeur_avatar" ("neutral" | "happy" | "angry")
- "deltas_jauges" (objet) : une clé par id de jauge parmi {ids}, valeur entière entre -20 et +20.
- "explication_pedagogique" (str) : 1 à 2 phrases expliquant l'impact de la réponse de l'étudiant.
- "echec_critique" (bool) : true UNIQUEMENT pour une insulte, un propos gravement irrespectueux
  ou une faute mettant en danger la sécurité.
- "propositions_suivantes" (liste de 3 str) : suggestions de réponses de l'étudiant pour le tour suivant.
Ne révèle jamais les seuils de victoire ou d'échec.
"""

class DialogueAgent:
    def call_agent(self, scenario: Scenario, gauges_actuelles: Dict[str, int],
                   historique: List[Dict[str, str]], student_message: str) -> AgentTurnResponse:
        ids = [g.id for g in scenario.jauges]
        system = (
            (scenario.prompt_agent or "")
            + RULES.replace("{ids}", ", ".join(ids))
            + "\nÉtat actuel des jauges : " + json.dumps(gauges_actuelles, ensure_ascii=False)
            + f"\nTour {len(historique)//2 + 1} sur {scenario.tours_max}."
        )
        user = "Historique :\n"
        for h in historique:
            user += f"- {h['role'].upper()} : {h['content']}\n"
        user += f"- ETUDIANT (dernier message) : {student_message}\n\nRéponds en JSON."

        for _ in range(2):  # 1 retry si JSON invalide
            try:
                data = chat_json(system, user, temperature=0.7)
                resp = AgentTurnResponse(**data)
                resp.deltas_jauges = {k: max(-20, min(20, v))
                                      for k, v in resp.deltas_jauges.items() if k in ids}
                resp.propositions_suivantes = (resp.propositions_suivantes + [""] * 3)[:3]
                return resp
            except Exception as e:
                print(f"dialogue_agent: erreur ({e})")

        return self._simulate_fallback(scenario, gauges_actuelles, student_message)

    # Garde ici ta méthode _simulate_fallback actuelle, sans changement.

dialogue_agent = DialogueAgent()