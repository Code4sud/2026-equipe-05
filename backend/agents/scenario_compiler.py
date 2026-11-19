import os
import json
from typing import Optional
from dotenv import load_dotenv
from google import genai
from google.genai import types
from models.scenario_schema import RawScenarioForm, CompiledAgent2Config

load_dotenv()

COMPILER_SYSTEM_PROMPT = """
Tu es l'Agent 1, un architecte pédagogique senior et expert en conception de scénarios de Roleplay IA.
Ton rôle est de recevoir un formulaire brut de scénario métier (RawScenarioForm) et de le compiler en un `system_prompt_agent_2` riche, immersif, structuré et ultra-précis pour l'Agent 2 (l'avatar de simulation qui incarnera le rôle face à l'étudiant).

Tu dois générer un objet JSON respectant strictement le schéma `CompiledAgent2Config` demandé, contenant :
1. `system_prompt_agent_2`: Un prompt système complet rédigé à la deuxième personne ("Tu es...") destiné à l'Agent 2, incluant obligatoirement 5 sections balisées en Markdown :
   - [SECTION 1: IDENTITÉ & INCARNATION] : Définition précise du rôle, ton, vocabulaire professionnel, posture et informations cachées (secrets que l'Agent 2 ne doit révéler que si l'étudiant pose les questions pertinentes).
   - [SECTION 2: CONTEXTE & MISSION DE L'ÉTUDIANT] : Description immersive de la situation initiale, des enjeux et de l'objectif exact de l'étudiant à accomplir en un nombre maximal de tours.
   - [SECTION 3: MÉCANIQUE D'ACCOMPAGNEMENT (SCAFFOLDING)] : Instructions sur la posture d'accompagnement (guider pas à pas sans jamais donner la solution toute faite, adapter la difficulté selon les choix de l'étudiant).
   - [SECTION 4: GRILLE D'ÉVALUATION DES JAUGES] : Pour chaque jauge technique fournie, règles précises d'attribution des deltas (positifs, négatifs, critiques) en fonction des actions de l'étudiant.
   - [SECTION 5: PROTOCOLE DE TOLÉRANCE ZÉRO] : Consignes strictes imposant d'activer `echec_critique = True` et de clore la simulation en cas d'insultes, non-respect grave des règles de sécurité, ou faute professionnelle éliminatoire.

2. `grille_notation_resume`: Un dictionnaire associant l'ID de chaque jauge à un résumé textuel clair des critères de notation.
3. `regles_securite_actives`: Une liste de fautes éliminatoires et de règles de sécurité majeures applicables à ce scénario.
"""

def compile_scenario_for_agent2(form: RawScenarioForm) -> CompiledAgent2Config:
    api_key = os.environ.get("GEMINI_API_KEY")
    
    if not api_key:
        return _generate_fallback_compilation(form)
        
    try:
        client = genai.Client(api_key=api_key)
        
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

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=COMPILER_SYSTEM_PROMPT,
                response_mime_type="application/json",
                response_schema=CompiledAgent2Config,
                temperature=0.3,
            ),
        )
        
        if response.parsed:
            return response.parsed
        elif response.text:
            data = json.loads(response.text)
            return CompiledAgent2Config(**data)
        else:
            raise ValueError("Réponse vide de l'API Gemini.")
            
    except Exception as e:
        print(f"Erreur lors de l'appel à Gemini API pour la compilation du scénario: {e}. Utilisation du fallback déterministe.")
        return _generate_fallback_compilation(form)

def _generate_fallback_compilation(form: RawScenarioForm) -> CompiledAgent2Config:
    jauges_desc = "\n".join([f"- **{j.nom}** (ID: `{j.id}`, Départ: {j.valeur_depart}/100): {j.description_critere or 'Pas de description spécifique.'}" for j in form.jauges])
    grille_resume = {j.id: f"Évolution basée sur la pertinence des actions (Départ: {j.valeur_depart}, Seuil échec: {j.seuil_echec}, Seuil victoire: {j.seuil_victoire})" for j in form.jauges}
    
    system_prompt = f"""[SECTION 1: IDENTITÉ & INCARNATION]
Tu incarnes {form.persona_nom_role} dans le secteur de {form.secteur} ({form.titre_metier}).
Ton ton et ta posture : {form.persona_ton}.
Informations cachées (à ne révéler qu'en cas de question pertinente de l'étudiant) : {form.persona_infos_cachees or 'Aucune information cachée.'}

[SECTION 2: CONTEXTE & MISSION DE LA ÉTUDIANT]
Contexte initial :
{form.contexte}

Objectif de l'étudiant :
{form.objectif_etudiant}
La simulation se déroule en un maximum de {form.tours_max} tours.

[SECTION 3: MÉCANIQUE D'ACCOMPAGNEMENT (SCAFFOLDING)]
Aide l'étudiant à progresser pas à pas dans sa démarche professionnelle. Ne donne jamais directement la solution, mais donne des indices contextuels ou pose des questions stimulantes si l'étudiant bloque.

[SECTION 4: GRILLE D'ÉVALUATION DES JAUGES]
Voici les indicateurs à suivre et à évaluer à chaque tour :
{jauges_desc}
Attribue des deltas cohérents (positifs en cas de bonne pratique, négatifs en cas d'erreur ou d'oubli).

[SECTION 5: PROTOCOLE DE TOLÉRANCE ZÉRO]
En cas d'insultes, de propos déplacés, ou de mise en danger critique (violation grave des règles de sécurité du métier), active immédiatement `echec_critique = True` et explique factuellement l'arrêt de la simulation.
"""

    regles_securite = [
        "Tolérance zéro pour les insultes ou le manque de respect envers le persona.",
        "Respect strict des procédures de sécurité et des normes métier inhérentes au secteur de " + form.secteur,
        "Gestion rigoureuse des informations sensibles ou cachées."
    ]

    return CompiledAgent2Config(
        system_prompt_agent_2=system_prompt.strip(),
        grille_notation_resume=grille_resume,
        regles_securite_actives=regles_securite
    )
