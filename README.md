# Mutafriches

## 📖 Description

Mutafriches est une application web qui remplace un fichier Excel pour analyser la mutabilité des friches urbaines. Elle calcule des indices de mutabilité sur 7 usages différents et fournit un indice de fiabilité selon la précision des critères d'entrée.

## 🏗️ Stack technique

### Backend

- **Framework** : NestJS (TypeScript)
- **Base de données** : PostgreSQL 16 + Drizzle ORM
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

Le projet suit une architecture **monolithique modulaire** :

```
mutafriches/
├── src/                    # API NestJS
│   ├── analytics/          # Analytics et métriques
│   ├── form-sessions/      # Gestion des sessions
│   ├── friches/            # Logique métier
│   ├── shared/             # Services partagés
│   └── main.ts             # Point d'entrée API
├── ui/                     # Application React
│   ├── src/
│   │   ├── components/     # Composants React
│   │   ├── pages/          # Pages de l'application
│   │   ├── services/       # Services API
│   │   └── App.tsx         # Composant racine
│   └── vite.config.ts      # Configuration Vite
└── dist/                   # Build de production
    ├── src/                # API compilée
    └── dist-ui/            # UI React compilée
```

### Modes de fonctionnement

#### Développement

- **API** : NestJS sur `http://localhost:3000`
- **UI** : Vite dev server sur `http://localhost:5173`
- Les deux serveurs tournent en parallèle avec hot-reload

#### Production

- **Serveur unique** : NestJS sert à la fois l'API et l'UI React compilée
- Routes API : `/api/*`, `/friches/*`, `/health`
- UI React : Toutes les autres routes servent le SPA

## 🚀 Installation

### Prérequis

- Node.js `22.17.0`
- pnpm `10.13.1`
- Docker & Docker Compose

### Démarrage rapide

```bash
# Cloner le projet
git clone <repository-url>
cd mutafriches

# Configuration
cp .env.example .env

# Installer les dépendances (API + UI)
pnpm install:all

# Démarrer PostgreSQL
pnpm db:start

# Synchroniser le schéma de base de données
pnpm db:push

# Générer des données de test
pnpm db:seed

# Démarrer en mode développement (API + UI)
pnpm dev
```

**Accès :**

- UI React : **<http://localhost:5173>**
- API : **<http://localhost:3000>**
- Documentation Swagger : **<http://localhost:3000/api>**
- Drizzle Studio : **<http://localhost:4983>** (après `pnpm db:studio`)

## 🛠️ Scripts disponibles

### Développement

```bash
# Stack complète
pnpm dev                    # Lance API + UI en développement
pnpm dev:api                # API uniquement (NestJS watch mode)
pnpm dev:ui                 # UI uniquement (Vite dev server)

# Build
pnpm build:all              # Build API + UI pour production
pnpm build:api              # Build API uniquement
pnpm build:ui               # Build UI uniquement

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

## 🌐 API Routes disponibles

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api` | GET | Documentation Swagger |
| `/api/health` | GET | Healthcheck de l'API |
| `/api/form-sessions` | POST | Créer une session de formulaire |
| `/api/form-sessions/{id}` | GET, PUT | Gérer une session |
| `/api/friches/mutability` | POST | Calculer la mutabilité |
| `/api/friches/enrich` | POST | Enrichir les données d'une parcelle |

## 🎨 Interface utilisateur

### Architecture React

L'UI React communique avec l'API NestJS via des services dédiés :

