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

## 🌐 Routes disponibles

| Route | Méthode | Description |
|-------|---------|-------------|
| `/` | GET | Message de base de l'API |
| `/health` | GET | Healthcheck (status, timestamp, service) |
| `/iframe` | GET | Interface utilisateur avec DSFR |

### Exemples

```bash
# Healthcheck
curl http://localhost:3000/health

# Interface iframe
curl http://localhost:3000/iframe
```

## 🧩 Architecture

### Structure du projet

```
src/
├── app.controller.ts       # Routes principales
├── app.module.ts          # Configuration NestJS
├── main.ts                # Bootstrap de l'application
├── analytics/             # Schémas, services et types analytics
│   ├── analytics.schema.ts
│   ├── analytics.service.ts
│   └── analytics.types.ts
├── mutability/            # Schémas et types mutabilité
│   ├── mutability.schema.ts
│   └── mutability.types.ts
├── mocks/                 # Services et données de test
│   ├── data/
│   ├── mock.service.ts
│   └── mock.types.ts
├── shared/                # Services partagés et utilitaires
│   ├── database/
│   ├── scripts/
│   └── types/
└── ui/                    # Système d'interface utilisateur
    ├── components/        # Composants HTML réutilisables
    ├── layouts/           # Layouts de base
    ├── pages/             # Pages complètes (steps)
    ├── ui.controller.ts   # Controller pour l'UI
    ├── ui.service.ts      # Service de rendu HTML
    ├── ui.types.ts        # Types UI
    └── ui.utils.ts        # Utilitaires UI
```

### Système UI

L'API utilise un système UI modulaire :

- **Layouts** : Structures de base (`base.html`)
- **Pages** : Pages complètes par étape (`step1-map.html`, `step2-manual-form.html`, etc.)
- **Composants** : Éléments réutilisables (`form-header.html`)
- **Variables** : Remplacement dynamique avec `{{variable}}`

```typescript
const pageData = {
  title: 'Analyse de mutabilité',
  content: 'Données du formulaire'
};

const html = uiService.renderPage('step1-map', pageData);
```

## 🎨 Design System

L'API utilise le [DSFR](https://www.systeme-de-design.gouv.fr/) (Système de Design de l'État français) avec assets servis via `/dsfr/*`.

## 📊 Analytics & Métriques

Le système trackage les métriques d'impact :

1. **Taux d'initiation** : % d'utilisateurs initiant le parcours
2. **Taux de complétion** : % d'utilisateurs terminant le parcours  
3. **Engagement détails** : % cliquant sur "voir tous les résultats"
4. **Demandes de contact** : % cliquant "être contacté par des porteurs"
5. **Outils annexes** : % cliquant sur les liens d'outils

Les données sont prêtes pour l'analyse dans Metabase.

## 🚀 CI/CD

Le projet utilise GitHub Actions pour l'intégration continue :

- **Linting** et **formatting** automatique
- **Tests** avec Vitest
- **Type checking** TypeScript
- **Build** de validation

## 📦 Parcours d'utilisation

1. **Parcours Initial** : iframe pure pour utilisateurs sans données
2. **Parcours Complétude Simple** : API REST pour données partielles  
3. **Parcours Complétude Avancée** : iframe avec token pour affinage
