# ADR-0027 : Unité des distances — mètres dans le DTO, conversion en km à la frontière de l'algorithme

**Date** : 2026-07-09
**Statut** : Accepté

## Contexte

Deux critères de distance de l'enrichissement présentaient une incohérence d'unité entre leur production et leur consommation :

- `distanceAutoroute` est stockée en **mètres** (`transport-enrichissement.service.ts`, WFS IGN qui renvoie des mètres).
- `distanceRaccordementElectrique` est stockée en **mètres** (`energie-enrichissement.service.ts`, `_geo_distance` Enedis en mètres).

Or la matrice de scoring (`algorithme.config.ts`, source de vérité : fichier Excel de référence) attend ces valeurs en **kilomètres** (seuils `< 1 / 1-2 / 2-5 / > 5`). Aucune conversion n'existait entre le DTO et la matrice (`site.entity.ts` recopie les valeurs brutes, `extraireCriteres` les passe directement à `matriceCritere`).

Conséquence en production : toute distance réelle en mètres (≥ 5) est relue comme ≥ 5 km et tombe systématiquement dans la pire tranche. Cela **sous-note l'industrie** (via l'autoroute) et le **photovoltaïque** (via l'autoroute et le raccordement) sur quasiment tous les sites du parcours d'enrichissement live. Les usages Résidentiel, Équipements, Culture, Tertiaire et Renaturation restent numériquement neutres sur ces deux critères, mais leur rang peut changer.

Le bug n'était couvert par aucun test actif (la suite de validation contre l'Excel est en `describe.skip` depuis le retrait des fixtures, cf. #148). Le champ DTO est par ailleurs consommé en mètres par l'affichage (`formatDistance`, `dynamicTags`), ce qui impose de choisir une unité unique pour le DTO et de convertir à la frontière opposée.

## Décision

> Le DTO conserve les distances en **mètres** (au plus près de la source et cohérent avec l'affichage). La conversion **mètres → km** se fait uniquement à la **frontière de l'algorithme**, dans `extraireCriteres`, via un helper dédié `metresVersKm` qui préserve `null` et `undefined`. La matrice reste en km (source de vérité Excel, inchangée).

La conversion est **globale** (appliquée quelle que soit la version d'algorithme demandée) : toutes les matrices historiques sont en km, la conversion vaut donc pour toutes. `distanceTransportCommun` n'est pas concernée (mètres des deux côtés).

## Options envisagées

### Option A — DTO en mètres, conversion à la frontière de l'algo (retenue)

- Avantages : DTO au plus près de la source (mètres bruts, précis, entiers) ; les trois distances du DTO deviennent homogènes en mètres (avec `distanceTransportCommun`) ; affichages `formatDistance`/`dynamicTags` inchangés dans leur principe ; matrice Excel intacte ; un seul point de conversion, testable isolément.
- Inconvénients : diff large mais peu profond (algo + UI dynamicTags + contrat Swagger) ; la conversion vit dans `extraireCriteres`, il faut penser à l'appliquer si un nouveau critère de distance en mètres apparaît.

### Option B — DTO en km, normalisation à l'enrichissement

- Avantages : la matrice, les exemples Swagger et `dynamicTags` (qui multipliait déjà par 1000) auraient été quasi inchangés.
- Inconvénients : unités **mixtes** dans le DTO (`distanceTransportCommun` reste en mètres) ; perte de précision (float km vs entier mètre) ; casse tous les affichages en mètres ; s'éloigne de l'unité native des sources IGN/Enedis.

### Option C — Convertir dans la matrice de scoring

- Avantages : aucune couche intermédiaire à modifier.
- Inconvénients : rompt la correspondance stricte entre la matrice et le fichier Excel de référence (source de vérité) ; dupliquerait la conversion dans chaque version de matrice.

## Conséquences

### Positives

- Correction du sous-scoring systématique de l'industrie et du photovoltaïque sur le parcours live.
- Contrat DTO cohérent de bout en bout : mètres à la production, à l'affichage et dans la documentation Swagger ; km uniquement à l'intérieur de la matrice.
- Filet de sécurité ajouté (`distance-unite.spec.ts`) : table de seuils m↔km aux bornes + sémantique `null`/`undefined`.

### Négatives / Risques

- La conversion étant globale, il n'est plus possible de reproduire l'ancien comportement bugué pour une version antérieure (les évaluations passées taguées avec l'ancien comportement ne sont pas reproductibles à l'identique). Acceptable : ce comportement était un bug.
- `v1.10` a une matrice et des poids **identiques** à `v1.9` : c'est un marqueur de provenance (date du correctif), pas un changement de matrice.
- Vigilance : tout futur critère de distance stocké en mètres mais scoré en km devra passer par `metresVersKm` dans `extraireCriteres`.

### Migration

- `metresVersKm` appliqué aux deux critères dans `extraireCriteres`.
- UI `dynamicTags` (`config.ts`, `labels.ts`) réalignée sur les mètres (retrait des `× 1000`).
- Contrat Swagger (`enrichissement.dto.ts`, `calculer-mutabilite.examples.ts`) et type partagé corrigés en mètres.
- Publication de la version d'algorithme `v1.10` (registre `versions/index.ts`, `VERSION_COURANTE`).

## Liens

- `apps/api/src/evaluation/services/algorithme/distance.utils.ts` (`metresVersKm`)
- `apps/api/src/evaluation/services/calcul.service.ts` (`extraireCriteres`)
- `apps/api/src/evaluation/services/algorithme/algorithme.config.ts` (matrice, seuils en km)
- `apps/api/src/evaluation/services/distance-unite.spec.ts` (régression)
- `apps/api/src/evaluation/services/algorithme/versions/v1.10.ts`
- `apps/ui/src/features/resultats/utils/dynamicTags/` (`config.ts`, `labels.ts`)
- Documentation : `docs/evaluation-mutabilite.md`, `.claude/context/evaluation-patterns.md`
