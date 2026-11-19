import uuid
from typing import Dict, List, Optional
from models import Scenario, SessionState, AgentTurnResponse

class GameEngine:
    def __init__(self):
        self.sessions: Dict[str, SessionState] = {}

    def create_session(self, scenario: Scenario) -> SessionState:
        session_id = str(uuid.uuid4())[:8]
        jauges_init = {gauge.id: gauge.depart for gauge in scenario.jauges}
        
        session = SessionState(
            session_id=session_id,
            scenario_id=scenario.scenario_id,
            scenario=scenario,
            tour_actuel=1,
            jauges_actuelles=jauges_init,
            historique=[],
            statut="EN_COURS",
            message_fin=None
        )
        self.sessions[session_id] = session
        return session

    def get_session(self, session_id: str) -> Optional[SessionState]:
        return self.sessions.get(session_id)

    def process_turn(self, session_id: str, student_message: str, agent_response: AgentTurnResponse) -> SessionState:
        session = self.get_session(session_id)
        if not session or session.statut != "EN_COURS":
            raise ValueError("Session invalide ou terminée.")

        # 1. Update history
        session.historique.append({"role": "etudiant", "content": student_message})
        session.historique.append({"role": "avatar", "content": agent_response.replique_bulle})

        # 2. Check critical failure
        if agent_response.echec_critique:
            session.statut = "DEFAITE"
            session.message_fin = f"Échec critique immédiat : {agent_response.explication_pedagogique}"
            return session

        # 3. Apply deltas to gauges
        for gauge_id, delta in agent_response.deltas_jauges.items():
            if gauge_id in session.jauges_actuelles:
                current_val = session.jauges_actuelles[gauge_id]
                new_val = max(0, min(100, current_val + delta))
                session.jauges_actuelles[gauge_id] = new_val

        # 4. Check thresholds (Failure or Victory)
        for gauge in session.scenario.jauges:
            val = session.jauges_actuelles[gauge.id]
            if gauge.seuil_echec is not None and val <= gauge.seuil_echec:
                session.statut = "DEFAITE"
                session.message_fin = f"Critère critique '{gauge.nom}' tombé sous le seuil d'alerte ({val} <= {gauge.seuil_echec})."
                return session

        # Victoire anticipée : si toutes les jauges à seuil de victoire ont atteint leur cible
        victory_gauges = [g for g in session.scenario.jauges if g.seuil_victoire is not None]
        if victory_gauges and all(session.jauges_actuelles[g.id] >= g.seuil_victoire for g in victory_gauges):
            session.statut = "VICTOIRE"
            session.message_fin = "Félicitations ! Vous avez atteint l'ensemble des critères de réussite de la mission."
            return session

        # 5. Increment turn or check max tours
        session.tour_actuel += 1
        if session.tour_actuel > session.scenario.tours_max:
            # Évaluation en fin de mission
            if victory_gauges and all(session.jauges_actuelles[g.id] >= g.seuil_victoire for g in victory_gauges):
                session.statut = "VICTOIRE"
                session.message_fin = "Mission accomplie avec succès à l'issue du temps imparti."
            elif all(session.jauges_actuelles[g.id] >= 60 for g in session.scenario.jauges):
                session.statut = "VICTOIRE"
                session.message_fin = "Fin de mission : bilan très honorable, vous avez démontré les compétences clés du métier !"
            else:
                session.statut = "DEFAITE"
                session.message_fin = f"Nombre maximal d'échanges ({session.scenario.tours_max}) atteint sans valider l'ensemble des critères."
            return session

        return session

engine_instance = GameEngine()
