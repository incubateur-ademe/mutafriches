# ADR-0029 : Résolution des IDU cadastraux à partir de coordonnées / numéros de parcelle pour l'onboarding partenaire

**Date** : 2026-07-15
**Statut** : Accepté

## Contexte

Les pages partenaires multisites (cf. ADR-0015, ADR-0021) reposent sur des **IDU cadastraux
réels à 14 caractères** (`apps/ui/.../partners/<slug>/parcelles.ts` et
`apps/api/src/scripts/partenaires/<slug>.ts`). Or les inventaires fournis par les partenaires
ne contiennent pas toujours l'IDU. C'est le cas du fichier du **SCET** (inventaire des friches
de la CC du Pays de Montereau, 77) : il fournit un code INSEE, un champ « numéro de parcelle »
compact et libre (ex. `AB160/161/163`, `AC578/ZB580`) et des **coordonnées en Lambert-93
(EPSG:2154)**, mais aucun IDU.

Reconstruire l'IDU « à la main » est risqué : le préfixe COM_ABS (`000` dans le cas courant)
n'est pas déductible du fichier source, le champ numéro mélange parfois plusieurs sections, et
la section doit être paddée à deux caractères. Il fallait un moyen **fiable et reproductible**
de résoudre les IDU pour onboarder un partenaire sans IDU, sans saisie manuelle des dizaines de
parcelles.

## Décision

> Nous ajoutons un moteur réutilisable de résolution d'IDU (`apps/api/src/scripts/coord-to-idu/`)
> qui combine deux voies via l'**API Carto Cadastre (IGN)** : résolution par attributs
> (`code_insee` + section + numéro), qui renvoie l'IDU réel (COM_ABS inclus), et
> contre-vérification par coordonnées (reprojection Lambert-93 → WGS84 puis requête `geom`).

Le moteur est piloté par un script d'onboarding (`resolve-idu-scet.ts`) qui lit un inventaire
anonymisé, résout tous les IDU, produit un rapport d'audit (`data/<slug>.resolved.json`) et
**génère directement** les fichiers de données UI et backend. La logique pure (décomposition du
champ numéro, construction d'un IDU candidat) vit dans `packages/shared-types`
(`parseNumParcelle`, `buildIduCandidate`) et est partagée avec une page de test UI
(`/test/coord-idu`). La reprojection Lambert-93 s'appuie sur **`proj4`** ajouté en
**devDependency** de l'API (usage script/data-prep uniquement, hors runtime de production).

## Options envisagées

### Option A — Résolution par API cadastre (attributs + contre-check coordonnées) (retenue)

- Avantages : l'IDU réel est **renvoyé par l'API** (pas de COM_ABS deviné) ; la double voie
  (attributs pour l'exhaustivité, coordonnées pour la validation) détecte les erreurs de parsing
  ou de commune ; entièrement reproductible et auditable ; réutilisable pour les prochains
  partenaires sans IDU.
- Inconvénients : dépend de la disponibilité d'apicarto au moment de la génération ; ajoute
  `proj4` en devDependency.

### Option B — Reconstruction locale de l'IDU sans appel API

- Avantages : aucune dépendance réseau ni `proj4`.
- Inconvénients : le préfixe COM_ABS n'est pas déductible ; aucune garantie que l'IDU existe
  réellement ; casse silencieusement sur les cas multi-sections. Non fiable.

### Option C — Saisie manuelle des IDU

- Avantages : aucun code.
- Inconvénients : coûteux et source d'erreurs (97 parcelles pour le seul SCET) ; non
  reproductible ; ne passe pas à l'échelle sur les prochains partenaires.

## Conséquences

### Positives

- Onboarding d'un partenaire sans IDU réduit à l'exécution d'un script, avec rapport de
  contrôle (statuts OK / PARTIEL / MISMATCH / ECHEC).
- Les 33 sites SCET (97 parcelles) ont été résolus et validés à 100 % (contre-check coordonnées
  concordant), avec des noms de communes officiels (accentués) issus de l'API.
- Logique testée et mutualisée (`shared-types`) entre le script batch et la page de test UI.

### Négatives / Risques

- Nouvelle devDependency `proj4` (auditée : aucune vulnérabilité). Non embarquée dans le bundle
  de production (UI et runtime API inchangés).
- La génération est ponctuelle et nécessite le réseau vers apicarto ; en cas d'IDU non résolu,
  le site est exclu et signalé dans le rapport (à traiter manuellement).

### Migration (si applicable)

Pour un futur partenaire sans IDU : anonymiser l'inventaire en JSON (sans données nominatives),
adapter les chemins d'entrée/sortie du script, exécuter, vérifier le rapport, puis suivre la
procédure `docs/ajout-partenaire.md`.

## Liens

- Moteur : `apps/api/src/scripts/coord-to-idu/`
- Script d'onboarding : `apps/api/src/scripts/resolve-idu-scet.ts`
- Logique partagée : `packages/shared-types/src/shared/utils/cadastre-ref.utils.ts`
- Page de test : `apps/ui/src/features/tests/test-coord-idu/pages/CoordIduPage.tsx`
- Procédure : `docs/ajout-partenaire.md`
- ADR socle partenaires : `docs/adr/0015-pages-partenaires-multisites-mutualisees.md`,
  `docs/adr/0021-persistance-base-partenaires-sites.md`
