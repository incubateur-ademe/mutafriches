# ADR-0028 : Le tag `versionAlgorithme` persisté reflète la version réellement utilisée

**Date** : 2026-07-09
**Statut** : Accepté

## Contexte

Chaque évaluation persistée porte un tag `versionAlgorithme` (colonne `version_algorithme`, snapshot de provenance). Ce tag provenait du défaut du constructeur `Evaluation` (`entities/evaluation.entity.ts`), qui l'initialisait à `VERSION_ALGO` (`packages/shared-types/src/evaluation/constants/version.constants.ts`).

Deux problèmes :

- `VERSION_ALGO` valait `"1.8"` — désynchronisé, en **valeur** et en **format**, du registre d'algorithme (`apps/api/src/evaluation/services/algorithme/versions/index.ts`, `VERSION_COURANTE = "v1.10"`), qui est la source de vérité effective du calcul.
- En mono-site (`orchestrateur.service.ts`), l'évaluation était persistée **sans surcharge** du tag. Résultat : toutes les évaluations étaient taguées `"1.8"` alors que le calcul utilisait réellement la version courante (`v1.10`), ou la version passée via `?versionAlgorithme=`. `GET /evaluation/metadata` exposait pourtant `algorithme: VERSION_COURANTE`, d'où une incohérence entre la métadonnée annoncée et le tag stocké.

La provenance était donc fausse : impossible de savoir a posteriori quelle version d'algorithme avait produit un résultat donné.

Contrainte structurante : `VERSION_COURANTE` vit dans `apps/api` (le registre liste toutes les matrices), tandis que `VERSION_ALGO` vit dans `shared-types`, importable par l'API **et** par l'UI. `shared-types` ne peut pas dépendre de `apps/api` : le registre ne peut pas être importé côté UI.

## Décision

> Le tag `versionAlgorithme` persisté est la version **réellement utilisée** pour le calcul, résolue à l'orchestration : surcharge `?versionAlgorithme=` si présente, sinon `VERSION_COURANTE` (registre). Elle est passée explicitement au constructeur `Evaluation`, qui n'a plus de défaut codé en dur sur une constante externe.

