
# Agora Roleplay Studio

**Agora Roleplay Studio** est une plateforme de simulations professionnelles interactives utilisant l'intelligence artificielle pour accompagner l'orientation et développer les compétences nécessaires à l'employabilité.

Projet réalisé dans le cadre du **Hackathon Azuréen #3**, autour du thème :

**« L'orientation et l'employabilité grâce à l'IA »**

---

## Le projet

L'objectif d'Agora Roleplay Studio est de permettre aux utilisateurs de découvrir différents métiers et de se préparer à des situations professionnelles concrètes grâce à des mises en situation interactives.

Plutôt que de simplement présenter des fiches métiers ou des contenus théoriques, la plateforme place l'utilisateur au cœur de situations professionnelles dans lesquelles il doit prendre des décisions, communiquer et résoudre des problèmes.

L'intelligence artificielle permet de rendre ces simulations dynamiques : les personnages réagissent aux réponses de l'utilisateur et adaptent leurs interventions en fonction du déroulement de la situation.

## Fonctionnalités actuelles

### 1. Catalogue de scénarios professionnels

L'application propose un catalogue de scénarios correspondant à différentes situations et professions.

Chaque scénario contient notamment :
- Un métier et un secteur d'activité.
- Un contexte professionnel.
- Un objectif à atteindre.
- Un personnage incarné par l'intelligence artificielle.
- Des règles d'évaluation.
- Des jauges permettant de suivre la progression.
- Des propositions de réponses pour accompagner l'utilisateur.

### 2. Simulations interactives avec l'IA

L'utilisateur peut lancer une simulation et interagir avec un personnage virtuel représentant un interlocuteur professionnel.

L'agent IA :
- Incarne le personnage défini dans le scénario.
- Analyse les réponses de l'utilisateur.
- Prend en compte l'historique de la conversation.
- Adapte ses réactions aux décisions prises.
- Génère des propositions de réponses pour poursuivre la simulation.
- Fournit des explications pédagogiques sur les conséquences des choix effectués.

L'utilisateur peut ainsi expérimenter différentes approches et observer leurs conséquences dans un environnement sans risque réel.

### 3. Système de jauges et d'évaluation

Le moteur de simulation suit l'évolution de plusieurs indicateurs associés au scénario.

Ces jauges représentent différentes dimensions de la situation professionnelle, par exemple :
- La sécurité et le respect des procédures.
- L'avancement de la mission.
- La qualité des décisions prises.

Les réponses de l'agent IA produisent des variations sur ces indicateurs.

Le moteur applique ensuite ces variations et vérifie les conditions de victoire ou d'échec définies dans le scénario.

Une faute critique peut également entraîner l'arrêt immédiat de la simulation.

### 4. Création et personnalisation des scénarios

Une première fonctionnalité de création de scénarios est présente dans l'application.

Elle permet notamment de renseigner :
- Le métier et le secteur d'activité.
- Le contexte professionnel.
- L'objectif pédagogique.
- Le profil de l'interlocuteur IA.
- Les règles d'évaluation.
- Les jauges de progression.
- Les propositions de départ.

**Cette partie est actuellement en cours d'amélioration et de fusion avec notre version enrichie du système de création de scénarios.**

La description détaillée des nouvelles fonctionnalités, de leur fonctionnement et de leur intégration sera ajoutée une fois cette fusion terminée.

---

## Architecture technique

Le projet repose sur une architecture séparant le frontend, le backend et les composants d'intelligence artificielle.

### Backend

Le backend est développé en Python avec FastAPI.

Il assure :
- La gestion et le chargement des scénarios.
- La création des sessions de simulation.
- Le traitement des réponses des utilisateurs.
- La communication avec les agents IA.
- La gestion des jauges et des conditions de fin.
- La sauvegarde des scénarios au format JSON.

Les principaux fichiers sont :

