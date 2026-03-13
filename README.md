# Mutafriches

## 📖 Description

Mutafriches est une application web qui remplace un fichier Excel pour analyser la mutabilité des friches urbaines. Elle calcule des indices de mutabilité sur 7 usages différents et fournit un indice de fiabilité selon la précision des critères d'entrée.

## 🏗️ Stack technique

### Backend

- **Framework** : NestJS (TypeScript)
- **Base de données** : PostgreSQL 16 + PostGIS + Drizzle ORM
- **Documentation API** : Swagger/OpenAPI

### Frontend

- **Framework** : React 19 + TypeScript
- **Build** : Vite
- **Routing** : React Router
- **Styles** : Tailwind CSS + DSFR (Système de Design de l'État)

### Outils

- **Tests** : Vitest
- **Package Manager** : pnpm
- **CI/CD** : GitHub Actions
- **Déploiement** : Scalingo

## 🏛️ Architecture

Le projet suit une architecture **monorepo** :

```
mutafriches/
├── apps/
│   ├── api/                    # API NestJS
│   │   ├── src/
│   │   │   ├── enrichissement/ # Enrichissement parcelles (24 APIs)
│   │   │   ├── evaluation/     # Calcul mutabilité
│   │   │   ├── evenements/     # Tracking événements
│   │   │   ├── friches/        # DEPRECATED (routes historiques)
│   │   │   ├── stats/          # Endpoint KPIs publics
│   │   │   ├── metabase/       # Intégration dashboard Metabase
│   │   │   └── shared/         # Services, guards, database, utilitaires partagés
│   └── ui/                     # Application React
│       ├── src/
│       │   ├── features/       # Modules fonctionnels (home, qualification, resultats...)
│       │   ├── shared/         # Composants, hooks, services et utilitaires partagés
│       │   └── App.tsx         # Composant racine
│       └── vite.config.ts      # Configuration Vite
├── packages/
│   └── shared-types/           # Types TypeScript partagés
├── docs/                       # Documentation
│   ├── README.md               # Index général
│   ├── enrichissement.md       # Module enrichissement
│   ├── evaluation-mutabilite.md # Algorithme mutabilité
│   └── integration/            # Guide intégration
```

### Modes de fonctionnement

#### Développement

- **API** : NestJS sur `http://localhost:3000`
- **UI** : Vite dev server sur `http://localhost:5173`
- Les deux serveurs tournent en parallèle avec hot-reload

#### Production

- **Serveur unique** : NestJS sert à la fois l'API et l'UI React compilée
- Routes API : `/api/*`, `/enrichissement`, `/evaluation/*`, `/evenements`, `/health`
- Routes DEPRECATED : `/friches/*` (redirigent vers nouveaux endpoints)
- UI React : Toutes les autres routes servent le SPA

## 🚀 Installation

### Prérequis

- Node.js 24.x
- pnpm 10.x
- Docker & Docker Compose

### Démarrage rapide

```bash
# Cloner le projet
git clone https://github.com/incubateur-ademe/mutafriches.git
cd mutafriches

# Setup complet (env, dépendances, BDD, schéma)
pnpm setup

# Démarrer en mode développement (API + UI)
pnpm start:dev
```

> Le script `pnpm setup` copie le `.env.example`, installe les dépendances, démarre PostgreSQL via Docker et synchronise le schéma de base de données.

**Accès :**

- UI React : **<http://localhost:5173>**
- API : **<http://localhost:3000>**
- Documentation Swagger : **<http://localhost:3000/api>**
- Drizzle Studio : **<http://localhost:4983>** (après `pnpm db:studio`)

## 🛠️ Scripts disponibles

### Développement

```bash
# Stack complète
pnpm start:dev              # Lance API + UI en développement
pnpm dev:api                # API uniquement (NestJS watch mode)
pnpm dev:ui                 # UI uniquement (Vite dev server)

# Build
pnpm build                  # Build shared-types + API pour production

# Production
pnpm start                  # Lance l'app en production (après build)
```

### Base de données

```bash
pnpm db:start               # Démarrer PostgreSQL (Docker)
pnpm db:stop                # Arrêter PostgreSQL
pnpm db:reset               # Reset complet (supprime les données)
pnpm db:push                # Synchroniser le schéma
pnpm db:studio              # Interface graphique Drizzle Studio
```

### Qualité de code & Tests

```bash
pnpm lint                   # Linter ESLint
pnpm format                 # Formatter Prettier
pnpm typecheck              # Vérification TypeScript
pnpm test                   # Tests unitaires (Vitest)
pnpm test:watch             # Tests en mode watch
pnpm validate               # Tout vérifier (format + lint + typecheck + test)
```

## 🌐 API Routes disponibles

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api` | GET | Documentation Swagger |
| `/health` | GET | Healthcheck de l'API |
| `/enrichissement` | POST | Enrichir une parcelle (24 APIs externes) |
| `/evaluation/calculer` | POST | Calculer la mutabilité |
| `/evaluation/:id` | GET | Récupérer une évaluation |
| `/evaluation/metadata` | GET | Métadonnées (enums) |
| `/evenements` | POST | Tracker un événement |
| `/api/stats` | GET | Statistiques KPIs publics |
| `/api/metabase/embed-url` | GET | URL d'embedding dashboard Metabase |
| `/friches/*` | * | **DEPRECATED** - Routes historiques |

## 🎨 Interface utilisateur

### Parcours utilisateur

1. **Landing** : Page d'accueil avec présentation du service
2. **Géolocalisation** : Sélection parcelle via carte interactive
3. **Formulaire** : Saisie des critères par étapes
4. **Résultats** : Visualisation des indices de mutabilité
5. **Contact** : Mise en relation avec les porteurs de projets

### Design System

L'application utilise deux systèmes de design complémentaires :

- **DSFR** : Pour les composants institutionnels (formulaires, boutons)
- **Tailwind CSS** : Pour les styles custom et la mise en page

## 🚀 Déploiement sur Scalingo

### Configuration

Le déploiement sur Scalingo utilise une architecture monolithique où NestJS sert l'API et l'UI :

```json
// package.json
{
  "scripts": {
    "scalingo-postbuild": "pnpm install --frozen-lockfile && pnpm --filter shared-types build && pnpm --filter api build",
    "start": "node apps/api/dist/src/main"
  }
}
```

### Variables d'environnement

```env
NODE_ENV=production
PORT=<fourni par Scalingo>
SCALINGO_POSTGRESQL_URL=<fourni par addon PostgreSQL>
```

### Build et déploiement

1. **Build** : Scalingo exécute `scalingo-postbuild`
   - Compile shared-types puis l'API NestJS → `apps/api/dist/`
   - L'UI React est compilée dans le build API → `dist-ui/`

2. **Runtime** : NestJS sert :
   - Routes API sur `/api/*`, `/enrichissement`, `/evaluation/*`, `/evenements`
   - UI React sur toutes les autres routes

```bash
# Déployer sur Scalingo
git push scalingo main
```

## 📊 Tracking Événements

Système de tracking léger pour mesurer l'engagement utilisateur :

- Événements frontend uniquement (depuis Mutafriches UI)
- Pas de tracking intégrateurs (Benefriches, etc.)
- Endpoint : `POST /evenements`
- Guard : `OriginGuard` (whitelist origines Mutafriches)

**Événements trackés** :
- Étapes formulaire (progression, abandon)
- Actions utilisateur (enrichissement, calcul)
- Téléchargements de résultats

## 📚 Documentation

Documentation complète dans le dossier [`docs/`](./docs/) :

- **[Index Général](./docs/README.md)** - Vue d'ensemble et navigation
- **[Module Enrichissement](./docs/enrichissement.md)** - 9 domaines, 24 APIs, règles de gestion
- **[Algorithme d'Évaluation](./docs/evaluation-mutabilite.md)** - Matrice 24×7, calcul mutabilité
- **[Guide d'Intégration](./docs/integration/README.md)** - Iframe + PostMessage

---

## 🔌 Intégration dans vos applications

Mutafriches peut être intégré facilement dans vos applications existantes via iframe. Deux modes d'intégration sont disponibles :

### Intégration simple (HTML/JavaScript)

Pour une intégration rapide dans n'importe quel site web :

```html
<iframe
  src="https://mutafriches.beta.gouv.fr/iframe?integrator=demo"
  width="100%"
  height="900">
</iframe>
```

### Intégration avancée (React, Vue, etc.)

Pour une intégration avec communication bidirectionnelle via PostMessage, permettant de récupérer les résultats d'analyse dans votre application.

### 📖 Documentation complète et exemples

- **[Guide d'intégration](./docs/integration/README.md)** - Vue d'ensemble des méthodes d'intégration
- **[Exemple HTML/JavaScript](./docs/integration/html/)** - Intégration simple avec vanilla JS
- **[Exemple React](./docs/integration/react/)** - Composant React avec hook personnalisé

### Paramètres d'intégration

| Paramètre | Description | Requis |
|-----------|-------------|---------|
| `integrator` | Identifiant unique de votre organisation | ✅ |
| `callbackUrl` | URL de retour après analyse | ❌ |
| `callbackLabel` | Texte personnalisé du bouton de retour | ❌ |

**Exemple complet** :

```
https://mutafriches.beta.gouv.fr/iframe?integrator=benefriches&callbackUrl=https://benefriches.ademe.fr&callbackLabel=Retour+vers+Benefriches
```

### Liens trackés (analytics)

Pour le tracking analytics (usage externe de Mutafriches sans iframe), utiliser le paramètre `source` :

```
https://mutafriches.beta.gouv.fr?source={partenaire}
```

Les intégrateurs autorisés sont définis dans les variables d'environnement (voir `CLAUDE.md`).

---

## 📊 Import des données BPE (Base Permanente des Équipements)

Les données BPE de l'INSEE sont utilisées pour calculer la proximité des transports et commerces.

### Données importées

- **15 codes équipements** : gares (E107-E109), commerces alimentaires (B104-B207), services (A203, A206-A208, D307)
- **182K enregistrements** géolocalisés (filtrage de 2.8M → 182K, réduction 99%)

### Scripts disponibles

```bash
# Depuis apps/api

# 1. Filtrer le fichier BPE brut (si besoin de régénérer)
pnpm db:bpe:filter

# 2. Importer en base de données
pnpm db:bpe:import
```

### Prérequis

- PostGIS activé sur la base
- Migration `0007_create_raw_bpe_tables.sql` appliquée
- Fichier `data/bpe-filtered.csv` présent (committé dans le repo)

### Activer PostGIS

**Local (Docker)** : utiliser l'image `postgis/postgis:16-3.4` dans docker-compose.yml

**Staging/Production (Scalingo)** :

```bash
# Staging
scalingo -a mutafriches-staging pgsql-console
CREATE EXTENSION IF NOT EXISTS postgis;
SELECT PostGIS_Version();
\q

# Production
scalingo -a mutafriches pgsql-console
CREATE EXTENSION IF NOT EXISTS postgis;
SELECT PostGIS_Version();
\q
```

### Importer sur Scalingo

```bash
# Staging
scalingo -a mutafriches-staging run "pnpm --filter api db:bpe:import"

# Production
scalingo -a mutafriches run "pnpm --filter api db:bpe:import"
```

### Régénérer le fichier filtré

1. Télécharger le ZIP BPE depuis <https://www.insee.fr/fr/statistiques/8217537>
2. Dézipper dans `apps/api/data/raw/bpe24.csv` (gitignored)
3. Lancer `pnpm db:bpe:filter`

---

## 🔗 Liens utiles

- **Production** : https://mutafriches.beta.gouv.fr
- **Staging** : https://mutafriches.incubateur.ademe.dev
- **Documentation API (Swagger)** : https://mutafriches.beta.gouv.fr/api
- **Repository** : https://github.com/incubateur-ademe/mutafriches
- **Contact** : contact@mutafriches.beta.gouv.fr

---

**Version** : 1.6.0
**Dernière mise à jour** : 2026-03-11
**Projet** : Mutafriches - Beta.gouv / ADEME
