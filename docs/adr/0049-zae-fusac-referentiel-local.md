# ADR-0049 : Zones d'activité économique (Fusac) — référentiel local filtré, test du centroïde

**Date** : 2026-10-07
**Statut** : Accepté

## Contexte

L'algorithme gagne un 32e critère en v1.18, `siteEnZae` (poids 1) : le site est-il dans une zone
d'activité économique ? En zone, l'industrie est très positive, les locaux d'activité positifs, le
résidentiel négatif, les quatre autres usages neutres. Hors zone, le critère est neutre sur les
sept usages.

La donnée vient de la base Fusac du Cerema (« fonciers à usage d'activités », licence ouverte 2.0,
millésime 2025). Constats du 2026-10-07 :

- **Pas d'API, un gros fichier.** Le téléchargement passe par un dossier Box. Le GeoPackage fait
  1,3 Go en archive 7z et 9,8 Go décompressé : il contient quatre couches, dont les terrains et
  les établissements, qui pèsent l'essentiel. Seule la couche des sites d'activité
  (`fr_fusac_cerema_site_eco_2025`, surfacique, Lambert-93) nous sert.
- **La couche n'est pas un zonage de zones d'activité.** Elle compte 451 345 sites, répartis par
  `site_type` : activité diffuse dans le tissu urbain (209 420), inconnu (172 654), **zone
  d'activité économique (45 558)**, établissement isolé (20 241), zone 2AU à vocation économique
  (3 472). La tester en entier ferait de la plupart des sites urbains des « sites en zone
  d'activité ».
- **Origine hétérogène des zones.** Parmi les 45 558 zones : 23 372 viennent d'OpenStreetMap,
  17 644 des zones d'urbanisme à vocation économique du GPU, le reste de la Région Sud, de la
  BD TOPO et des emprises commerciales. Ce n'est pas un zonage réglementaire.
- **Outre-mer inexploitable en l'état.** 11 256 sites des départements 97x (dont 431 zones) ont
  des coordonnées hors du domaine Lambert-93 malgré le SRID déclaré.

## Décision

> Nous importons dans une table PostGIS locale (`raw_zae`) les sites Fusac de type « zone
> d'activité économique », en activité, hors outre-mer, extraits à la main du GeoPackage et
> commités sous forme de GeoJSON compressé ; le critère teste le centroïde du site contre ces
> zones.

- **Filtre** : `site_type = 'zone d''activité économique'`, `site_etat = 'existant et actif'` (139
  zones « en projet » écartées) et `site_coddep NOT LIKE '97%'`. Les types « diffus », « isolé »,
  « inconnu » et « 2AU » sont exclus : une activité n'est pas une zone, et une zone à urbaniser
  n'est pas encore aménagée.
- **Centroïde** : même règle que le QPV et la saturation EnR (ADR-0039, ADR-0046). Une zone fait
  quelques hectares en moyenne (10 ha) : un grand site dont le centre est hors zone mais qui en
  recouvre une partie est classé « hors zone ». La limite est assumée et documentée.
- **Sémantique** : `true` dans une zone, `false` sinon, `undefined` (donnée indisponible, non
  comptée dans la fiabilité) si le référentiel est vide ou illisible. Un faux « Non » serait
  plausible, donc indétectable. Un site d'outre-mer (code INSEE 97x) est aussi
  `undefined`, faute de zones importées : limite à lever en reprenant les géométries 97x (cf.
  `docs/SUJETS-A-TRAITER.md`).
- **Fichier réduit commité**, comme l'ICU, le QPV et les zones EnR : `preparer-zae.ts` lance
  `ogr2ogr` (GDAL) avec le filtre, reprojette en WGS84, simplifie à 3 m, arrondit à 5 décimales et
  ne garde que l'identifiant. Le résultat, gzip, fait 4,6 Mo pour 44 991 sites (contre 9,8 Go
  bruts). La surface cumulée après simplification (441 483 ha) est à 0,01 % de la source
  (441 428 ha). L'import valide tout le fichier avant de vider la table, remplace dans une
  transaction et refuse un fichier de moins de 40 000 sites.
- **Rafraîchissement manuel annuel**, à chaque nouveau millésime Fusac (pas d'API, pas de
  planification).

## Options envisagées

### Option A — Zones d'activité seules, fichier réduit commité, centroïde (retenue)

- Avantages : le critère correspond à son libellé ; test spatial local, sans latence ni
  dépendance à un service tiers ; import rejouable sans fichier externe ; 4,6 Mo.
