from typing import List, Dict, Optional
from pydantic import BaseModel, Field

class GaugeDefinition(BaseModel):
    id: str = Field(..., description="Identifiant technique unique de la jauge (ex: securite, technique, relationnel)")
    nom: str = Field(..., description="Nom affiché de la jauge")
    valeur_depart: int = Field(50, ge=0, le=100, description="Valeur initiale de la jauge entre 0 et 100")
    seuil_echec: Optional[int] = Field(None, ge=0, le=100, description="Seuil critique entraînant l'échec si atteint ou franchi")
    seuil_victoire: Optional[int] = Field(None, ge=0, le=100, description="Seuil requis pour valider le succès")
    description_critere: Optional[str] = Field(None, description="Description des critères d'évolution de la jauge")

class RawScenarioForm(BaseModel):
    titre_metier: str = Field(..., description="Titre du métier ou de la situation professionnelle")
    secteur: str = Field(..., description="Secteur d'activité ou domaine")
    contexte: str = Field(..., description="Contexte initial détaillé de la situation")
    objectif_etudiant: str = Field(..., description="Objectif pédagogique assigné à l'étudiant")
    tours_max: int = Field(6, ge=1, le=20, description="Nombre maximal d'échanges (tours) autorisés")
    persona_nom_role: str = Field(..., description="Nom et rôle du personnage incarné par l'Agent 2")
    persona_ton: str = Field(..., description="Ton et posture de communication de l'Agent 2")
    persona_infos_cachees: Optional[str] = Field(None, description="Informations secrètes connues uniquement de l'Agent 2")
    premier_message: str = Field(..., description="Premier message d'introduction de l'Agent 2")
    jauges: List[GaugeDefinition] = Field(..., description="Liste des jauges de progression de la simulation")
    propositions_depart: List[str] = Field(..., description="Suggestions de départ proposées à l'étudiant")

class CompiledAgent2Config(BaseModel):
    system_prompt_agent_2: str = Field(..., description="Prompt système complet et structuré pour l'Agent 2")
    grille_notation_resume: Dict[str, str] = Field(..., description="Résumé des règles d'évolution pour chaque jauge")
    regles_securite_actives: List[str] = Field(..., description="Liste des fautes éliminatoires et règles de sécurité/tolérance zéro")

class CompiledScenarioResponse(BaseModel):
    scenario_id: str = Field(..., description="Identifiant unique du scénario compilé")
    form: RawScenarioForm = Field(..., description="Données brutes du formulaire d'origine")
    compiled: CompiledAgent2Config = Field(..., description="Configuration compilée pour l'Agent 2")