```typescript
// ui/src/services/api.ts
export const api = {
  friches: {
    calculateMutability: (data) => fetch('/api/friches/mutability', ...),
    enrichParcel: (id) => fetch('/api/friches/enrich', ...)
  },
  sessions: {
    create: () => fetch('/api/form-sessions', ...),
    update: (id, data) => fetch(`/api/form-sessions/${id}`, ...)
  }
}
```

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
    "heroku-postbuild": "pnpm run build:all",
    "start": "node dist/src/main.js"
  }
}
```

### Variables d'environnement

```env
NODE_ENV=production
PORT=<fourni par Scalingo>
DATABASE_URL=<fourni par addon PostgreSQL>
SESSION_SECRET=<clé secrète forte>
```

### Build et déploiement

1. **Build** : Scalingo exécute `pnpm run build:all`
   - Compile l'API NestJS → `dist/`
   - Compile l'UI React → `ui/dist/`
   - Copie l'UI vers `dist-ui/`

2. **Runtime** : NestJS sert :
   - Routes API sur `/api/*`
   - UI React sur toutes les autres routes

```bash
# Déployer sur Scalingo
git push scalingo main
```

## 📊 Analytics

Tracking automatique des métriques d'impact :

- Taux d'initiation et de complétion
- Engagement par étape
- Demandes de contact
- Utilisation des outils annexes

## 🧪 Tests

```bash
# Tests unitaires
pnpm test

# Tests avec interface UI
pnpm test:ui

# Tests E2E (à venir)
pnpm test:e2e
```

## 📚 Documentation

### 🔌 Intégration dans vos applications

Mutafriches peut être intégré facilement dans vos applications existantes via iframe. Deux modes d'intégration sont disponibles :

#### Intégration simple (HTML/JavaScript)

Pour une intégration rapide dans n'importe quel site web :

```html
<iframe 
  src="https://mutafriches.beta.gouv.fr?integrator=demo" 
  width="100%" 
  height="800">
</iframe>
```

#### Intégration avancée (React, Vue, etc.)

Pour une intégration avec communication bidirectionnelle via PostMessage, permettant de récupérer les résultats d'analyse dans votre application.

#### 📖 Documentation complète et exemples

- **[Guide d'intégration](./docs/integration/)** - Vue d'ensemble des méthodes d'intégration
- **[Exemple HTML/JavaScript](./docs/integration/html/)** - Intégration simple avec vanilla JS
- **[Exemple React](./docs/integration/react/)** - Composant React avec hook personnalisé

#### Paramètres d'intégration

| Paramètre | Description | Requis |
|-----------|-------------|---------|
| `integrator` | Identifiant unique de votre organisation | ✅ |
| `callbackUrl` | URL de retour après analyse | ❌ |
| `callbackLabel` | Texte personnalisé du bouton de retour | ❌ |

### APIs et Sources de données externes

Le projet s'appuie sur plusieurs APIs publiques pour enrichir les données :

- **[Vue d'ensemble des APIs externes](./docs/external-apis-overview.md)** - Architecture et cartographie
- **[IGN Cadastre](./docs/external-apis/ign-cadastre.md)** - Enrichissement cadastral
- **[BDNB](./docs/external-apis/api-bdnb.md)** - Base de données bâtiment
- **[ENEDIS](./docs/external-apis/api-enedis.md)** - API Enedis
- **Transport Data Gouv** - Accessibilité transports (à venir)
- **Géorisques** - Risques et contraintes (à venir)

## 🔗 Intégration partenaires

### Liens trackés

Pour permettre le suivi des conversions, les partenaires peuvent utiliser des liens avec paramètres UTM :

```
https://mutafriches.beta.gouv.fr/?source={partenaire}&ref={contexte}
```

| Paramètre | Description | Exemple |
|-----------|-------------|---------|
| `source` | Nom du partenaire | `urbanvitaliz`, `benefriches`, `cartofriches` |
| `ref` | Point d'entrée / contexte | `page-friches`, `newsletter`, `widget` |

**Exemples :**

- `https://mutafriches.beta.gouv.fr/?source=urbanvitaliz&ref=page-friches`
- `https://mutafriches.beta.gouv.fr/?source=benefriches&ref=simulateur`

### Intégration iframe

Pour une intégration en iframe avec callback :

```
https://mutafriches.beta.gouv.fr/?integrator={partenaire}&ref={contexte}&callbackUrl={url_retour}
```

Les intégrateurs autorisés sont définis dans `IframeContext.constants.ts`.