`VERSION_COURANTE` (registre `apps/api`) est la **source de vérité unique** de la version d'algorithme. `VERSION_ALGO` (`shared-types`) est conservé mais **rétrogradé au rôle de miroir cross-package** : il sert uniquement à l'UI (tag du résultat renvoyé aux intégrateurs via l'iframe, qui ne peut pas importer le registre). Un garde-fou de test (`versions.spec.ts`) impose `VERSION_ALGO === VERSION_COURANTE`, format `vX.Y` inclus : toute divergence future casse la CI.

Sur un cache hit (qui n'intervient que sans surcharge de version), la version qui a produit les résultats réutilisés est relue depuis la ligne en cache (`CachedEvaluation.versionAlgorithme`) et re-taguée sur la ligne d'analytics re-persistée, plutôt que d'être ré-affirmée depuis `VERSION_COURANTE`.

En corollaire, le cache est rendu **conscient de la version** : `findValidCache` ne sert que les lignes taguées `VERSION_COURANTE`. Une évaluation produite via `?versionAlgorithme=` (surcharge) est persistée pour la traçabilité mais reste transiente vis-à-vis du cache : elle bypassait déjà la **lecture** du cache, elle ne doit pas non plus être resservie à un appel par défaut. Sans ce filtre, une ligne d'une version antérieure (surcharge, ou courante d'avant un déploiement) fuitait dans les cache hits par défaut et renvoyait des résultats hors version courante.

## Options envisagées

### Option A — Registre source de vérité, version résolue à l'orchestration, `VERSION_ALGO` miroir guardé (retenue)

- Avantages : le tag reflète la version réelle (courante ou surcharge) ; `VERSION_COURANTE` reste l'unique source de vérité ; l'UI garde une constante importable, désormais correcte (`v1.10`), sans changement de code UI ; le garde-fou empêche toute re-désynchronisation, sur le modèle déjà en place `POIDS_CRITERES` / `CRITERES_METADATA` ; changement minimal et localisé.
- Inconvénients : deux constantes (`VERSION_COURANTE`, `VERSION_ALGO`) à maintenir alignées — mais l'alignement est mécaniquement vérifié par un test.

### Option B — Supprimer `VERSION_ALGO`, faire lire la version à l'UI depuis le backend

- Avantages : une seule constante ; l'UI consommerait la version réelle du résultat.
- Inconvénients : `MutabiliteOutputDto` ne porte pas la version ; l'ajouter modifie le contrat public de `POST /evaluation/calculer` (portée élargie) ; l'UI devrait sinon appeler `GET /evaluation/metadata` à chaque évaluation. Disproportionné pour cette correction de provenance.

### Option C — Faire pointer `VERSION_ALGO` sur `VERSION_COURANTE` par import direct

- Avantages : une seule valeur, aucune duplication.
- Inconvénients : **impossible** — `shared-types` ne peut pas importer `apps/api` (inversion de la dépendance). Un précédent refactor (#19, tentative de config partagée dans `shared-types`) a d'ailleurs été reverté pour sur-couplage.

## Conséquences

### Positives

- Provenance correcte : le tag persisté correspond à la version qui a réellement calculé le résultat.
- Cohérence avec `GET /evaluation/metadata` (qui annonçait déjà `VERSION_COURANTE`).
- Format de version unifié partout (`vX.Y`), y compris le tag iframe envoyé aux intégrateurs.
- Garde-fou de non-régression : `VERSION_ALGO === VERSION_COURANTE` vérifié en test.
- Fixture de test alignée : `EvaluationBuilder` ne défaut plus sur le format legacy `"1.1.0"`.
- Cache correct : un appel par défaut ne peut plus recevoir un résultat hors version courante (fuite d'une ligne de surcharge). Un déploiement qui bump `VERSION_COURANTE` invalide de fait les lignes de l'ancienne version (elles ne matchent plus), sans purge explicite.

### Négatives / Risques

- Les évaluations créées **avant** ce correctif conservent leur tag `"1.8"` en base : elles ne sont **pas** migrées (la version réelle qui les a produites n'est pas récupérable de façon fiable). Le champ reste un `varchar(20)`, aucune migration de schéma nécessaire. Corollaire bénin du filtre de cache : ces lignes `"1.8"` ne serviront jamais de cache hit (elles ne matchent pas `VERSION_COURANTE`), donc les premiers appels par défaut après déploiement recalculent.

### Migration

- Aucune migration de données ni de schéma.
- `VERSION_ALGO` passé de `"1.8"` à `"v1.10"` ; rebuild de `shared-types` requis (le `dist` alimente les tests API et l'UI).

## Liens

- `apps/api/src/evaluation/services/orchestrateur.service.ts` (résolution `?? VERSION_COURANTE`, cache hit)
- `apps/api/src/evaluation/entities/evaluation.entity.ts` (paramètre `versionAlgorithme`, défaut `VERSION_COURANTE`)
- `apps/api/src/evaluation/repositories/evaluation.repository.ts` (`CachedEvaluation.versionAlgorithme`, `findValidCache` filtré sur `VERSION_COURANTE`)
- `apps/api/src/evaluation/services/algorithme/versions/index.ts` (`VERSION_COURANTE`, source de vérité)
- `apps/api/src/evaluation/services/algorithme/versions/versions.spec.ts` (garde-fou `VERSION_ALGO === VERSION_COURANTE`)
- `packages/shared-types/src/evaluation/constants/version.constants.ts` (`VERSION_ALGO`, miroir UI)
- ADR-0027 (publication `v1.10`, dont dépend le garde-fou), ADR-0026 (source de vérité unique)
