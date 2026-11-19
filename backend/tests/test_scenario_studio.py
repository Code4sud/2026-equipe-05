import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).parent.parent
sys.path.append(str(BACKEND_DIR))

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_validate_scenario_success():
    payload = {
        "titre_metier": "Ingenieur Cloud",
        "secteur": "Informatique",
        "contexte": "Gestion de panne datacenter.",
        "objectif_etudiant": "Retablir le cluster en 15 minutes.",
        "tours_max": 6,
        "persona": {
            "nom_role": "Lead Dev",
            "ton": "Collaboratif",
            "premier_message": "Le cluster est en panne, que faisons-nous ?"
        },
        "regles_evaluation": "Sanctionner toute action non concertee.",
        "jauges": [
            {
                "id": "dispo",
                "nom": "Disponibilite",
                "depart": 80,
                "seuil_echec": 20,
                "seuil_victoire": 95
            }
        ],
        "propositions_depart": [
            "Je consulte d'abord les logs du cluster."
        ]
    }
    response = client.post("/api/scenarios/validate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is True
    assert data["scenario"]["titre_metier"] == "Ingenieur Cloud"

def test_validate_scenario_missing_fields():
    payload = {
        "titre_metier": "Test",
        "secteur": "Informatique"
    }
    response = client.post("/api/scenarios/validate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is False
    assert len(data["errors"]) > 0

def test_create_scenario_success(tmp_path):
    payload = {
        "scenario_id": "test_cloud_eng_01",
        "titre_metier": "Ingenieur Cloud",
        "secteur": "Informatique",
        "contexte": "Panne reseau critique.",
        "objectif_etudiant": "Remettre le reseau en route.",
        "tours_max": 5,
        "persona": {
            "nom_role": "Sysadmin",
            "ton": "Urgent",
            "premier_message": "Aide-moi a diagnostiquer le routeur."
        },
        "regles_evaluation": "Rigueur et methode.",
        "jauges": [
            {
                "id": "uptime",
                "nom": "Uptime",
                "depart": 50,
                "seuil_echec": 0,
                "seuil_victoire": 100
            }
        ],
        "propositions_depart": [
            "Je ping la passerelle par defaut."
        ]
    }
    # Clean up if existing
    from pathlib import Path
    scenarios_dir = Path("backend/data/scenarios")
    test_file = scenarios_dir / "test_cloud_eng_01.json"
    if test_file.exists():
        test_file.unlink()

    response = client.post("/api/scenarios", json=payload)
    assert response.status_code == 201
    created = response.json()
    assert created["scenario_id"] == "test_cloud_eng_01"
    assert test_file.exists()

    # Verify duplicate prevention (HTTP 409)
    response_dup = client.post("/api/scenarios", json=payload)
    assert response_dup.status_code == 409

    # Clean up created test scenario
    if test_file.exists():
        test_file.unlink()
