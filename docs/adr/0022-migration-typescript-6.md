# ADR-0022 : Passage à TypeScript 6.0 et gestion des options dépréciées

**Date** : 2026-07-02
**Statut** : Accepté

## Contexte

Dependabot a proposé le bump `typescript` `5.9.3 → 6.0.3` (montée de version **majeure**, `packages/typescript-6.0.3`). TypeScript 6.0 introduit deux catégories de ruptures qui touchent le projet :

1. **Options de compilation dépréciées** (elles seront supprimées en TS 7.0, le compilateur Go « Corsa ») :
   - `moduleResolution: node10` (l'alias `"node"`, ou l'implicite lié à `module: commonjs`) — présent sur les trois projets CommonJS : racine, `apps/api`, `packages/shared-types`.
   - `baseUrl` — présent sur `apps/ui`.
2. **Résolution des imports plus stricte** : TS 6.0 interdit d'appeler un *namespace import* (`import * as x` puis `x(...)`), pour coller à la sémantique ESM réelle où l'objet de namespace n'est pas appelable. Le package `postgres` (`export = postgres`, une fonction) était importé ainsi dans `DatabaseService` et 5 scripts d'import → `TS2349: This expression is not callable`.

Contrainte structurante découverte : dans TypeScript, `moduleResolution` est **couplé** à `module`. On ne peut pas « juste changer le resolver ». Sortir de `node10` impose de choisir entre `node16`/`nodenext` (apparié à `module: node16`/`nodenext`) ou `bundler` (apparié à `module: esnext`/`preserve`) — donc de changer aussi l'**emit**. Or `apps/api` et `shared-types` sont émis par `tsc` (`nest build` sans `builder` swc, `shared-types` = `tsc`) et tournent en **CommonJS** (`node dist/src/main.js` + `emitDecoratorMetadata`).

## Décision

> Nous adoptons TypeScript 6.0 en **silençant les dépréciations** avec `ignoreDeprecations: "6.0"` plutôt qu'en migrant la stratégie de modules maintenant. Nous corrigeons uniquement les ruptures dures qui empêchent la compilation.

- `ignoreDeprecations: "6.0"` ajouté sur `tsconfig.json` (racine), `apps/api/tsconfig.json`, `packages/shared-types/tsconfig.json` (couvre `moduleResolution=node10`) et `apps/ui/tsconfig.json` (couvre `baseUrl`). C'est le mécanisme de transition officiellement prévu par TypeScript, valable sur toute la ligne 6.x.
- `import * as postgres from "postgres"` → `import postgres from "postgres"` dans les 6 fichiers concernés. Le default import d'un module `export =` reste appelable **et** conserve l'accès au type mergé (`postgres.Sql`).

## Options envisagées

### Option A — `ignoreDeprecations: "6.0"` + correctifs durs minimaux (retenue)

- Avantages : PR focalisée sur le bump ; aucun changement d'emit ni de runtime ; mécanisme officiel de transition ; tient jusqu'à TS 7.0 (pas de date). Faible risque.
- Inconvénients : dette différée — les dépréciations réapparaîtront à la migration TS 7.0.

### Option B — Migrer `apps/api` + `shared-types` vers `nodenext`

- Avantages : cible « correcte » à long terme, alignée sur la résolution Node native.
- Inconvénients : change l'emit ; respecte les champs `exports`/`type` des `package.json` (peut révéler des résolutions différentes) ; expose davantage d'ajustements d'interop `esModuleInterop`. Trop large pour un bump de dépendance → mérite sa propre PR + ADR.

### Option C — Migrer vers `bundler`

- Écartée pour `apps/api`/`shared-types` : `bundler` impose `module: esnext`/`preserve`, donc de l'ESM émis, incompatible avec le runtime CommonJS (`require`, `node dist/src/main.js`, DI décorateurs via tsc).

## Conséquences

### Positives

- TypeScript 6.0 adopté sans toucher à l'emit ni au runtime. `format` + `lint` + `typecheck` + `test` (894 tests) + `build` verts.
- Correctif `postgres` = alignement sur la sémantique ESM, sans changement de comportement.

### Négatives / Risques

- **Dette de migration différée** : `moduleResolution=node10` (api/shared-types/racine) et `baseUrl` (ui) devront être migrés **avant** TS 7.0.
- `apps/ui` est déjà en `moduleResolution: bundler` ; seul `baseUrl` y est déprécié. Sa migration est triviale (retirer `baseUrl`, les `paths` fonctionnent seuls depuis TS 4.1) et pourra retirer son `ignoreDeprecations` — non faite ici pour garder la PR strictement sur le bump.

### Migration future (hors scope de cet ADR)

- `apps/api` + `shared-types` + racine : cible **`nodenext`** (le seul choix compatible CommonJS + tsc emit). À traiter en PR dédiée + ADR, avec cycle typecheck/lint/test/build complet, en s'attendant à quelques ajustements d'imports d'interop.
- `apps/ui` : simple retrait de `baseUrl`.

## Liens

- Bump : `package.json`, `packages/shared-types/package.json`, `pnpm-lock.yaml`
- Options silencées : `tsconfig.json`, `apps/api/tsconfig.json`, `apps/ui/tsconfig.json`, `packages/shared-types/tsconfig.json`
- Correctif d'import : `apps/api/src/shared/database/database.service.ts` + `apps/api/src/scripts/import-*.ts`
- Guide de migration TS 6.0 : https://aka.ms/ts6
