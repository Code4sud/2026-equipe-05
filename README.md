# Agora Roleplay Studio

Application Web B2B de création et de simulation de jeux de rôle (Roleplay) métiers pilotée par une architecture neuro-symbolique.

## ⚡ Architecture & Fonctionnement

- **Backend** : [`backend/main.py`](backend/main.py) (FastAPI, Pydantic v2, SDK `google-genai` avec `gemini-2.5-flash` et Structured Outputs, mode fallback simulé intégré si `GEMINI_API_KEY` est absent).
- **Stockage** : Fichiers JSON locaux dans [`backend/data/scenarios/`](backend/data/scenarios/).
- **Frontend** : [`frontend/`](frontend/) (React 18, Vite, TypeScript, Tailwind CSS, `lucide-react`).
- **Principe Neuro-Symbolique** :
  1. Le studio génère un fichier JSON de scénario.
  2. L'Agent IA unique (`backend/agent.py`) analyse l'historique et l'état des jauges, puis renvoie une structure validée (`AgentTurnResponse`).
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
