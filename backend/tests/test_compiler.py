import sys
from pathlib import Path

# Add backend directory to python path so imports work correctly when running test script
BACKEND_DIR = Path(__file__).parent.parent
sys.path.append(str(BACKEND_DIR))

from models.scenario_schema import RawScenarioForm, GaugeDefinition
from agents.scenario_compiler import compile_scenario_for_agent2
from fastapi.testclient import TestClient
from main import app

def test_compiler_direct():
    print("=== TEST 1 : Compilation directe via l'Agent 1 (Scenario Compiler) ===")
    
    sample_form = RawScenarioForm(
        titre_metier="Technicien de maintenance éolienne offshore",
        secteur="Énergies Renouvelables / Industrie",
        contexte="Une tempête approche sur le parc éolien en mer. Une alarme de vibration anormale est signalée sur la turbine E-04. Un technicien junior est sur place et doit effectuer un diagnostic d'urgence.",
        objectif_etudiant="Identifier la cause de la vibration, sécuriser la zone, et décider s'il faut arrêter la turbine avant l'arrivée de la tempête.",
        tours_max=5,
        persona_nom_role="Marc, le Responsable de Site chevronné",
        persona_ton="Direct, pragmatique, exigeant sur la sécurité, mais pédagogue si l'on fait preuve de rigueur.",
        persona_infos_cachees="La pale numéro 2 a subi un impact de foudre non signalé lors de la maintenance de la semaine dernière.",
        premier_message="Bonjour, tu es sur place sur l'éolienne E-04. Les capteurs s'affolent avec la météo qui se dégrade. Qu'est-ce que tu fais en premier ?",
        jauges=[
            GaugeDefinition(
                id="securite",
                nom="Sécurité & EPI",
                valeur_depart=80,
                seuil_echec=20,
                seuil_victoire=None,
                description_critere="Respect des protocoles de consignation et port des EPI."
            ),
            GaugeDefinition(
                id="diagnostic",
                nom="Diagnostic Technique",
                valeur_depart=50,
                seuil_echec=None,
                seuil_victoire=90,
                description_critere="Pertinence des analyses de pannes et inspection des composants."
            ),
            GaugeDefinition(
                id="temps",
                nom="Gestion du Temps",
                valeur_depart=100,
                seuil_echec=0,
                seuil_victoire=None,
                description_critere="Rapidité d'exécution face à l'approche de la tempête."
            )
        ],
        propositions_depart=[
            "Vérifier le journal des alarmes de la nacelle",
            "Descendre immédiatement de la turbine par mesure de précaution",
            "Inspecter visuellement la pale 2 depuis la plateforme"
        ]
    )

    compiled_config = compile_scenario_for_agent2(sample_form)

    print("\n[SUCCÈS] Compilation réussie !")
    print(f"Nombre de règles de sécurité actives : {len(compiled_config.regles_securite_actives)}")
    print(f"Résumé de la grille de notation : {compiled_config.grille_notation_resume}")
    print("\n--- SYSTEM PROMPT AGENT 2 GÉNÉRÉ ---")
    print(compiled_config.system_prompt_agent_2.encode('ascii', errors='replace').decode('ascii'))
    print("---------------------------------------")
    
    assert compiled_config.system_prompt_agent_2 is not None
    assert len(compiled_config.system_prompt_agent_2) > 100
    assert "SECTION 1" in compiled_config.system_prompt_agent_2 or "IDENTITÉ" in compiled_config.system_prompt_agent_2

def test_compiler_api_endpoint():
    print("\n=== TEST 2 : Test de l'Endpoint FastAPI /api/scenarios/compile ===")
    client = TestClient(app)

    payload = {
        "titre_metier": "Chef de projet cybersécurité",
        "secteur": "Technologies de l'Information",
        "contexte": "Une alerte de type ransomware a été détectée sur les serveurs de production critiques de l'entreprise.",
        "objectif_etudiant": "Coordonner la cellule de crise et endiguer la propagation du malware.",
        "tours_max": 6,
        "persona_nom_role": "Élodie, la Directrice des Systèmes d'Information (DSI)",
        "persona_ton": "Stressée mais professionnelle, sous pression de la direction générale.",
        "persona_infos_cachees": "Le vecteur d'attaque est une faille zero-day sur le VPN non patché.",
        "premier_message": "Bonjour, on a un incident critique de chiffrement sur les partages réseau. Qu'est-ce qu'on fait en urgence ?",
        "jauges": [
            {
                "id": "containment",
                "nom": "Endiguement",
                "valeur_depart": 50,
                "seuil_echec": 10,
                "seuil_victoire": 90,
                "description_critere": "Rapidité d'isolement des machines compromises."
            },
            {
                "id": "communication",
                "nom": "Communication de Crise",
                "valeur_depart": 60,
                "seuil_echec": 20,
                "seuil_victoire": 80,
                "description_critere": "Clarté des consignes aux équipes et management."
            }
        ],
        "propositions_depart": [
            "Isoler immédiatement tous les serveurs du réseau",
            "Analyser les logs du pare-feu principal",
            "Alerter la direction générale et le CISO"
        ]
    }

    response = client.post("/api/scenarios/compile", json=payload)
    print(f"Status Code: {response.status_code}")
    data = response.json()
    print(f"Scenario ID généré : {data.get('scenario_id')}")
    print(f"Fichier sauvegardé et configuration Agent 2 reçue avec succès.")
    
    assert response.status_code == 201
    assert "scenario_id" in data
    assert "compiled" in data
    assert "system_prompt_agent_2" in data["compiled"]

if __name__ == "__main__":
    test_compiler_direct()
    test_compiler_api_endpoint()
    print("\nTous les tests du module de compilation ont réussi avec succès !")
