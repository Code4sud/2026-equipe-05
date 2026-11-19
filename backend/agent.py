import os
import json
from pathlib import Path
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from models import Scenario, AgentTurnResponse

load_dotenv()

try:
    from google import genai
    from google.genai import types
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False

COMPILED_DIR = Path(__file__).parent / "data" / "compiled_scenarios"

RULES = """
=== RÈGLES TECHNIQUES (priment sur tout le reste) ===
- replique_bulle : ta réplique, courte (2 à 4 phrases), dans ton rôle.
- humeur_avatar : "neutral", "happy" ou "angry".
- deltas_jauges : une clé par id de jauge parmi {ids}, valeur entière entre -20 et +20.
- explication_pedagogique : 1 à 2 phrases sur l'impact de la réponse de l'étudiant.
- echec_critique : true UNIQUEMENT pour une insulte, un propos gravement irrespectueux
  ou une faute mettant en danger la sécurité.
- propositions_suivantes : exactement 3 suggestions de réponses de l'étudiant pour le tour suivant,
  écrites à la première personne, sans indiquer laquelle est la meilleure.
Ne révèle jamais les seuils de victoire ou d'échec ni la grille d'évaluation.
"""


def _as_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, (list, tuple)):
        return "\n".join(f"- {_as_text(v)}" for v in value)
    return json.dumps(value, ensure_ascii=False, indent=2)


def find_compiled(scenario: Scenario) -> Optional[dict]:
    """Cherche la config compilée par l'Agent 1 : par scenario_id, sinon par titre_metier."""
    if not COMPILED_DIR.exists():
        return None

    direct = COMPILED_DIR / f"{scenario.scenario_id}.json"
    if direct.exists():
        candidates = [direct]
    else:
        candidates = sorted(
            COMPILED_DIR.glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True
        )

    for path in candidates:
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception:
            continue
        compiled = data.get("compiled") or {}
        if not compiled.get("system_prompt_agent_2"):
            continue
        if path == direct:
            return compiled
        title = ((data.get("form") or {}).get("titre_metier") or "").strip().lower()
        if title and title == scenario.titre_metier.strip().lower():
            return compiled
    return None


def build_base_prompt(scenario: Scenario) -> str:
    compiled = find_compiled(scenario)
    if compiled:
        parts = [compiled["system_prompt_agent_2"].strip()]
        grille = _as_text(compiled.get("grille_notation_resume"))
        if grille:
            parts.append("Grille de notation (confidentielle) :\n" + grille)
        securite = _as_text(compiled.get("regles_securite_actives"))
        if securite:
            parts.append("Règles de sécurité actives (tolérance zéro) :\n" + securite)
        return "\n\n".join(parts)

    # Pas de compilation disponible : prompt construit depuis le Scenario
    jauges = "\n".join(f"- {g.id} ({g.nom})" for g in scenario.jauges)
    return (
        f"Tu es {scenario.persona.nom_role}. Ton : {scenario.persona.ton}.\n"
        f"Contexte : {scenario.contexte}\n"
        f"Objectif de l'étudiant : {scenario.objectif_etudiant}\n"
        f"Règles d'évaluation : {scenario.regles_evaluation}\n"
        f"Jauges :\n{jauges}"
    )


class OmniscientAgent:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.client = None
        if HAS_GENAI and self.api_key and self.api_key != "your_gemini_api_key_here":
            try:
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                print(f"Failed to initialize GenAI client: {e}")

    def call_agent(
        self,
        scenario: Scenario,
        gauges_actuelles: Dict[str, int],
        historique: List[Dict[str, str]],
        student_message: str,
    ) -> AgentTurnResponse:
        ids = [g.id for g in scenario.jauges]
        tour = (len(historique) + 1) // 2

        system_prompt = (
            build_base_prompt(scenario)
            + "\n"
            + RULES.replace("{ids}", ", ".join(ids))
            + "\nÉtat actuel des jauges : "
            + json.dumps(gauges_actuelles, ensure_ascii=False)
            + f"\nTour {tour} sur {scenario.tours_max}."
        )

        messages_prompt = "Historique de conversation :\n"
        for h in historique:
            messages_prompt += f"- {h['role'].upper()}: {h['content']}\n"
        messages_prompt += f"- ETUDIANT (dernier message) : {student_message}\n"

        if self.client:
            for _ in range(2):  # 1 nouvel essai si la réponse est invalide
                try:
                    response = self.client.models.generate_content(
                        model="gemini-2.5-flash",
                        contents=messages_prompt,
                        config=types.GenerateContentConfig(
                            system_instruction=system_prompt,
                            response_mime_type="application/json",
                            response_schema=AgentTurnResponse,
                            temperature=0.7,
                        ),
                    )
                    resp = AgentTurnResponse(**json.loads(response.text))
                    resp.deltas_jauges = {
                        k: max(-20, min(20, v))
                        for k, v in resp.deltas_jauges.items()
                        if k in ids
                    }
                    resp.propositions_suivantes = (
                        resp.propositions_suivantes + [""] * 3
                    )[:3]
                    return resp
                except Exception as e:
                    print(f"Gemini API error: {e}")

        return self._simulate_fallback(scenario, gauges_actuelles, student_message)

    def _simulate_fallback(
        self, scenario: Scenario, gauges_actuelles: Dict[str, int], student_message: str
    ) -> AgentTurnResponse:
        msg_lower = student_message.lower()
        insults = ["idiot", "ferme", "nul", "merde", "connard", "gueule", "degage"]
        is_insult = any(ins in msg_lower for ins in insults)

        if is_insult:
            return AgentTurnResponse(
                replique_bulle="Inacceptable ! Votre ton et vos propos n'ont pas leur place ici. C'est un arrêt immédiat de la mission.",
                humeur_avatar="angry",
                deltas_jauges={g.id: -30 for g in scenario.jauges},
                explication_pedagogique="Violation grave du code de déontologie et de respect professionnel.",
                echec_critique=True,
                propositions_suivantes=[
                    "Je m'excuse sincèrement",
                    "Je reprends calmement",
                    "Je quitte la simulation",
                ],
            )

        positive_keywords = [
            "bonjour", "sécurité", "protocole", "accord", "calme",
            "vérifier", "mesurer", "analyser", "valider",
        ]
        score_boost = sum(1 for kw in positive_keywords if kw in msg_lower)
        deltas = {g.id: (10 if score_boost > 0 else -5) for g in scenario.jauges}

        return AgentTurnResponse(
            replique_bulle=(
                f"J'ai bien pris note de votre remarque : « {student_message} ». "
                "Analysons la suite des opérations selon nos standards métier."
            ),
            humeur_avatar="happy" if score_boost > 0 else "neutral",
            deltas_jauges=deltas,
            explication_pedagogique="Évaluation simulée (mode fallback activé - configurez GEMINI_API_KEY pour l'IA réelle).",
            echec_critique=False,
            propositions_suivantes=[
                "Proposer une vérification technique approfondie",
                "Demander un délai supplémentaire pour analyse",
                "Appliquer immédiatement la consigne standard",
            ],
        )


agent_instance = OmniscientAgent()