# ADR-0034 : Îlot de chaleur urbain en donnée informative, hors algorithme

**Date** : 2026-09-03
**Statut** : Accepté

## Contexte

L'équipe souhaite restituer, dans le parcours de qualification et dans le récapitulatif du site,
l'exposition de la friche à un **îlot de chaleur urbain** (ICU), à partir de la « Cartographie
nationale des indicateurs liés à l'îlot de chaleur urbain » publiée par le CSTB (projet SCO
Sat4BDNB, licence LOV2).

Trois caractéristiques de ce jeu de données conditionnent l'intégration :

1. **Format.** La ressource publiée est un ZIP contenant un GeoPackage en Lambert-93 (EPSG:2154),
   1 955 polygones de maille « IRIS groupés ». Illisible sans GDAL, qui n'est pas disponible au
   runtime Scalingo.
2. **Couverture partielle et non communale.** Environ 600 communes seulement, et les zones ne
   suivent pas les frontières communales. Trélazé (49353) n'est pas couverte alors qu'Angers
   (49007) l'est, sur la même agglomération.
3. **Sélection à la source.** Le jeu ne contient que des zones déjà chaudes : `iuhi` va de 4,49 à
   10,11 °C, et 1 855 zones sur 1 955 (95 %) dépassent déjà le seuil métier de 5,5 °C.

La demande métier est explicite : **information seulement, pas d'intégration à l'algorithme.**

Or le registre `CRITERES_METADATA` (shared-types), qui pilote le récapitulatif du site, est
verrouillé sur `POIDS_CRITERES` (`algorithme.config.ts`) par un garde-fou de test : toute clé
supplémentaire y casse la suite. Une donnée sans poids n'a donc structurellement pas sa place
dans ce registre — ce qui est exactement l'intention, mais impose un chemin dédié pour l'affichage.

## Décision

> Nous importons la cartographie ICU dans une table locale `raw_icu` (script `pnpm db:icu:import`)
> alimentée par un GeoJSON converti hors ligne et commité, nous rattachons le site à sa zone par
> **test spatial**, et nous exposons le résultat via un registre `INFORMATIONS_METADATA` distinct
> des critères de l'algorithme.

### Trois états, pas deux

L'enum `IlotChaleurUrbain` distingue :

| État | Signification |
|------|---------------|
| `oui` | Site dans une zone dont l'intensité atteint ou dépasse 5,5 °C |
| `non` | Site dans une zone cartographiée, sous le seuil |
| `non-couvert` | Site hors du périmètre d'étude : aucune mesure disponible |

La maquette initiale ne proposait que « Oui » / « Non ». Avec une couverture de 600 communes sur
34 900, afficher « Non » pour un site jamais mesuré laisserait croire qu'il a été évalué et
déclaré non concerné. Le troisième état rend l'absence de mesure lisible.

