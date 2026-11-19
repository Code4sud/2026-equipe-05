import os
import json
import concurrent.futures
from pathlib import Path
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from models import Scenario, AgentTurnResponse

ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")
load_dotenv(Path(__file__).resolve().parent / ".env")
load_dotenv()

try:
    from openai import OpenAI
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False

GROQ_BASE_URL = "https://api.groq.com/openai/v1"
GROQ_MODELS = [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.8-27b",
]

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
    if scenario.system_prompt_agent_2:
        return scenario.system_prompt_agent_2.strip()

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
        self.api_key = None
        self.client = None
        self.init_error = None
        self._init_client()

    def _init_client(self):
        self.api_key = os.getenv("GROQ_API_KEY") or os.getenv("GROK_API_KEY")
        self.client = None
        self.init_error = None
        if not HAS_OPENAI:
            self.init_error = "Bibliothèque 'openai' non installée (pip install openai)."
            return
        if not self.api_key or self.api_key in ("your_groq_api_key_here", "your_grok_api_key_here"):
            self.init_error = "Clé GROQ_API_KEY non configurée dans le fichier .env."
            return
        try:
            self.client = OpenAI(
                api_key=self.api_key,
                base_url=GROQ_BASE_URL,
            )
        except Exception as e:
            self.init_error = f"Échec de l'initialisation du client Groq : {str(e).strip()}"
            print(f"Failed to initialize Groq client: {e}")

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
            + "\n\nRéponds UNIQUEMENT avec un objet JSON valide sans balises markdown ni texte autour."
        )

        messages_prompt = "Historique de conversation :\n"
        for h in historique:
            messages_prompt += f"- {h['role'].upper()}: {h['content']}\n"
        messages_prompt += f"- ETUDIANT (dernier message) : {student_message}\n"

        if not self.client:
            self._init_client()

        api_error_detail: Optional[str] = None
        if self.init_error and not self.client:
            api_error_detail = self.init_error

        if self.client:
            model_errors: List[str] = []
            for m in GROQ_MODELS:
                try:
                    def _run(model=m):
                        return self.client.chat.completions.create(
                            model=model,
                            messages=[
                                {"role": "system", "content": system_prompt},
                                {"role": "user", "content": messages_prompt},
                            ],
                            temperature=0.7,
                            response_format={"type": "json_object"},
                        )

                    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                        future = executor.submit(_run)
                        response = future.result(timeout=30)

                    text = response.choices[0].message.content.strip()
                    if text.startswith("```json"):
                        text = text[7:]
                    if text.startswith("```"):
                        text = text[3:]
                    if text.endswith("```"):
                        text = text[:-3]
                    text = text.strip()

                    resp = AgentTurnResponse(**json.loads(text))
                    resp.deltas_jauges = {
                        k: max(-20, min(20, v))
                        for k, v in resp.deltas_jauges.items()
                        if k in ids
                    }
                    resp.propositions_suivantes = (
                        resp.propositions_suivantes + [""] * 3
                    )[:3]
                    resp.erreur_api = None
                    return resp
                except Exception as e:
                    err_msg = str(e).strip() or repr(e)
                    print(f"Groq API error with model {m}: {err_msg}")
                    model_errors.append(f"[{m}] {err_msg}")
                    continue

            if model_errors:
                api_error_detail = "\n".join(model_errors)

        return self._simulate_fallback(
            scenario,
            gauges_actuelles,
            student_message,
            erreur_api=api_error_detail,
        )

    def _simulate_fallback(
        self,
        scenario: Scenario,
        gauges_actuelles: Dict[str, int],
        student_message: str,
        erreur_api: Optional[str] = None,
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
                erreur_api=erreur_api,
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
            explication_pedagogique="Évaluation simulée (mode fallback activé - configurez GROQ_API_KEY pour l'IA réelle).",
            echec_critique=False,
            propositions_suivantes=[
                "Proposer une vérification technique approfondie",
                "Demander un délai supplémentaire pour analyse",
                "Appliquer immédiatement la consigne standard",
            ],
            erreur_api=erreur_api,
        )


agent_instance = OmniscientAgent()