- Inconvénients : étape manuelle annuelle ; dépend de la qualité d'OpenStreetMap (51 % des zones) ;
  limite du centroïde ; outre-mer non couvert.

### Option B — Toute la couche des sites d'activité

- Avantages : aucun filtre à justifier, jamais de contenu écarté.
- Inconvénients : 395 000 sites en métropole, soit 26,8 Mo gzip (5,6 fois plus) ; une grande partie
  des sites urbains passerait « en zone d'activité » et le résidentiel y serait pénalisé à tort.
  Écartée.

### Option C — Zones d'activité et zones 2AU à vocation économique

- Avantages : anticipe les zones en cours d'aménagement (+3 472 sites).
- Inconvénients : une zone à urbaniser n'est pas encore une zone d'activité ; le résidentiel serait
  pénalisé sur des terrains encore libres. Écartée.

### Option D — Seuil de recouvrement (par exemple 50 % de la surface du site) au lieu du centroïde

- Avantages : traite correctement les grands sites à cheval sur une zone.
- Inconvénients : requête plus coûteuse (intersection de géométries), incohérente avec les autres
  critères spatiaux, et plus difficile à expliquer à l'utilisateur. Écartée pour cette version.

### Option E — Saisie utilisateur Oui / Non

- Avantages : aucun import.
- Inconvénients : la plupart des utilisateurs ne savent pas si un site est en zone d'activité ;
  dégrade la fiabilité et ajoute une question au parcours. Écartée.

## Conséquences

### Positives

- Un site industriel ou logistique en zone d'activité remonte, et le résidentiel y recule,
  sans effort pour l'utilisateur.
- Un import raté ne dégrade jamais les résultats en silence : validation complète, plancher de
  40 000 sites, remplacement transactionnel.

### Négatives / Risques

- **Pas un zonage réglementaire** : la mention figure dans la doc des sources. Plus de la moitié
  des zones viennent d'OpenStreetMap, dont la couverture varie selon les territoires : un site
  peut être classé « hors zone » à tort dans un territoire mal cartographié.
- **Centroïde** : les grands sites à cheval sur une zone sont classés hors zone.
- **Outre-mer** : le critère est indisponible pour les sites 97x et perd 1 point de poids en
  fiabilité.
- **Poids de l'historique** : chaque millésime ajoute environ 4,6 Mo (gzip mal compressé par git).
- **Neutre n'est pas sans effet** : hors zone (la majorité des sites), le score 0,5 s'ajoute aux
  avantages et aux contraintes et rapproche les indices de 50 %.
- **Fiabilité** : le poids total passe de 33 à 34. À données identiques, la note baisse de 0,3
  point environ pour tout site dont la ZAE reste indisponible.

### Migration

1. `pnpm db:migrate` (migration `0038_raw_zae`, jouée par le `postdeploy`).
2. Sur chaque environnement : `scalingo --app <app> --region <région> run "pnpm db:zae:import"`
   (régions : cf. `docs/ops/scalingo.md`).
3. Tant que l'import n'a pas eu lieu, le critère est indisponible pour tous les sites (erreur
   loguée une fois par processus).
4. Les évaluations déjà persistées gardent leur version : v1.17 et antérieures n'ont pas ce critère
   (`siteEnZae` ignoré, poids total 33).
5. Rafraîchissement annuel : télécharger le GeoPackage du nouveau millésime (Box du Cerema),
   `pnpm --filter api build:nest`, puis `pnpm data:zae:preparer <fichier.gpkg>` (nécessite
   `ogr2ogr`), vérifier la volumétrie affichée et committer le GeoJSON.

## Liens

- Source : https://datafoncier.cerema.fr/fusac (téléchargement :
  https://cerema.app.box.com/v/fusac-cerema-fr)
- Scripts : `apps/api/src/scripts/preparer-zae.ts`, `apps/api/src/scripts/import-zae.ts`,
  `apps/api/src/scripts/zae/zae.format.ts`
- Données : `apps/api/src/scripts/data/zae-fusac.geojson.gz`
- Repository : `apps/api/src/enrichissement/repositories/zae.repository.ts`
- Service : `apps/api/src/enrichissement/services/zae/zae-enrichissement.service.ts`
- Algorithme : `apps/api/src/evaluation/services/algorithme/versions/v1.18.ts`
- ADR liés : ADR-0039 (centroïde, référentiel local QPV), ADR-0046 (fichier commité, zones EnR),
  ADR-0026 (documentation des sources)
