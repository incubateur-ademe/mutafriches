# ADR-0016 : Configuration centralisée et validée (AppConfig)

**Date** : 2026-06-03
**Statut** : Accepté

## Contexte

Les variables d'environnement de l'API étaient lues en `process.env.*` brut dans une trentaine de fichiers, sans typage ni validation. Conséquences :

- Aucune validation au démarrage : une variable manquante ou malformée (PORT non numérique, email expéditeur invalide) échouait tard, à l'usage.
- Duplication : `GEORISQUES_API_URL` relu dans 13 sous-services, le bloc de configuration PostgreSQL (`SCALINGO_POSTGRESQL_URL` vs `DB_*`) copié à l'identique dans `DatabaseService` et 5 scripts d'import.
- Pas de source unique : difficile de savoir quelles variables existent et leurs valeurs par défaut.

## Décision

> Nous centralisons l'accès aux variables d'environnement dans une classe `AppConfig` (getters typés groupés par domaine), avec une validation `class-validator` exécutée au démarrage (fail-fast).

- `apps/api/src/config/env.validation.ts` : classe `EnvironmentVariables` (décorateurs) + `validateEnvironment()` qui throw si une valeur présente est malformée.
- `apps/api/src/config/app.config.ts` : classe `AppConfig` exposant `runtime`, `database`, `origins`, `metabase`, `mail`, `externalApis`, `scripts`. La logique de parsing `SCALINGO_POSTGRESQL_URL` y est centralisée.
- `apps/api/src/config/config.module.ts` : module `@Global` qui fournit `AppConfig` lié au singleton.
- `getAppConfig()` : singleton importable hors DI (scripts d'import). `resetAppConfig()` est réservé aux tests qui manipulent `process.env`.

`shared/utils/environment.utils.ts` reste la source d'autorité pour `NODE_ENV` (isProduction/isDevelopment…), ré-exposée via `AppConfig.runtime`.

## Options envisagées

### Option A — Classe `AppConfig` maison + validation class-validator (retenue)

- Avantages : aucune nouvelle dépendance (`class-validator`/`class-transformer` déjà présents) ; un seul point d'accès typé ; validation fail-fast au démarrage ; fonctionne en DI **et** hors DI (scripts) via le singleton ; logique DB dédupliquée.
- Inconvénients : un singleton à réinitialiser dans les tests qui mutent `process.env` (`resetAppConfig()`).

### Option B — `@nestjs/config` (ConfigModule/ConfigService)

- Avantages : solution idiomatique NestJS, validation intégrée.
- Inconvénients : nouvelle dépendance ; `ConfigService` injecté peu pratique dans les scripts hors DI et dans les initialisations de champ des adapters (georisques/enedis).

### Option C — Étendre `environment.utils.ts` (fonctions)

- Avantages : le plus léger, pas de classe.
- Inconvénients : pas de validation centralisée stricte ni de regroupement par domaine ; l'utilisateur souhaitait une classe.

## Conséquences

### Positives

- Variable malformée détectée **au démarrage** avec un message explicite.
- Source unique et typée pour toutes les variables ; valeurs par défaut au même endroit.
- Déduplication du bloc DB (1 implémentation au lieu de 6) et de `GEORISQUES_API_URL` (1 accès au lieu de 13).

### Négatives / Risques

- Les tests unitaires qui manipulent `process.env` doivent appeler `resetAppConfig()` (le singleton est mémoïsé).
- Une ligne d'heuristique PaaS dans `import-transport-stops.ts` (`SCALINGO_POSTGRESQL_URL || isProduction()` pour choisir `tmpdir`) reste en lecture directe, volontairement, pour ne pas modifier ce comportement de détection.

### Migration

- Tous les `process.env.*` des services et scripts pointent désormais vers `AppConfig` / `getAppConfig()`.
- Aucun changement de variables d'environnement existantes : la validation est permissive (variables optionnelles), elle valide surtout le type/format quand la valeur est présente.

## Liens

- Socle : `apps/api/src/config/`
- Détection d'environnement : `apps/api/src/shared/utils/environment.utils.ts`
- Variables documentées : `apps/api/.env.example`, section « Variables d'environnement » du `CLAUDE.md`
