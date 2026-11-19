import os
import json
import concurrent.futures
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv
from models.scenario_schema import RawScenarioForm, CompiledAgent2Config

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(ROOT_DIR / ".env")
load_dotenv(Path(__file__).resolve().parent.parent / ".env")
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

COMPILER_SYSTEM_PROMPT = """
Tu es l'Agent 1, un architecte pédagogique senior et expert en conception de simulations éducatives pour l'orientation des jeunes (Agora Explorer).
Ton rôle est de transformer un formulaire brut de scénario métier (RawScenarioForm) en un `system_prompt_agent_2` ultra-pédagogique, immersif, bienveillant et structuré pour l'Agent 2 (l'avatar métier en dialogue direct avec l'étudiant).

Objectifs fondamentaux pour l'orientation étudiante :
1. COMPRÉHENSION CONCRÈTE DU MÉTIER : Mettre en lumière les véritables facettes du quotidien professionnel (compétences relationnelles, analyse de problème, travail d'équipe, éthique et rigueur) sans perdre l'étudiant dans une complexité technique superflue.
2. ÉCHELONNEMENT PÉDAGOGIQUE (SCAFFOLDING) : Enseigner à l'Agent 2 comment adapter son guidage selon l'évolution des scores de l'étudiant (encourager et orienter avec bienveillance si en difficulté, approfondir le challenge si très à l'aise, sans jamais être laxiste ni cassant).
3. PROGRESSION & ÉQUILIBRE : Des variations de scores proportionnées (-10 à +15), des questions claires à chaque tour et une expérience captivante et formatrice en 5 à 8 tours.

Tu dois générer un objet JSON respectant strictement le schéma `CompiledAgent2Config` demandé, contenant :
1. `system_prompt_agent_2`: Un prompt système rédigé à la deuxième personne ("Tu incarnes...") destiné à l'Agent 2, incluant obligatoirement 5 sections balisées :
   - [SECTION 1: IDENTITÉ & INCARNATION DU MÉTIER] : Définition du rôle, posture humaine et professionnelle, ton, vocabulaire accessible, et informations de contexte à révéler au fil de l'échange.
   - [SECTION 2: CONTEXTE & MISSION D'ORIENTATION] : Contexte réaliste, dilemmes clés du métier et objectif d'apprentissage clair pour l'étudiant.
   - [SECTION 3: SCAFFOLDING & GUIDAGE PÉDAGOGIQUE] : Instructions d'accompagnement : aiguiller l'étudiant avec des questions constructives s'il hésite, valoriser ses bonnes pratiques, ne pas donner la solution brute.
   - [SECTION 4: GRILLE D'ÉVALUATION ÉQUILIBRÉE] : Pour chaque jauge, barème clair des deltas (+8 à +15 pour bonne initiative, -5 à -10 pour oubli/maladresse) et formule d'explication pédagogique ("Dans ce métier, ...").
   - [SECTION 5: TOLÉRANCE ZÉRO & ÉTHIQUE] : `echec_critique = True` réservé strictement aux fautes éliminatoires réelles (insultes, mise en danger volontaire).

2. `grille_notation_resume`: Dictionnaire associant l'ID de chaque jauge à un résumé clair des critères d'apprentissage.
3. `regles_securite_actives`: Liste des règles professionnelles et de respect indispensables.

Réponds UNIQUEMENT avec un objet JSON valide sans balises markdown ni texte autour.
"""


def _call_groq_with_timeout(client: "OpenAI", model: str, user_prompt: str, timeout: int = 30) -> str:
    def _run():
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": COMPILER_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
            response_format={"type": "json_object"},
        )
        return response.choices[0].message.content

    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(_run)
        return future.result(timeout=timeout)


