import os
import json
from pathlib import Path
from typing import List
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from models import Scenario, ScenarioCreateRequest, TurnRequest, SessionState, AgentTurnResponse
from engine import engine_instance
from agent import agent_instance
import threading
from scenario_bridge import ensure_compiled, compile_all_missing
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Au démarrage : compilation en arrière-plan des scénarios pas encore compilés
    threading.Thread(target=compile_all_missing, daemon=True).start()
    yield
    # Ici, on pourrait mettre du code d'arrêt si besoin

app = FastAPI(title="Agora Roleplay Studio API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from api.compiler_routes import router as compiler_router
app.include_router(compiler_router)

SCENARIOS_DIR = Path(__file__).parent / "data" / "scenarios"
SCENARIOS_DIR.mkdir(parents=True, exist_ok=True)

def load_scenario_from_file(file_path: Path) -> Scenario:
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        return Scenario(**data)

@app.get("/api/scenarios", response_model=List[Scenario])
def get_scenarios():
    scenarios = []
    if SCENARIOS_DIR.exists():
        for file_path in SCENARIOS_DIR.glob("*.json"):
            try:
                scenarios.append(load_scenario_from_file(file_path))
            except Exception as e:
                print(f"Error loading {file_path}: {e}")
    return scenarios

@app.post("/api/scenarios", response_model=Scenario, status_code=status.HTTP_201_CREATED)
def create_scenario(payload: ScenarioCreateRequest):
    scenario_id = payload.scenario_id
    if not scenario_id:
        # Generate clean ID from titre_metier
        scenario_id = "".join(c if c.isalnum() else "_" for c in payload.titre_metier.lower())
        scenario_id = f"{scenario_id[:20]}_{os.urandom(2).hex()}"
    
    data = payload.model_dump()
    data["scenario_id"] = scenario_id
    scenario = Scenario(**data)

    file_path = SCENARIOS_DIR / f"{scenario_id}.json"
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(scenario.model_dump(), f, ensure_ascii=False, indent=2)

    # NOUVEAU : Agent 1 compile le scénario (même scenario_id)
    ensure_compiled(scenario)

    return scenario

@app.post("/api/sessions/start/{scenario_id}", response_model=dict)
def start_session(scenario_id: str):
    file_path = SCENARIOS_DIR / f"{scenario_id}.json"
    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"Scénario {scenario_id} introuvable.")
    
    scenario = load_scenario_from_file(file_path)

    # NOUVEAU : scénarios écrits à la main ou jamais compilés (sans effet s'ils le sont déjà)
    ensure_compiled(scenario)

    session = engine_instance.create_session(scenario)

    # Initial response containing first message from persona
    first_msg = scenario.persona.premier_message
    session.historique.append({"role": "avatar", "content": first_msg})

    return {
        "session": session,
        "agent_turn": {
            "replique_bulle": first_msg,
            "humeur_avatar": "neutral",
            "deltas_jauges": {g.id: 0 for g in scenario.jauges},
            "explication_pedagogique": "Début de la simulation. Analysez la situation et engagez la conversation.",
            "echec_critique": False,
            "propositions_suivantes": scenario.propositions_depart,
            "erreur_api": None,
        }
    }

@app.post("/api/sessions/{session_id}/turn", response_model=dict)
def play_turn(session_id: str, payload: TurnRequest):
    session = engine_instance.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session active introuvable.")
    
    if session.statut != "EN_COURS":
        raise HTTPException(status_code=400, detail="La session est déjà terminée.")

    # Call agent
    agent_resp: AgentTurnResponse = agent_instance.call_agent(
        scenario=session.scenario,
        gauges_actuelles=session.jauges_actuelles,
        historique=session.historique,
        student_message=payload.message
    )

    # Update engine
    updated_session = engine_instance.process_turn(session_id, payload.message, agent_resp)

    return {
        "session": updated_session,
        "agent_turn": agent_resp.model_dump()
    }


@app.get("/api/sessions/{session_id}", response_model=SessionState)
def get_session_state(session_id: str):
    session = engine_instance.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session introuvable.")
    return session

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)