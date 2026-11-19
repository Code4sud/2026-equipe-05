import os
import json
from pathlib import Path
from fastapi import APIRouter, HTTPException, status
from models.scenario_schema import RawScenarioForm, CompiledScenarioResponse
from agents.scenario_compiler import compile_scenario_for_agent2

router = APIRouter(prefix="/api/scenarios", tags=["Scenarios Compiler"])

COMPILED_DIR = Path(__file__).parent.parent / "data" / "compiled_scenarios"
COMPILED_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/compile", response_model=CompiledScenarioResponse, status_code=status.HTTP_201_CREATED)
def compile_scenario_endpoint(payload: RawScenarioForm):
    """
    Reçoit un formulaire brut de scénario (RawScenarioForm),
    appelle l'Agent 1 (Scenario Compiler) pour générer la configuration Agent 2,
    sauvegarde le résultat compilé dans backend/data/compiled_scenarios/{scenario_id}.json,
    et retourne l'objet complet.
    """
    try:
        # Génération d'un ID unique propre basé sur le titre métier
        clean_title = "".join(c if c.isalnum() else "_" for c in payload.titre_metier.lower())
        scenario_id = f"{clean_title[:20]}_{os.urandom(3).hex()}"

        # Appel de l'Agent 1
        compiled_config = compile_scenario_for_agent2(payload)

        result = CompiledScenarioResponse(
            scenario_id=scenario_id,
            form=payload,
            compiled=compiled_config
        )

        # Sauvegarde sur disque
        file_path = COMPILED_DIR / f"{scenario_id}.json"
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(result.model_dump(), f, ensure_ascii=False, indent=2)

        return result

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la compilation du scénario : {str(e)}"
        )
