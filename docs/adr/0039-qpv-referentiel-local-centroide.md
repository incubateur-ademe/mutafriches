# ADR-0039 : Quartiers prioritaires en référentiel local, rattachement par centroïde

**Date** : 2026-09-11
**Statut** : Accepté

## Contexte

L'algorithme de mutabilité gagne un 30e critère, `siteEnQpv` (poids 1) : le site est-il situé
dans un quartier prioritaire de la politique de la ville ? En QPV, la reconversion sert
directement les politiques de renouvellement urbain — très positif pour le résidentiel et les
équipements publics, très négatif pour le tertiaire, négatif pour le photovoltaïque au sol,
neutre pour la culture, l'industrie et la renaturation. Hors QPV, le critère est neutre sur les
sept usages.

La géographie de référence est celle de l'arrêté 2024, publiée par l'ANCT. Contrairement aux
sources des ADR précédentes, **le choix n'est pas entre appel live et import local : c'est un
choix entre la bonne géographie et une géographie abrogée.**

### Quatre chemins d'accès, un seul donne le millésime en vigueur

| Chemin | Géographie servie | Granularité |
|---|---|---|
| GeoJSON ANCT sur data.gouv.fr | **2024, en vigueur** | Polygonale |
| WFS Géoplateforme (`data.geopf.fr`) | 2015, **abrogée** | Polygonale |
| APICarto | — (aucun module QPV) | — |
| API tabulaire data.gouv (CSV `listeqp2024-cog2025`) | 2024 | **Commune** |

Deux de ces chemins sont des pièges qu'il faut nommer, parce qu'ils paraissent tous deux plus
simples que la solution retenue.

**Le WFS de la Géoplateforme sert la géographie de 2015.** La couche porte exactement le bon
titre (« Quartiers Prioritaires de la politique de la ville »), répond en une centaine de
millisecondes, et son caractère périmé n'est visible que dans l'`Abstract` du GetCapabilities :
`AREAMANAGEMENT.QP.VECTOR:qp_decretmodif_2015_epsg3857_wm`, « Sources : Commissariat Général à
l'Egalité des Territoires ; Édition 2016-04-12 ». `resultType=hits` renvoie 1 514 entités, soit
la liste QP 2015, contre 1 584 en 2024 ; les codes y sont de la forme `QP006005` et non
`QN00101M`. Deux détails aggravants : son `DefaultCRS` est EPSG:3857 et non 4326 comme la couche
ZAER, donc un copier-coller de `filtrePoint()` renverrait « hors QPV » pour 100 % des sites sans
erreur ; et la reprojection imposerait de promouvoir `proj4` en dépendance de production, alors
que Scalingo prune les devDependencies au déploiement.

**L'API tabulaire ne sert aucune géométrie.** Le seul chemin queryable en tabulaire est le CSV
`listeqp2024-cog2025`, indexé par commune. Or les QPV sont des périmètres infra-urbains :
1 584 quartiers sur 834 communes seulement (2,4 % des ~34 900), d'une surface médiane de 25 ha
(minimum 0,7 ha, 48 quartiers sous 5 ha). Mesure faite le 2026-09-11 en croisant les périmètres
avec les surfaces communales de `geo.api.gouv.fr` : **les QPV couvrent 3,8 % de la surface
cumulée des communes qui en comptent un** (médiane par commune 2,9 %, moins de 10 % dans 714
communes sur 833). Un critère de granularité communale répondrait donc « Oui » à tort dans
environ 96 % des cas.

## Décision

> **1.** Nous importons le GeoJSON QPV 2024 de l'ANCT dans une table PostGIS locale `raw_qpv`
> (`pnpm db:qpv:import`), et nous écartons explicitement le WFS de la Géoplateforme ainsi que
> l'API tabulaire — le premier pour cause de géographie abrogée, la seconde pour granularité
> communale.
>
> **2.** Le rattachement se fait par **test spatial du centroïde du site** contre les périmètres,
> jamais par code INSEE.
>
> **3.** Un référentiel vide renvoie la donnée **indisponible** (`undefined`), jamais « hors
> QPV ».

### Rattachement spatial par centroïde

Le prédicat est `ST_Intersects(geom, ST_SetSRID(ST_MakePoint(lon, lat), 4326))` sur
`site.coordonnees`, identique à celui de l'ICU (`icu.repository.ts`), et non sur la géométrie
complète de la parcelle comme le fait l'adapter ZAER.