Le seuil de **5,5 °C** est un choix produit, pas une valeur issue de la documentation CSTB — qui
définit `iuhi` (« intensité maximale absolue de l'îlot de chaleur urbain ») sans proposer de
palier. Il est isolé dans une constante nommée (`SEUIL_ILOT_CHALEUR_C`).

### Registre informatif distinct

`INFORMATIONS_METADATA` décrit les données enrichies affichées sans peser sur le calcul : mêmes
attributs qu'un critère (libellé, section, source, ordre) **moins le poids**. `buildRecapitulatifSite`
les rend après les critères de leur section, avec un drapeau `informatif` que les vues (tableau
récapitulatif, modale, PDF) traduisent par la mention « Donnée informative, hors calcul ».

Conséquence vérifiée : la ligne ICU apparaît dans le récapitulatif du site, et **nulle part** dans
le tableau de pondération/impact ni dans celui de la fiabilité, tous deux dérivés de
`CRITERES_METADATA`.

### GeoJSON converti hors ligne et commité

La conversion suit le pattern déjà en place pour la base ITE 3000 : `ogr2ogr` en amont, fichier
versionné dans `apps/api/src/scripts/data/`, script d'import qui ne lit qu'un GeoJSON. La commande
de régénération est documentée en tête du script d'import.

Les géométries sont **simplifiées à 10 m** (`-simplify 10`), ce qui ramène le fichier de 14 Mo à
2,3 Mo. Sur des polygones de 200 ha en moyenne (8 ha au minimum), le déplacement de frontière est
sans effet pratique sur un test d'appartenance — et la donnée est de toute façon informative.

### Test spatial, jamais par code INSEE

Le rattachement passe par `ST_Intersects` sur le centroïde du site contre `geom`
(`geometry(MultiPolygon, 4326)`, index GIST). Les zones débordant des limites communales, une
jointure par code INSEE classerait à tort des sites limitrophes. `ORDER BY iuhi DESC LIMIT 1`
retient la zone la plus chaude en cas de recouvrement.

### Garde-fous d'import

- Le GeoJSON est intégralement validé **avant** le `TRUNCATE` : un fichier tronqué ou au schéma
  inattendu (moins de 1 500 zones, `code_giris` ou `iuhi` absents) échoue sans écraser la table.
- Les géométries passent par `ST_Multi(ST_MakeValid(...))`, la simplification pouvant produire
  des anneaux invalides.
- `IcuRepository` émet un `logger.error` explicite si la table est vide : sans cela, 100 % des
  sites seraient annoncés « hors périmètre d'étude » alors que l'import n'a simplement jamais
  tourné sur l'environnement.

## Options envisagées

### Option A — Référentiel local + registre informatif distinct (retenue)

- Avantages : aucune dépendance runtime ni GDAL en production ; lecture spatiale indexée
  instantanée ; le garde-fou `CRITERES_METADATA` ↔ `POIDS_CRITERES` reste intact ; la donnée
  traverse le pipeline et l'export comme les autres, sans les polluer.
- Inconvénients : un import à rejouer par environnement à chaque millésime ; 2,3 Mo de données
  versionnées ; un second registre à maintenir en parallèle des critères.

### Option B — Critère de poids 0 dans `CRITERES_METADATA`

- Avantages : un seul registre, aucun code d'affichage supplémentaire.
- Inconvénients : casse le garde-fou d'alignement avec `POIDS_CRITERES` — ou impose de l'affaiblir,
  ce qui rouvre la porte aux divergences qu'il existe précisément pour fermer. Un poids nul
  traverserait par ailleurs le calcul de fiabilité et les exports d'impact, où la donnée n'a rien
  à faire.

### Option C — Appel live à une API

- Avantages : fraîcheur automatique.
- Inconvénients : aucune API ne sert ce jeu de données ; seule la ressource ZIP existe. Sans objet.

## Conséquences

### Positives

- L'utilisateur voit une information climatique utile sans qu'elle contamine l'indice de mutabilité.
- Le pattern « donnée informative » est désormais outillé : une prochaine donnée hors algorithme
  s'ajoute par une entrée dans `INFORMATIONS_METADATA` et un résolveur.
- Les trois rendus de la documentation des sources (page UI, PDF, Markdown) gèrent désormais une
  source qui n'alimente aucun critère pondéré.

### Négatives / Risques

- Données figées entre deux imports, pour un jeu à mise à jour « irrégulière » (dernière
  publication : 09/03/2026). À rejouer à chaque millésime.
- La simplification à 10 m rend le résultat théoriquement instable pour un site situé à quelques
  mètres d'une frontière de zone. Acceptable pour une donnée informative ; à revoir si l'indicateur
  devait un jour entrer dans le calcul.
- 95 % des zones couvertes dépassent le seuil : l'état `non` restera rare. Le seuil discrimine donc
  peu à l'intérieur du périmètre — sa valeur informative tient surtout à la distinction
  couvert / non couvert.

### Migration

1. Migration `0031_raw_icu.sql` : table `raw_icu` + colonne `geom` + index GIST.
2. `pnpm db:migrate` puis `pnpm db:icu:import` en local.
3. En staging/production (cf. gotcha Scalingo, script = `node dist/...`) : après déploiement,
   `scalingo --app <app> run "pnpm db:icu:import"` une fois par environnement (hors `postdeploy`).

## Liens

- Pattern de référentiel local : [ADR-0032](0032-zonage-abc-referentiel-local.md),
  [ADR-0024](0024-lovac-referentiel-local.md)
- Source de vérité unique de la documentation des sources : [ADR-0026](0026-source-verite-unique-documentation-sources.md)
- Fichiers :
  - `apps/api/src/shared/database/schemas/raw-icu.schema.ts`
  - `apps/api/src/scripts/import-icu.ts`
  - `apps/api/src/enrichissement/repositories/icu.repository.ts`
  - `apps/api/src/enrichissement/services/climat/icu-enrichissement.service.ts`
  - `packages/shared-types/src/recapitulatif/informations.metadata.ts`
  - `apps/ui/src/features/qualification/components/IlotChaleurField.tsx`
  - `apps/api/src/donnees-externes/imports.registry.ts` (suivi import)
