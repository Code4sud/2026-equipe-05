import json
from pathlib import Path
from typing import Optional

from models import Scenario
from models.scenario_schema import RawScenarioForm, GaugeDefinition, CompiledScenarioResponse
from agents.scenario_compiler import compile_scenario_for_agent2

SCENARIOS_DIR = Path(__file__).parent / "data" / "scenarios"
COMPILED_DIR = Path(__file__).parent / "data" / "compiled_scenarios"
COMPILED_DIR.mkdir(parents=True, exist_ok=True)


def _clamp(v: Optional[int]) -> Optional[int]:
    return None if v is None else max(0, min(100, v))


def scenario_to_raw_form(s: Scenario) -> RawScenarioForm:
    """Convertit un Scenario (format du Studio) en formulaire brut pour l'Agent 1."""
    return RawScenarioForm(
        titre_metier=s.titre_metier,
        secteur=s.secteur,
        contexte=s.contexte,
        objectif_etudiant=s.objectif_etudiant,
        tours_max=max(1, min(20, s.tours_max)),
        persona_nom_role=s.persona.nom_role,
        persona_ton=s.persona.ton,
        # Les règles d'évaluation n'ont pas de champ dédié : on les passe comme infos confidentielles
        persona_infos_cachees=(
            f"Règles d'évaluation (confidentielles) : {s.regles_evaluation}"
            if s.regles_evaluation
            else None
        ),
        premier_message=s.persona.premier_message,
        jauges=[
            GaugeDefinition(
                id=g.id,
                nom=g.nom,
                valeur_depart=_clamp(g.depart) if g.depart is not None else 50,
                seuil_echec=_clamp(g.seuil_echec),
                seuil_victoire=_clamp(g.seuil_victoire),
            )
            for g in s.jauges
        ],
        propositions_depart=s.propositions_depart,
    )


def ensure_compiled(scenario: Scenario, force: bool = False) -> bool:
    """Compile le scénario avec l'Agent 1 s'il ne l'est pas déjà.
    Ne lève jamais d'exception : en cas d'échec, agent.py utilise son prompt de secours."""
    path = COMPILED_DIR / f"{scenario.scenario_id}.json"
    scenario_file_path = SCENARIOS_DIR / f"{scenario.scenario_id}.json"

    if scenario.system_prompt_agent_2 and path.exists() and not force:
        return True

    try:
        form = scenario_to_raw_form(scenario)
        compiled = compile_scenario_for_agent2(form)
        if compiled and compiled.get("system_prompt_agent_2"):
            scenario.system_prompt_agent_2 = compiled.get("system_prompt_agent_2")

        result = CompiledScenarioResponse(
            scenario_id=scenario.scenario_id, form=form, compiled=compiled
        )
        with open(path, "w", encoding="utf-8") as f:
            json.dump(result.model_dump(), f, ensure_ascii=False, indent=2)

        # Mettre à jour le fichier scénario avec system_prompt_agent_2
        if scenario_file_path.exists():
            with open(scenario_file_path, "w", encoding="utf-8") as f:
                json.dump(scenario.model_dump(), f, ensure_ascii=False, indent=2)

        return True
    except Exception as e:
        print(f"scenario_bridge: compilation impossible pour {scenario.scenario_id} : {e}")
        return False


def compile_all_missing() -> None:
    """Compile tous les scénarios qui n'ont pas encore de config compilée."""
    for file_path in SCENARIOS_DIR.glob("*.json"):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                sc = Scenario(**json.load(f))
            if not (COMPILED_DIR / f"{sc.scenario_id}.json").exists():
                ok = ensure_compiled(sc)
                print(f"[startup] compilation {sc.scenario_id} : {'OK' if ok else 'ÉCHEC'}")
        except Exception as e:
            print(f"[startup] {file_path.name} ignoré : {e}")