**Pourquoi le centroïde plutôt que le polygone.** Les deux sont disponibles sur l'entité `Site`
(`coordonnees` et `geometrie`), et `selectionnerFeatureDominante` (`geometry.utils.ts`) saurait
arbitrer un recouvrement partiel. Le centroïde a été retenu pour trois raisons : il donne un
critère binaire **non ambigu** — un site est dedans ou dehors, sans seuil de recouvrement à
choisir et à justifier ; il évite qu'un site étendu effleurant un périmètre soit classé « en
QPV » sur quelques mètres carrés, ce qu'un `ST_Intersects` sur le polygone produirait
mécaniquement ; et il colle à la nature de la donnée — l'appartenance à un QPV est un fait
**administratif**, qui ouvre des droits (ANRU, abattement de TFPB) à l'intérieur d'un périmètre
arrêté, et non une proximité graduelle.

C'est aussi ce qui nous sépare de l'ICU, qui depuis l'ADR-0037 ne teste plus une appartenance
stricte mais un `ST_DWithin` avec tolérance de bord. Cette tolérance est justifiée là-bas : les
zones ICU sont des mailles d'étude approximatives, et être à vingt mètres d'un îlot de chaleur
revient à y être. Elle ne l'est pas ici : élargir un périmètre QPV de quelques mètres
attribuerait à un site un statut réglementaire qu'il n'a pas.

La contrepartie est assumée : un site à cheval sur une frontière de QPV est classé par son
centre de gravité, donc « Non » s'il déborde marginalement dans le quartier. C'est le point à
rouvrir en premier si le critère devait être affiné — en passant à un seuil de recouvrement
surfacique (`ST_Area(ST_Intersection(...)) / ST_Area(site)`) plutôt qu'à un `ST_Intersects` sur
le polygone, qui déplacerait simplement l'arbitraire de l'autre côté.

**Pourquoi jamais par code INSEE.** Outre les 3,8 % de recouvrement rappelés plus haut, 149 des
1 584 quartiers débordent de leur commune de rattachement et portent plusieurs codes INSEE dans
la propriété `insee_com`. La colonne `code_insee` de `raw_qpv` est conservée pour le seul débogage.

### Aucune simplification géométrique

L'ADR-0034 simplifie les géométries ICU à 10 m (`ogr2ogr -simplify 10`), en le justifiant par
la taille des zones (200 ha en moyenne) **et** par le caractère informatif de la donnée — et en
prévoyant explicitement de « revoir si l'indicateur devait un jour entrer dans le calcul ».

C'est le cas ici, et les deux prémisses tombent : les QPV font 25 ha de médiane, et le critère
est scoré. Un déplacement de frontière de 10 m peut basculer un site d'un TRES_POSITIF
résidentiel à un NEUTRE. La géométrie est donc importée non simplifiée. Le fichier reste modeste
(5,2 Mo après réduction aux trois propriétés utiles et arrondi des coordonnées à six décimales),
comparable à `base-ite-3000.geojson` (6,2 Mo) déjà versionné.

### Fichier commité plutôt que téléchargé à l'import

LOVAC (ADR-0024), zonage ABC (ADR-0032) et les réseaux de chaleur (ADR-0037) téléchargent leur
source au moment de l'import ; ICU et ITE commitent leur fichier, parce qu'ils imposaient une
conversion GDAL hors ligne. Le GeoJSON QPV est publié **directement en WGS84**, hexagone et outre-mer dans
un seul fichier : il n'a besoin d'aucune conversion, et pourrait donc suivre le premier pattern.

Il suit malgré tout le second, pour une raison unique : la ressource data.gouv est un **ZIP**, et
le projet n'embarque aucune dépendance d'archive. Télécharger à l'import imposerait d'ajouter
`fflate` ou équivalent — une dépendance de production, un `pnpm audit` et un suivi de
vulnérabilités — là où LOVAC et zonage ABC reçoivent un CSV brut directement exploitable. La
commande de régénération est documentée en tête de `import-qpv.ts`.

### Un référentiel vide ne dit pas « hors QPV »

`IcuRepository` se contente de journaliser une erreur quand sa table est vide et continue de
renvoyer « hors périmètre ». Ce comportement n'est pas transposable : l'ICU est informatif,
`siteEnQpv` est scoré. Les scripts d'import ne tournent pas dans le `postdeploy` (coûteux,
idempotents) et s'exécutent une fois par environnement via `scalingo run`. Sur un environnement
où l'import a été oublié, un « Non » généralisé serait un **résultat parfaitement plausible**,
donc indétectable à l'œil comme en supervision.

`QpvRepository.findQuartierContenant` distingue donc trois cas : un quartier trouvé, `null`
quand la recherche aboutit hors de tout périmètre **sur une table peuplée**, et `undefined`
quand la lecture échoue **ou que la table est vide**. Le service de domaine convertit `null` en
`false` et laisse `undefined` faire entrer la source dans `sourcesEchouees`.

### Booléen, sans troisième état

Le DTO expose `siteEnQpv?: boolean`, jamais `boolean | null`. Pour un booléen, `false` porte
déjà la sémantique « recherche effectuée, site non concerné » : un `null` supplémentaire serait
rendu « Non disponible » par `formatBooleen`, c'est-à-dire sur la quasi-totalité du parc. Seul
`undefined` signale l'indisponibilité.