| Fichier | Rôle |
|---|---|
| `backend/main.py` | Point d'entrée de l'API et gestion des routes principales. |
| `backend/agent.py` | Agent IA chargé d'incarner l'interlocuteur professionnel. |
| `backend/engine.py` | Moteur de simulation et gestion des sessions. |
| `backend/scenario_bridge.py` | Liaison entre les scénarios et leur compilation. |
| `backend/agents/scenario_compiler.py` | Composant de compilation des scénarios. |
| `backend/models/` | Définition des modèles et structures de données. |
| `backend/api/compiler_routes.py` | Routes dédiées à la compilation des scénarios. |

### Agents IA

Le projet utilise deux composants IA complémentaires :

**Agent 1 – Scenario Compiler**

Il transforme les informations d'un scénario en une configuration structurée destinée à guider l'agent de simulation.

Il génère notamment :
- Un prompt système détaillé pour l'agent de simulation.
- Une grille de notation associée aux jauges.
- Des règles de sécurité et des conditions éliminatoires.

**Agent 2 – Avatar de simulation**

Il incarne le personnage professionnel et assure les interactions avec l'utilisateur.

Il analyse les réponses, adapte ses réactions et produit les variations des jauges ainsi que les explications pédagogiques.

### Frontend

Le frontend utilise React et TypeScript avec Vite et Tailwind CSS.

Il comprend notamment :
- Un catalogue de scénarios.
- Un espace de création de scénarios.
- Une interface de simulation interactive.
- Des avatars et éléments visuels.
- Des jauges de progression.
- Un système d'affichage des résultats de simulation.

### Stockage

Les scénarios sont actuellement stockés sous forme de fichiers JSON.

Deux répertoires principaux sont utilisés :
- `backend/data/scenarios/` : scénarios disponibles pour les simulations.
- `backend/data/compiled_scenarios/` : configurations générées par le compilateur.

---

## Technologies utilisées

| Domaine | Technologies |
|---|---|
| Backend | Python, FastAPI |
| Validation des données | Pydantic |
| Intelligence artificielle | Groq API, OpenAI SDK |
| Frontend | React, TypeScript |
| Interface graphique | Tailwind CSS, Lucide React |
| Outil de développement frontend | Vite |
| Stockage | Fichiers JSON |

---

## Installation et lancement

### Prérequis

- Python 3.10 ou supérieur.
- Node.js et npm.
- Une clé API Groq pour activer les interactions IA.

### 1. Configuration du backend

À la racine du projet, créer un fichier nommé `.env` contenant :

    GROQ_API_KEY=votre_cle_api

Installer les dépendances :

    cd backend
    pip install -r requirements.txt

Lancer le serveur :

    python main.py

Le backend sera accessible à l'adresse :

http://localhost:8000

### 2. Configuration du frontend

Dans un deuxième terminal :

    cd frontend
    npm install

Lancer l'application :

    npm run dev

Le frontend sera accessible à l'adresse :

http://localhost:3000

Le proxy Vite permet de rediriger les requêtes `/api` vers le backend.

---

## Tester l'application

1. Démarrer le backend et le frontend.
2. Accéder au catalogue des scénarios.
3. Sélectionner un scénario professionnel.
4. Lancer une simulation.
5. Interagir avec le personnage IA en utilisant les propositions disponibles ou en rédigeant ses propres réponses.
6. Observer les réactions du personnage, les variations des jauges et les explications pédagogiques.
7. Consulter le résultat final de la simulation.

---

## Déploiement et présentation du projet

Pour publier le projet sur le site du Hackathon :

1. Compléter les informations du fichier `projet.json`.
2. Ajouter les captures d'écran dans le dossier `captures/`.
3. Renseigner les liens de démonstration et de présentation lorsqu'ils seront disponibles.
4. Pousser les modifications sur la branche `main`.

La fiche du projet sera ensuite disponible sur :

https://orientation.code4sud.fr/projets/equipe-05

Documentation du site du Hackathon :

https://orientation.code4sud.fr/doc/

---

## Équipe

**Équipe 05**

Projet réalisé lors du Hackathon Azuréen #3.

## Licence

Projet distribué sous licence MIT. Voir le fichier `LICENSE`.