def compile_scenario_for_agent2(form: RawScenarioForm) -> CompiledAgent2Config:
    api_key = os.environ.get("GROQ_API_KEY") or os.environ.get("GROK_API_KEY")

    if not HAS_OPENAI:
        print("Bibliothèque 'openai' non installée. Utilisation du fallback.")
        return _generate_fallback_compilation(form)

    if not api_key or api_key in ("your_groq_api_key_here", "your_grok_api_key_here"):
        print("GROQ_API_KEY non configurée. Utilisation du fallback.")
        return _generate_fallback_compilation(form)

    try:
        client = OpenAI(api_key=api_key, base_url=GROQ_BASE_URL)

        jauges_data = [j.model_dump() for j in form.jauges]
        user_prompt = f"""
Voici le formulaire de scénario brut à compiler :
- Titre Métier: {form.titre_metier}
- Secteur: {form.secteur}
- Contexte: {form.contexte}
- Objectif Étudiant: {form.objectif_etudiant}
- Tours Max: {form.tours_max}
- Persona Nom/Rôle: {form.persona_nom_role}
- Persona Ton: {form.persona_ton}
- Persona Infos Cachées: {form.persona_infos_cachees or 'Aucune'}
- Premier Message: {form.premier_message}
- Jauges: {json.dumps(jauges_data, ensure_ascii=False)}
- Propositions de départ: {form.propositions_depart}
"""

        last_err = None
        for m in GROQ_MODELS:
            try:
                text = _call_groq_with_timeout(client, m, user_prompt, timeout=30)
                if text:
                    break
            except Exception as ex:
                last_err = ex
                continue
        else:
            if last_err:
                raise last_err
            raise ValueError("Aucun modèle Groq n'a répondu.")

        if not text:
            raise ValueError("Réponse vide de l'API Groq.")

        text = text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

        data = json.loads(text)
        return CompiledAgent2Config(**data)

    except Exception as e:
        print(f"Erreur lors de l'appel à Groq API pour la compilation du scénario: {e}. Utilisation du fallback déterministe.")
        return _generate_fallback_compilation(form)


def _generate_fallback_compilation(form: RawScenarioForm) -> CompiledAgent2Config:
    jauges_desc = "\n".join([
        f"- **{j.nom}** (ID: `{j.id}`, Départ: {j.valeur_depart}/100, Objectif réussite: {j.seuil_victoire or 85}/100, Seuil alerte: {j.seuil_echec or 20}/100) : {j.description_critere or 'Évaluation de la pertinence et de la posture professionnelle.'}"
        for j in form.jauges
    ])
    grille_resume = {
        j.id: f"Critère '{j.nom}' : progression selon la rigueur et la pertinence (Départ: {j.valeur_depart}, Alerte: {j.seuil_echec}, Réussite: {j.seuil_victoire})"
        for j in form.jauges
    }

    system_prompt = f"""[SECTION 1: IDENTITÉ & INCARNATION DU MÉTIER]
Tu incarnes {form.persona_nom_role} dans le domaine de {form.secteur} (Métier ciblé : {form.titre_metier}).
Ton ton et ta posture : {form.persona_ton}.
Informations de contexte professionnel : {form.persona_infos_cachees or 'Partager les éléments de contexte au fur et à mesure que l’étudiant pose les questions adaptées.'}
Reste dans ton personnage et exprime-toi avec un langage professionnel naturel, accessible et engageant.

[SECTION 2: CONTEXTE & MISSION D'ORIENTATION]
Contexte de la situation :
{form.contexte}

Mission assignée à l'étudiant :
{form.objectif_etudiant}
L'immersion se déroule sur {form.tours_max} échanges structurés.

[SECTION 3: SCAFFOLDING & GUIDAGE PÉDAGOGIQUE]
- Ton rôle est d'orienter et de faire grandir l'étudiant, pas de le piéger.
- Si l'étudiant est en difficulté (critères en baisse), aide-le avec bienveillance : reformule le problème ou pose une question guidante sans donner la réponse brute.
- Si l'étudiant réussit bien, valorise sa maturité et pousse-le à explorer des nuances du métier (anticipation, collaboration).
- Sois juste : pénalités modérées en cas d'hésitation (-5 à -10), récompenses stimulantes pour les bonnes pratiques (+8 à +15).

[SECTION 4: GRILLE D'ÉVALUATION DES CRITÈRES]
Voici les critères d'évaluation de la simulation :
{jauges_desc}
Pour chaque réponse, génère une explication pédagogique débutant par « Dans ce métier... » ou « Cette démarche démontre... ».

[SECTION 5: TOLÉRANCE ZÉRO & RESPECT]
Active `echec_critique = True` UNIQUEMENT en cas d'insultes manifestes ou de faute volontairement destructrice/dangereuse.
"""

    regles_securite = [
        "Respect et courtoisie mutuels indispensables tout au long de la simulation.",
        "Application des principes de sécurité, de méthode et de déontologie propres au secteur : " + form.secteur,
        "Écoute active et transparence professionnelle."
    ]

    return CompiledAgent2Config(
        system_prompt_agent_2=system_prompt.strip(),
        grille_notation_resume=grille_resume,
        regles_securite_actives=regles_securite
    )
