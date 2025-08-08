# Mutafriches

## 📖 Description

Mutafriches est une API NestJS qui remplace un fichier Excel pour analyser la mutabilité des friches urbaines. Elle calcule des indices de mutabilité sur 7 usages différents et fournit un indice de fiabilité selon la précision des critères d'entrée.

## 🏗️ Stack technique

- **Framework** : NestJS (TypeScript)
- **Base de données** : PostgreSQL 16 + Drizzle ORM
- **Design System** : DSFR (Système de Design de l'État)
- **UI System** : HTML/CSS/JS avec composants modulaires
- **Tests** : Vitest
- **Package Manager** : pnpm
- **CI/CD** : GitHub Actions
- **Documentation API** : Swagger/OpenAPI

## 🚀 Installation

### Prérequis

- Node.js `22.17.0`
- pnpm `10.12.4`
- Docker & Docker Compose

### Démarrage rapide

```bash
# Cloner le projet
git clone <repository-url>
cd mutafriches

# Configuration
cp .env.example .env

# Installer les dépendances
pnpm install

# Démarrer PostgreSQL
pnpm db:start

# Synchroniser le schéma de base de données
pnpm db:push

# Générer des données de test
pnpm db:seed

# Démarrer en mode développement
pnpm start:dev
```

L'API sera disponible sur : **<http://localhost:3000>**
Documentation Swagger : **<http://localhost:3000/api>**

## 🛠️ Scripts disponibles

### Développement

```bash
pnpm start:dev              # Mode développement avec watch
pnpm start:debug            # Mode debug
pnpm build                  # Compiler le projet
```

### Base de données

```bash
pnpm db:start               # Démarrer PostgreSQL (Docker)
pnpm db:stop                # Arrêter PostgreSQL
pnpm db:reset               # Reset complet (supprime les données)
pnpm db:push                # Synchroniser le schéma
pnpm db:studio              # Interface graphique Drizzle Studio
pnpm db:seed                # Générer des fake data pour analytics
```

### Qualité de code & Tests

```bash
pnpm lint                   # Linter ESLint
pnpm format                 # Formatter Prettier
pnpm typecheck              # Vérification TypeScript
pnpm test                   # Tests unitaires (Vitest)
pnpm test:watch             # Tests en mode watch
pnpm test:coverage          # Tests avec coverage
```

## 🗄️ Base de données

### Configuration

Le projet utilise PostgreSQL avec Drizzle ORM. Configurez votre `.env` :

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=mutafriches_user
DB_PASSWORD=mutafriches_password
DB_NAME=mutafriches
```

### Tables principales

- **integrators** : Organismes utilisateurs (collectivités, EPF, etc.)
- **user_sessions** : Sessions utilisateur avec tracking
- **user_actions** : Actions trackées (parcours, clics, conversions)
- **mutability_results** : Résultats d'analyse de mutabilité

### Interface graphique

Drizzle Studio offre une interface web pour explorer les données :

```bash
pnpm db:studio
# Ouvre http://localhost:4983
```

## 🌐 API Routes disponibles

| Route | Méthode | Description |
|-------|---------|-------------|
| `/` | GET | Message de base de l'API |
| `/health` | GET | Healthcheck de l'API |
| `/api` | GET | Documentation Swagger |
| `/iframe` | GET | Interface utilisateur (step 1) |
| `/api/form-sessions` | POST | Créer une session de formulaire |
| `/api/form-sessions/{id}` | GET, PUT | Gérer une session |
| `/api/friches/mutability` | POST | Calculer la mutabilité |

### Documentation API

L'API expose une documentation Swagger complète avec tous les DTO et schémas. Accédez à `/api` pour explorer les endpoints interactivement.

## 🧩 Architecture

### Structure du projet

```
src/
├── app.controller.ts           # Routes principales
├── app.module.ts              # Configuration NestJS
├── main.ts                    # Bootstrap de l'application
├── analytics/                 # Analytics et métriques
├── form-sessions/             # Gestion des sessions de formulaire
│   ├── dto/                  # Data Transfer Objects
│   ├── form-sessions.controller.ts
│   ├── form-sessions.service.ts
│   └── form-sessions.types.ts
├── friches/                   # Logique métier friches
│   ├── dto/                  # DTO pour les analyses
│   ├── friches.controller.ts
│   ├── friches.service.ts
│   └── friches.types.ts
├── mocks/                     # Services et données de test
├── shared/                    # Services partagés
│   ├── database/
│   └── types/
└── ui/                        # Interface utilisateur
    ├── components/           # Composants HTML DSFR
    ├── layouts/              # Layouts de base
    ├── pages/                # Pages par étapes
    ├── ui.controller.ts
    ├── ui.service.ts
    └── ui.types.ts
```

### Système de sessions

Le système de `form-sessions` permet de :

- Suivre le parcours utilisateur étape par étape
- Sauvegarder les données partielles
- Gérer l'état des formulaires multi-étapes
- Analyser les taux de conversion et d'abandon

### DTOs et validation

Tous les endpoints utilisent des DTO typés avec validation automatique :

- `CreateFormSessionDto` : Création d'une session
- `UpdateFormSessionDto` : Mise à jour des données
- `MutabilityAnalysisDto` : Analyse de mutabilité
- `EnrichmentResultDto` : Résultats enrichis

## 🎨 Interface utilisateur

L'UI utilise le DSFR avec un système modulaire :

- **Layouts** : Structure HTML de base avec DSFR
- **Pages** : Templates par étape du parcours
- **Composants** : Éléments réutilisables (forms, callouts, etc.)

Le rendu se fait côté serveur avec remplacement de variables `{{variable}}`.

## 🗄️ Base de données

### Configuration

PostgreSQL avec Drizzle ORM. Tables principales :

- **form_sessions** : Sessions utilisateur et données formulaires
- **integrators** : Organismes utilisateurs
- **user_actions** : Analytics et tracking
- **mutability_results** : Résultats d'analyses

Interface graphique : `pnpm db:studio` (<http://localhost:4983>)

## 📊 Analytics

Tracking automatique des métriques d'impact :

- Taux d'initiation et de complétion
- Engagement par étape
- Demandes de contact
- Utilisation des outils annexes

## 🚀 CI/CD

Le projet utilise GitHub Actions pour l'intégration continue :

- **Linting** et **formatting** automatique
- **Tests** avec Vitest
- **Type checking** TypeScript
- **Build** de validation

## Parcours utilisateur

1. **Landing** : Page d'accueil avec iframe
2. **Géolocalisation** : Sélection parcelle via carte
3. **Formulaire** : Saisie critères par étapes
4. **Résultats** : Indices de mutabilité et recommandations
5. **Contact** : Mise en relation avec porteurs de projets

## 📚 Documentation

### APIs et Sources de données externes

Le projet s'appuie sur plusieurs APIs publiques pour enrichir les données des friches :

- **[Vue d'ensemble des APIs externes](./docs/external-apis-overview.md)** - Architecture et cartographie des sources de données
- **[IGN Cadastre](./docs/external-apis/ign-cadastre.md)** - Service d'enrichissement cadastral (surface, commune, coordonnées)
- **BDNB** - Base de données bâtiment (à venir)
- **ENEDIS** - API Enedis (à venir)
- **Transport Data Gouv** - Accessibilité transports (à venir)
- **Géorisques** - Risques et contraintes réglementaires (à venir)
