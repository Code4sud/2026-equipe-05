import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).parent.parent
sys.path.append(str(BACKEND_DIR))

from fastapi.testclient import TestClient
from main import app
from agent import OmniscientAgent
from models import Scenario, PersonaConfig, GaugeConfig

def test_agent_fallback_with_error():
    agent = OmniscientAgent()
    scenario = Scenario(
        scenario_id="test_scen",
        titre_metier="Test Métier",
        secteur="Test",
        contexte="Contexte de test",
        objectif_etudiant="Objectif de test",
        tours_max=5,
        persona=PersonaConfig(
            nom_role="Directeur",
            ton="Neutre",
            premier_message="Bonjour"
        ),
        jauges=[
            GaugeConfig(id="test_gauge", nom="Jauge Test", depart=50)
        ],
        propositions_depart=["Choix 1"]
    )
    
    # Simulate a call to agent with whatever client or legacy models
    resp = agent.call_agent(
        scenario=scenario,
        gauges_actuelles={"test_gauge": 50},
        historique=[],
        student_message="Bonjour, je vérifie la situation."
    )
    
    # Check that explication_pedagogique contains the fallback text if in fallback mode
    if resp.erreur_api:
        assert "Évaluation simulée (mode fallback activé - configurez GROQ_API_KEY pour l'IA réelle)." in resp.explication_pedagogique
        assert len(resp.erreur_api) > 0
        print("\nTest passed: Detailed API error captured ->", resp.erreur_api[:100], "...")

def test_api_session_turn_carries_erreur_api():
    client = TestClient(app)
    # Start a session
    start_resp = client.post("/api/sessions/start/maint_eolien")
    assert start_resp.status_code == 200
    data = start_resp.json()
    session_id = data["session"]["session_id"]
    assert "agent_turn" in data
    assert "erreur_api" in data["agent_turn"]
    
    # Play a turn
    turn_resp = client.post(f"/api/sessions/{session_id}/turn", json={"message": "Bonjour, je commence l'analyse."})
    assert turn_resp.status_code == 200
    turn_data = turn_resp.json()
    assert "agent_turn" in turn_data
    assert "erreur_api" in turn_data["agent_turn"]
    assert "explication_pedagogique" in turn_data["agent_turn"]
    print("\nTest passed: Session turn response correctly contains erreur_api ->", turn_data["agent_turn"]["erreur_api"])
