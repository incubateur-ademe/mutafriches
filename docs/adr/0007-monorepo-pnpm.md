# ADR-0007 : Monorepo pnpm

**Date** : 2025-06-01
**Statut** : Accepté

## Contexte

Le projet comprend un backend NestJS, un frontend React, et des types TypeScript partagés. Il faut choisir entre un monorepo (tout dans un seul dépôt) ou des repos séparés.

## Décision

Nous utilisons un **monorepo pnpm** avec 3 workspaces : `apps/api`, `apps/ui`, `packages/shared-types`.

## Options envisagées

### Option A — Monorepo pnpm (retenue)

- Avantages : types partagés compilés automatiquement, version unique de chaque dépendance, déploiement coordonné, CI/CD simplifié
- Inconvénients : build plus complexe (ordre de compilation), pnpm obligatoire

### Option B — Repos séparés

- Avantages : isolation complète, équipes indépendantes
- Inconvénients : synchronisation des types partagés via npm publish, risque de désynchronisation API/UI, CI/CD dupliqué

## Conséquences

### Positives

- Le package `@mutafriches/shared-types` garantit que les DTOs sont identiques entre API et UI
- Un seul `pnpm build` compile tout dans le bon ordre
- Le build Scalingo utilise `--filter` pour cibler les workspaces

### Négatives / Risques

- pnpm est obligatoire (npm et yarn interdits) — documenté dans CLAUDE.md
- L'ordre de build compte : shared-types doit être compilé avant api et ui

## Liens

- Workspaces : `pnpm-workspace.yaml`
- Types partagés : `packages/shared-types/`
- Build order : `package.json` → `scalingo-postbuild`
