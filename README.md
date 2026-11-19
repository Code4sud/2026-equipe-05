# Agora Roleplay Studio

Application Web B2B de création et de simulation de jeux de rôle (Roleplay) métiers pilotée par une architecture neuro-symbolique.

## ⚡ Architecture & Fonctionnement

- **Backend** : [`backend/main.py`](backend/main.py) (FastAPI, Pydantic v2, SDK `google-genai` avec `gemini-2.5-flash` et Structured Outputs, mode fallback simulé intégré si `GEMINI_API_KEY` est absent).
- **Stockage** : Fichiers JSON unifiés (`ScenarioDocument`) dans [`backend/data/scenarios/`](backend/data/scenarios/).
- **Frontend** : [`frontend/`](frontend/) (React 18, Vite, TypeScript, Tailwind CSS, `lucide-react`).
- **Principe Neuro-Symbolique** :
  1. L'Agent 1 (`backend/agents/scenario_compiler.py`) compile le formulaire du studio en un prompt système unifié (`system_prompt_agent_2`).
  2. L'Agent 2 (`backend/agent.py`) anime l'interlocuteur, analyse l'historique et l'état des jauges, et renvoie une structure validée (`AgentTurnResponse`).
  3. Le moteur (`backend/engine.py`) applique mathématiquement les variations (`deltas`) et vérifie les conditions de victoire/défaite ou d'échec critique (tolérance zéro pour les propos déplacés).

---

## 🚀 Instructions de Lancement

Ouvrez **deux terminaux séparés** :

### 1. Lancer le Backend Python (FastAPI)
```bash
cd backend
pip install -r requirements.txt
python main.py
```
*(Le serveur FastAPI écoutera sur `http://localhost:8000`)*

### 2. Lancer le Frontend React (Vite)
```bash
cd frontend
npm install
npm run dev
```
*(L'application Web s'ouvrira sur `http://localhost:3000` avec proxy configuré vers le backend)*

---

## 🧪 Scénario de Test Rapide en 3 Étapes

1. **Démarrage des serveurs** : Lancez le backend sur `http://localhost:8000` via `python backend/main.py` et le frontend sur `http://localhost:3000` via `npm run dev` (depuis `frontend/`).
2. **Choix du cas métier** : Sur la page d'accueil (`HomeCatalog`), découvrez les scénarios par défaut précompilés (*Technicien de maintenance éolienne* ou *Chef de projet logistique*) ou créez un nouveau scénario personnalisé via le **Studio** (génération automatique par l'Agent 1).
3. **Simulation immersive** : Cliquez sur **"Lancer la simulation"**. Interagissez dans le `GameStage` en cliquant sur les propositions contextuelles ou en saisissant une réponse libre. Observez l'évolution animée des jauges (`+15%` / `-10%`), l'humeur changeante de l'avatar (`CharacterAvatar`), les conseils pédagogiques et l'écran de bilan final (Victoire/Défaite).
