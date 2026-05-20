# ADR-0014 : Référentiel EPCI/communes en base via JSON Etalab

**Date** : 2026-05-20
**Statut** : Accepté

## Contexte

Le dashboard de statistiques publiques expose déjà une moyenne de sites analysés par commune ([stats.service.ts](../../apps/api/src/stats/stats.service.ts)). Pour mesurer l'adoption au niveau intercommunal, on veut ajouter une moyenne par EPCI (Établissement Public de Coopération Intercommunale). La table `evaluations` ne contient que le `code_insee` de la commune — aucun référentiel ne permet de remonter à l'EPCI.

Trois options se présentent : appeler une API externe à chaque calcul, importer un fichier CSV local, ou stocker un référentiel normalisé en base. Par ailleurs, la source de données peut venir du fichier DGCL « Composition communale des EPCI à fiscalité propre » ou du package Etalab `@etalab/decoupage-administratif` publié sur data.gouv.fr.

## Décision

Nous utilisons **deux tables normalisées (`epci` et `communes`)** en base, alimentées par un script qui télécharge directement les JSON officiels Etalab via leur URL `unpkg.com`.

> Source : <https://www.data.gouv.fr/datasets/decoupage-administratif-1/> — package npm `@etalab/decoupage-administratif`, version épinglée 5.3.0.

## Options envisagées

### Option A — Référentiel normalisé en DB depuis JSON Etalab (retenue)

- Avantages : pas de fichier à télécharger manuellement (`pnpm db:epci:import` suffit), source officielle data.gouv.fr, version épinglée et versionnable, structure JSON propre (mapping commune→EPCI dans `epci.json` via `membres[]`), jointures performantes pour les stats Metabase, cohérent avec le pattern existant (cf. [ADR-0002](0002-postgis-donnees-locales.md))
- Inconvénients : dépendance réseau ponctuelle au moment de l'import (unpkg.com), pas d'historique des changements d'appartenance

### Option B — Import CSV DGCL local

- Avantages : pas de dépendance réseau pour l'import
- Inconvénients : fichier à télécharger manuellement à chaque mise à jour, parsing CSV maison (BOM, encodage Windows-1252, séparateur, détection des noms de colonnes variables d'une année sur l'autre), source moins stable que le package npm Etalab

### Option C — Appel API externe à chaque calcul de stat

- Avantages : données toujours à jour, pas de table à maintenir
- Inconvénients : latence sur les endpoints stats, dépendance à la disponibilité de l'API externe, jointures Metabase impossibles (Metabase ne sait que requêter la base), incohérent avec le pattern « données locales » du projet

## Conséquences

### Positives

- Le calcul `getMoyenneSitesParEpci()` reste une jointure SQL simple (`evaluations × communes × epci`), réutilisable telle quelle dans Metabase
- L'import est idempotent et rapide (~1.3 s pour 1 255 EPCI + 34 969 communes)
- La couverture est totale sur les évaluations actuelles : 100 % des codes INSEE matchent une commune et un EPCI
- Le référentiel peut être réutilisé pour d'autres statistiques agrégées (par département, région, etc.)

### Négatives / Risques

- Le script dépend d'unpkg.com (CDN public). Mitigation : URL épinglée à la version 5.3.0 + fallback possible vers raw.githubusercontent.com en cas de besoin.
- Les arrondissements municipaux (Paris 75101-75120, Lyon 69381-69389, Marseille 13201-13216) ne sont pas insérés — seules les communes-têtes (75056, 69123, 13055) le sont. Aujourd'hui les évaluations n'utilisent pas les codes d'arrondissement, mais si cela change, il faudra ajouter une normalisation.
- 98 communes (~0.3 %) n'ont pas d'EPCI (îles bretonnes, certaines collectivités d'outre-mer). La requête stat filtre `WHERE epci_siren IS NOT NULL`.

### Migration

1. Migration Drizzle `0017_quiet_bucky.sql` appliquée (tables `epci` + `communes` avec FK et index).
2. `pnpm db:epci:import` télécharge et insère le référentiel.
3. La stat `getMoyenneSitesParEpci()` apparaît automatiquement dans la réponse de `GET /api/stats`.

## Liens

- Schémas : [apps/api/src/shared/database/schemas/epci.schema.ts](../../apps/api/src/shared/database/schemas/epci.schema.ts), [apps/api/src/shared/database/schemas/communes.schema.ts](../../apps/api/src/shared/database/schemas/communes.schema.ts)
- Migration : `apps/api/src/shared/database/migrations/0017_quiet_bucky.sql`
- Script d'import : [apps/api/src/scripts/import-epci-communes.ts](../../apps/api/src/scripts/import-epci-communes.ts)
- Service stats : [apps/api/src/stats/stats.service.ts](../../apps/api/src/stats/stats.service.ts)
- Source : <https://www.data.gouv.fr/datasets/decoupage-administratif-1/>
- ADR connexe : [ADR-0002 — PostGIS avec données locales](0002-postgis-donnees-locales.md)
