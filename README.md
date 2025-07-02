# Mutafriches

## 📖 Description

Mutafriches est une API NestJS qui remplace un fichier Excel pour analyser la mutabilité des friches urbaines. Elle calcule des indices de mutabilité sur 7 usages différents et fournit un indice de fiabilité selon la précision des critères d'entrée.

## 🏗️ Stack technique

- **Framework** : NestJS (TypeScript)
- **Design System** : DSFR (Système de Design de l'État)
- **Templating** : HTML/CSS/JS avec composants modulaires
- **Tests** : Jest
- **Package Manager** : pnpm

## 🚀 Installation

### Prérequis

- Node.js `22.17.0`
- pnpm `10.12.4`

### Démarrage rapide

```bash
# Cloner le projet
git clone <repository-url>
cd mutafriches

# Installer les dépendances
pnpm install

# Démarrer en mode développement
pnpm run start:dev
```

L'API sera disponible sur : **<http://localhost:3000>**

## 🛠️ Scripts disponibles

```bash
# Développement
pnpm run start:dev          # Mode développement avec watch
pnpm run start:debug        # Mode debug

# Build & Production  
pnpm run build              # Compiler le projet
pnpm run start:prod         # Démarrer en production

# Qualité de code
pnpm run lint               # Linter ESLint
pnpm run format             # Formatter Prettier
pnpm run typecheck          # Vérification TypeScript

# Tests
pnpm run test               # Tests unitaires
pnpm run test:watch         # Tests en mode watch
pnpm run test:cov           # Tests avec coverage

# Utilitaires
pnpm run clean              # Nettoyer dist/, coverage/, node_modules/
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
└── templates/             # Système de templates
    ├── template.service.ts # Service de rendu HTML
    ├── types.ts           # Types TypeScript
    ├── iframe.html        # Template principal
    └── components/        # Composants HTML réutilisables
        ├── hero.html
        └── callout.html
```

### Système de templates

L'API utilise un système de templates modulaire :

- **Templates** : Pages complètes (`iframe.html`)
- **Composants** : Éléments réutilisables (`hero.html`, `callout.html`)
- **Variables** : Remplacement dynamique avec `{{variable}}`

#### Exemple d'usage

```typescript
const components = [
  {
    name: 'hero',
    data: { title: 'Mon Titre', subtitle: 'Mon sous-titre' }
  },
  {
    name: 'callout', 
    data: { title: 'Info', text: 'Message important' }
  }
];

const html = templateService.renderIframePage('Page Title', components);
```

## 🎨 Design System

L'API utilise le [DSFR](https://www.systeme-de-design.gouv.fr/) (Système de Design de l'État français) :

- Assets servis via `/dsfr/*`
- Composants officiels (boutons, callouts, grille, etc.)
- Thèmes clair/sombre automatiques
- Typographie Marianne

## 📦 Parcours d'utilisation prévus

1. **Parcours Initial** : iframe pure pour utilisateurs sans données
2. **Parcours Complétude Simple** : API REST pour données partielles  
3. **Parcours Complétude Avancée** : iframe avec token pour affinage
