# ADR-0013 : Séparer l'affichage granulaire des ZAENR du scoring grossier

**Date** : 2026-04-16
**Statut** : Accepté

## Contexte

Le WFS Géoplateforme (ZAER) expose pour chaque parcelle une liste de zones d'accélération des énergies renouvelables, avec pour chacune une `filiere` (SOLAIRE_PV, EOLIEN, BIOMASSE, …) et un `detailFiliere` plus fin pour le photovoltaïque (ex. `SOLAIRE_PV_NV_OMBRIERE`, `SOLAIRE_PV_RNV_SOL`, `SOLAIRE_PV_NV_TOIT`).

Côté backend, le calculateur [enr.calculator.ts](../../apps/api/src/enrichissement/services/enr/enr.calculator.ts) réduit cette liste à **un seul enum à 3 valeurs** dans [zone-acceleration-enr.enum.ts](../../packages/shared-types/src/enrichissement/enums/zone-acceleration-enr.enum.ts) :

- `NON`
- `OUI_SOLAIRE_PV_OMBRIERE` (si au moins une zone a un `detailFiliere` contenant `OMBRIERE`)
- `OUI` (fourre-tout pour tout le reste : PV sol, PV toit, éolien, biogaz, etc.)

Cette simplification sert à alimenter la matrice de scoring 24 × 7 — seul l'ombrière a un score différencié (`TRES_POSITIF`) pour l'usage Photovoltaïque, les autres filières partagent le score `POSITIF` générique.

