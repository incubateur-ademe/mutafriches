# Mutafriches - Instructions pour Claude Code

## Description du projet

Mutafriches est une API NestJS qui remplace un fichier Excel pour analyser la mutabilite des friches urbaines. Elle calcule des indices de mutabilite sur 7 usages differents et fournit un indice de fiabilite selon la precision des criteres d'entree.

Projet Beta.gouv / gouvernement francais.

## Stack technique

- **Backend** : NestJS (TypeScript)
- **Base de donnees** : PostgreSQL avec PostGIS (donnees spatiales)
- **ORM** : Drizzle ORM
- **UI** : App react avec vite avec DSFR (Design System de l'Etat)
- **Package Manager** : pnpm (OBLIGATOIRE, jamais npm ou yarn)
- **Tests** : Vitest
- **Monorepo** : Structure avec apps/api, apps/ui, packages/shared-types

## Regles de code STRICTES

### 1. TypeScript - Typage explicite obligatoire

```typescript
// INTERDIT - genere @typescript-eslint/no-unsafe-assignment
const result = someApiCall();
const value = result.data;

// OBLIGATOIRE - cast explicite
const result = someApiCall() as ApiResponse<MyData>;
const value = result.data as MyData;
```

- TOUJOURS typer les parametres et retours de fonction
- TOUJOURS utiliser `as Type` lors d'assignations depuis `any` ou `unknown`
- JAMAIS utiliser `any` sans cast explicite
- TOUJOURS importer les types necessaires

### 2. Pas d'emojis/icones dans le code

```typescript
// INTERDIT
console.log(`🏢 Integrateurs: ${integrators.length}`);

// CORRECT
console.log(`Integrateurs: ${integrators.length}`);
```

### 3. Conventions de nommage

- Services : `*.service.ts`
- Controllers : `*.controller.ts`
- DTOs : `*.dto.ts`
- Entites : `*.entity.ts`
- Tests : `*.spec.ts`
- Calculateurs : `*.calculator.ts`

## Commandes courantes

```bash
# Developpement
pnpm run start:dev          # Mode developpement avec watch
pnpm run test               # Tests unitaires
pnpm run test:watch         # Tests en mode watch
pnpm run lint               # Linter ESLint
pnpm run typecheck          # Verification TypeScript

# Base de donnees
pnpm run db:generate        # Generer les migrations Drizzle
pnpm run db:migrate         # Appliquer les migrations
pnpm run db:studio          # Interface Drizzle Studio
```

## Architecture DDD

Le projet suit une architecture Domain-Driven Design :

```
src/
├── domains/
│   ├── cadastre/           # Donnees parcellaires IGN
│   ├── energie/            # Raccordements electriques
│   ├── transport/          # Arrets de transport
│   ├── urbanisme/          # PLU, zonages
│   ├── risques-naturels/   # Inondations, argiles
│   ├── risques-technologiques/
│   └── georisques/         # API GeoRisques
├── enrichment/             # Orchestration enrichissement
├── calculators/            # Logique metier pure
└── adapters/               # APIs externes
```

## APIs externes integrees

- IGN Cadastre : donnees parcellaires
- GeoRisques : risques environnementaux
- transport.data.gouv.fr : arrets de transport
- API Carto : zonages PLU
- INSEE : donnees demographiques

## Tests

- Fichiers de test a cote des fichiers source (`*.spec.ts`)
- Utiliser des fixtures pour les donnees de test
- Mock des APIs externes obligatoire
- Coverage minimum attendu : 80%

## Deploiement

- Plateforme : Scalingo
- CI/CD : GitHub Actions
- Environnements : review apps par PR

## Variables d'environnement

### Environnement d'execution

- `NODE_ENV` : `development`, `staging`, ou `production`
  - `development` : Mode local, bypass de securite sur certains guards
  - `staging` : Environnement de pre-production
  - `production` : Environnement de production

### Securite des origines (API)

- `ALLOWED_INTEGRATOR_ORIGINS` : Liste des origines supplementaires autorisees pour les integrateurs (separees par des virgules)
  - Origines par defaut : `mutafriches.beta.gouv.fr`, `mutafriches.incubateur.ademe.dev`, `benefriches.ademe.fr`, `benefriches.incubateur.ademe.dev`
  - En mode `development` : localhost autorise automatiquement
  - Exemple : `ALLOWED_INTEGRATOR_ORIGINS=https://custom-domain.fr,https://autre-domaine.fr`

- `ALLOWED_ORIGINS` : Liste des origines autorisees pour les evenements (tracking interne, separees par des virgules)
  - Origines par defaut : `mutafriches.beta.gouv.fr`, `mutafriches.incubateur.ademe.dev`
  - Localhost autorise uniquement en mode `development`
  - Note : Les integrateurs (Benefriches, etc.) ne doivent PAS envoyer d'evenements

### Comportement des guards

| Route | Guard | Dev | Staging/Prod |
|-------|-------|-----|--------------|
| POST /enrichissement | IntegrateurOriginGuard | Bypass | Origines whitelistees |
| POST /evaluation/calculer | IntegrateurOriginGuard | Bypass | Origines whitelistees |
| POST /friches/* (deprecated) | IntegrateurOriginGuard | Bypass | Origines whitelistees |
| POST /evenements | OriginGuard | localhost + Mutafriches | Mutafriches uniquement |

## Points d'attention

1. Les identifiants cadastraux francais ont des formats complexes (DOM-TOM, Corse)
2. Coordonnees en Lambert 93 (EPSG:2154) pour la France metropolitaine
3. Donnees spatiales gerees via PostGIS
4. Conformite DSFR obligatoire pour l'UI