## Conséquences

- Le poids total passe de 31 à 32 : **la fiabilité de toutes les évaluations à venir est
  recalculée sur ce dénominateur**, et un intégrateur qui construit lui-même `donneesEnrichies`
  sans ce champ verra la fiabilité de ses évaluations baisser d'environ 0,3 point avant arrondi,
  silencieusement. Bénéfriches doit être prévenu avant le déploiement.
- La ligne « Non » étant NEUTRE sur les sept usages, et un score NEUTRE alimentant les avantages
  **et** les contraintes, **les indices de tous les sites hors QPV se rapprochent de 50 %** —
  soit environ 97,6 % des communes. C'est le comportement voulu (reproduction du fichier Excel),
  à ne pas « corriger ».
- Le cache d'évaluation est filtré sur `VERSION_COURANTE` : le passage à v1.14 l'invalide de
  lui-même. Le cache d'enrichissement court sur 24 h : pendant cette fenêtre, une partie des
  sites reviendra sans le champ. Lancer `pnpm partenaires:prefetch` après le déploiement pour
  les pages partenaires.
- `POST /evaluation/comparer` rejoue des instantanés d'enrichissement : une comparaison v1.13
  contre v1.14 sur un instantané antérieur au déploiement mesurera l'absence de la donnée, pas
  l'effet de la matrice.
- Le référentiel est à réimporter à chaque nouvel arrêté modifiant la géographie prioritaire.
  L'import entre dans `imports.registry.ts`, donc dans le panneau « imports » de la page publique
  « Données utilisées ».

### Migration

1. Migration `0032_raw_qpv.sql` : table `raw_qpv` + colonne `geom` + index GIST (colonne et index
   écrits à la main, drizzle-kit ne produit pas les types PostGIS).
2. `pnpm db:migrate` puis `pnpm db:qpv:import` en local.
3. En staging/production (cf. gotcha Scalingo, script = `node dist/...`) : après déploiement,
   `scalingo --app <app> run "pnpm db:qpv:import"` une fois par environnement, hors `postdeploy`.

## Alternatives écartées

**Brancher le WFS de la Géoplateforme.** Aucun fichier à versionner, aucune commande d'import,
fraîcheur théoriquement automatique. Écarté parce que la couche est figée sur la géographie 2015
depuis son édition de 2016 : scorer un critère de poids 1 sur un zonage juridiquement abrogé
depuis le 1er janvier 2024. C'est l'alternative la plus dangereuse du lot, parce que c'est la
plus séduisante à la lecture du catalogue.

**Appeler l'API tabulaire data.gouv sur le CSV.** Écartée pour la granularité communale (96 % de
faux positifs mesurés), et doublement contraire à la jurisprudence ADR-0024 / ADR-0032 qui ont
précisément supprimé tout appel runtime à `tabular-api.data.gouv.fr` pour cause de throttling
silencieux sous charge.

**Un troisième état « commune sans QPV ».** Distinguer « commune qui ne compte aucun QPV » de
« site hors des QPV de sa commune » serait informatif pour l'utilisateur. Écarté : les deux cas
produisent le même score, et cela ajouterait un état à propager dans le DTO, l'UI, le
récapitulatif et le PDF. À reconsidérer si le besoin vient du terrain.

## Références

- Dataset ANCT : <https://www.data.gouv.fr/datasets/quartiers-prioritaires-de-la-politique-de-la-ville-qpv>
- Ressource GeoJSON (URL stable) : <https://www.data.gouv.fr/fr/datasets/r/942d4ee8-8142-4556-8ea1-335537ce1119>
- ADR-0034 (ICU) : pattern du référentiel local à test spatial, et simplification géométrique
  écartée ici.
- ADR-0037 (ICU, couverture à la commune et tolérance de bord) : tolérance spatiale écartée ici,
  le périmètre QPV étant réglementaire et non indicatif.
- ADR-0037 (réseaux de chaleur en référentiel local) : remplace la décision d'appel live de
  l'ADR-0036.
- ADR-0024 (LOVAC), ADR-0032 (zonage ABC) : jurisprudence sur `tabular-api.data.gouv.fr`.
- ADR-0036 (réseau de chaleur) : précédent de l'effet du poids total sur la fiabilité des
  intégrateurs.
- Fichiers :
  - `apps/api/src/shared/database/schemas/raw-qpv.schema.ts`
  - `apps/api/src/scripts/import-qpv.ts`
  - `apps/api/src/enrichissement/repositories/qpv.repository.ts`
  - `apps/api/src/enrichissement/services/qpv/qpv-enrichissement.service.ts`
  - `apps/api/src/evaluation/services/algorithme/versions/v1.14.ts`
  - `apps/ui/src/features/qualification/pages/QualificationRisquesPage.tsx`