Un bug remonté sur la parcelle **40332000AD0159** (Ychoux) a révélé que l'UI, en consommant directement cet enum, perdait toute la richesse disponible : le site est en zone `SOLAIRE_PV_RNV_SOL` **et** `SOLAIRE_PV_NV_TOIT`, mais l'affichage ne montrait que `Oui` (générique) et le tag carte "ZA Photovoltaïque" remontait à tort (alors que la spec le réserve à l'ombrière).

Une première itération avait proposé d'étendre l'enum avec deux valeurs supplémentaires (`OUI_SOLAIRE_PV_SOL`, `OUI_SOLAIRE_PV_TOITURE`) et de les scorer différemment dans la matrice. La relecture de la spec du ticket a **écarté** cette piste : la spec impose au contraire de garder le scoring en 3 classes et d'enrichir uniquement l'**affichage** avec des badges cumulatifs par filière, parmi 11 libellés normalisés (`Non`, `Oui`, `Oui Solaire photovoltaïque`, `Oui Solaire thermique`, `Oui Eolien`, `Oui Hydroélectricité`, `Oui Biométhane`, `Oui Biomasse`, `Oui Géothermie`, `Oui Aérothermie`, `Oui Thalassothermie`).

## Décision

> Nous séparons **l'affichage** (granulaire, cumulatif, piloté côté UI par le bloc détaillé `zaer.zones`) du **scoring** (grossier, 3 classes, inchangé côté API). L'ombrière reste la seule particularité PV — à la fois pour le score `TRES_POSITIF` de l'usage Photovoltaïque et pour le tag carte "ZA Photovoltaïque".

Concrètement :

- Le backend continue de renvoyer l'enum `ZoneAccelerationEnr` à 3 valeurs **et** la structure complète `ZaerEnrichissement` (avec `zones` + `filieres` + `detailFiliere`).
- L'UI synthétise des badges cumulatifs par filière via `buildZaerBadges(zaer)` dans [enrichissment.mapper.ts](../../apps/ui/src/features/analyser/utils/enrichissment.mapper.ts), et stocke le résultat dans `ParcelleUiModel.zaerBadges: string[]`.
- Le tag carte "ZA Photovoltaïque" ne remonte que si au moins une zone a un `detailFiliere` contenant `OMBRIERE` ([dynamicTags/config.ts](../../apps/ui/src/features/resultats/utils/dynamicTags/config.ts)).
- La matrice de scoring, le calculateur backend et les versions figées (v1.1 → v1.4) ne bougent pas.

## Options envisagées

### Option A — Étendre l'enum (`OUI_SOLAIRE_PV_SOL`, `OUI_SOLAIRE_PV_TOITURE`) + scoring différencié

- Avantages :
  - Rend la granularité visible à la fois dans l'API publique et dans la notation.
  - Permet des analyses Metabase sur la finesse du zonage PV.
- Inconvénients :
  - **Hors spec** : la spec demande explicitement de conserver les 3 classes existantes.
  - Complexifie la matrice (ligne `zoneAccelerationEnr` étendue) et impose une mise à jour des versions figées d'algorithme.
  - Oblige à réitérer l'exercice pour chaque nouvelle filière (éolien `NV` vs `RNV`, etc.) alors que le signal métier associé n'est pas demandé.
  - Cache d'évaluation : aucune donnée complémentaire n'est impactée, mais chaque nouvelle valeur d'enum élargit la surface d'API.

### Option B — Garder le scoring actuel, enrichir l'UI avec des badges cumulatifs (retenue)

- Avantages :
  - **Alignement spec** sur les 11 libellés et la règle "un badge par filière".
  - Zéro impact sur la matrice, sur les versions figées, sur les DTO de l'API publique.
  - Pas de migration de données : la colonne `zone_acceleration_enr` conserve ses 3 valeurs.
  - Le calculateur backend reste trivial (binaire OMBRIERE / autre) et symétrique avec le tag carte.
  - L'UI consomme déjà `zaer.zones` (WFS brut) ; elle dispose donc naturellement de toute la granularité nécessaire.
- Inconvénients :
  - Deux vocabulaires en parallèle : enum technique côté backend (`oui-solaire-pv-ombriere`) et libellés d'affichage côté UI (`Oui Solaire photovoltaïque`). À documenter.
  - La table de correspondance `filiere → libellé` vit dans `enrichissment.mapper.ts` ; chaque nouvelle filière WFS demande une mise à jour explicite.

### Option C — Refactor complet vers un scoring par liste de filières

- Avantages :
  - Modèle uniforme : chaque filière a son propre poids et son propre score par usage.
- Inconvénients :
  - Invasif : restructure le critère dans la matrice, impacte `Site`, le calculateur, tous les tests d'algorithme, toutes les versions figées.
  - Hors scope du ticket initial et sans bénéfice métier démontré à court terme.

## Conséquences

### Positives

- Bug Ychoux résolu : l'étape 3 de qualification affiche correctement la combinaison des filières présentes.
- Tag carte "ZA Photovoltaïque" fidèle à la spec (uniquement ombrière).
- Zéro risque de régression sur le scoring et la fiabilité : la matrice n'a pas bougé.
- Versions figées d'algorithme (v1.1 → v1.4) inchangées, aucun snapshot à recalculer.

### Négatives / Risques

- Divergence de vocabulaire entre backend (3 valeurs d'enum) et UI (11 libellés de badges) — à maintenir synchronisés quand une nouvelle filière ZAENR apparaît côté WFS.
- L'enum backend `ZoneAccelerationEnr` reste grossier : les intégrateurs (Benefriches) qui consomment l'API sans passer par le champ `zaer` détaillé n'ont pas accès à la liste des filières. Si un besoin Metabase émerge plus tard, il faudra revisiter via un ADR successeur.
- La règle "ombrière prime sur tout autre `detailFiliere` PV" est dupliquée en deux endroits (calculateur backend pour le scoring, resolver UI pour le tag carte) — tolérable car la règle est simple et stable.

### Migration

Aucune migration de données. Les changements de code sont déjà en place :

- Commit `2649590` — badges cumulatifs côté UI (mapper + page qualification + 14 tests).
- Commit `dc0ab9c` — tag carte restreint à l'ombrière (dynamicTags + 7 tests).

## Liens

- Ticket initial : parcelle `40332000AD0159` (Ychoux, Landes) — deux zones `SOLAIRE_PV_RNV_SOL` + `SOLAIRE_PV_NV_TOIT`.
- Mapper UI : [apps/ui/src/features/analyser/utils/enrichissment.mapper.ts](../../apps/ui/src/features/analyser/utils/enrichissment.mapper.ts)
- Tests mapper : [apps/ui/src/features/analyser/utils/enrichissment.mapper.spec.ts](../../apps/ui/src/features/analyser/utils/enrichissment.mapper.spec.ts)
- Resolver tag carte : [apps/ui/src/features/resultats/utils/dynamicTags/config.ts](../../apps/ui/src/features/resultats/utils/dynamicTags/config.ts)
- Tests tag carte : [apps/ui/src/features/resultats/utils/dynamicTags.spec.ts](../../apps/ui/src/features/resultats/utils/dynamicTags.spec.ts)
- Enum backend (inchangé) : [packages/shared-types/src/enrichissement/enums/zone-acceleration-enr.enum.ts](../../packages/shared-types/src/enrichissement/enums/zone-acceleration-enr.enum.ts)
- Calculateur backend (inchangé) : [apps/api/src/enrichissement/services/enr/enr.calculator.ts](../../apps/api/src/enrichissement/services/enr/enr.calculator.ts)
- Matrice de scoring (inchangée) : [apps/api/src/evaluation/services/algorithme/algorithme.config.ts](../../apps/api/src/evaluation/services/algorithme/algorithme.config.ts)
- ADR lié : [0010-matrice-scoring-excel.md](0010-matrice-scoring-excel.md)
