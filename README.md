# Mutafriches

## 📖 Description

Mutafriches est une API NestJS qui remplace un fichier Excel pour analyser la mutabilité des friches urbaines. Elle calcule des indices de mutabilité sur 7 usages différents et fournit un indice de fiabilité selon la précision des critères d'entrée.

## 🏗️ Stack technique

- **Framework** : NestJS (TypeScript)
- **Base de données** : PostgreSQL 16 + Drizzle ORM
- **Design System** : DSFR (Système de Design de l'État)
- **Templating** : HTML/CSS/JS avec composants modulaires
- **Tests** : Jest
- **Package Manager** : pnpm

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

### Qualité de code

```bash
pnpm lint                   # Linter ESLint
pnpm format                 # Formatter Prettier
pnpm typecheck              # Vérification TypeScript
pnpm test                   # Tests unitaires
pnpm test:cov               # Tests avec coverage
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
├── database/              # Schémas et types de données
│   ├── analytics/         # Tables et types analytics
│   ├── mutability/        # Tables et types mutabilité
│   └── schema.ts          # Export consolidé
├── services/              # Services métier
│   ├── analytics.service.ts
│   ├── database.service.ts
│   └── template.service.ts
├── scripts/               # Scripts de seed et maintenance
└── templates/             # Templates HTML (steps, components etc...)
    ├── iframe.html
    └── components/
        └── steps/
```

### Système de templates

L'API utilise un système de templates modulaire avec variables dynamiques et composants réutilisables.

```typescript
const components = [
  {
    name: 'hero',
    data: { title: 'Mon Titre', subtitle: 'Mon sous-titre' }
  }
];

const html = templateService.renderIframePage('Page Title', components);
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

## 📦 Parcours d'utilisation

1. **Parcours Initial** : iframe pure pour utilisateurs sans données
2. **Parcours Complétude Simple** : API REST pour données partielles  
3. **Parcours Complétude Avancée** : iframe avec token pour affinage
