# ADR-0037 : Couverture ICU évaluée à la commune, avec tolérance de bord de 150 m

**Date** : 2026-09-16
**Statut** : Accepté
**Amende** : [ADR-0034](0034-ilot-chaleur-urbain-donnee-informative.md)

## Contexte

Depuis la mise en service de l'enrichissement ICU ([ADR-0034](0034-ilot-chaleur-urbain-donnee-informative.md)),
un site situé dans une commune pourtant étudiée affiche « Non couvert par la cartographie » dès
qu'il sort d'une zone `raw_icu`. Le cas a été constaté à Angers, commune du périmètre CSTB.

L'analyse du référentiel importé donne la cause :

1. **Les zones ne couvrent pas la commune entière.** Angers (49007) compte 9 zones
   (`4900701`…`4900711`, avec deux identifiants absents) pour environ **24,5 km² sur les 42,7 km²**
   du territoire communal. Le CSTB cartographie l'enveloppe urbaine dense, pas le territoire
   administratif : l'ouest de la commune (Belle-Beille, lac de Maine) et les franges nord-est et
   sud n'ont aucune zone.
2. **Le code assimilait « hors polygone » à « hors périmètre d'étude ».** `findZoneContenant`
   renvoyait `null` pour les deux situations, que le service traduisait uniformément en
   `NON_COUVERT`.
3. **L'état `non` était donc quasi inatteignable.** 1 855 zones sur 1 955 dépassent déjà le seuil
   de 5,5 °C : en pratique l'utilisateur ne voyait que `oui` (dans une zone) ou `non-couvert`
   (partout ailleurs), y compris en plein périmètre d'étude.

S'ajoute une imprécision de bord : les polygones sources ont un **segment médian de 114 m** et leurs
limites suivent des mailles IRIS groupées, pas le phénomène thermique. La simplification d'import
n'est pas en cause — vérification faite, `ogr2ogr -simplify 10` s'applique bien en mètres dans le
SRS source avant reprojection, conformément à ce que décrit l'ADR-0034.

## Décision

> La couverture du périmètre d'étude s'évalue **au niveau de la commune** (préfixe INSEE du
> `code_giris`), et non plus par l'appartenance à une zone. Un site sans zone à proximité dans une
> commune étudiée est déclaré **non concerné** (`non`), pas « non couvert ». Par ailleurs, le
> rattachement à une zone accepte une **tolérance de bord de 150 m**.

Arbre de décision de `IcuEnrichissementService.enrichir()` :

| Situation | État |
|-----------|------|
| Zone à moins de 150 m, `iuhi >= 5,5 °C` | `oui` |
| Zone à moins de 150 m, `iuhi < 5,5 °C` | `non` |
| Aucune zone proche, commune présente dans `raw_icu` | `non` |
| Aucune zone proche, commune absente de `raw_icu` | `non-couvert` |
| Lecture du référentiel en échec | source échouée, champ manquant |

La sémantique des trois états de `IlotChaleurUrbain` évolue en conséquence : `non-couvert` ne
qualifie plus le **site** hors zone mais la **commune** hors périmètre d'étude. Les libellés
suivent : « Non — aucun îlot de chaleur identifié » et « Commune non couverte par la cartographie ».

### Ce que cela ne remet pas en cause

L'ADR-0034 écarte la jointure par code INSEE pour **rattacher** un site à une zone, les zones
débordant des limites communales. Cette règle tient : le rattachement reste strictement spatial, et
la tolérance de 150 m peut retenir une zone d'une commune voisine. Le code INSEE ne sert qu'à
répondre à une question différente — « cette commune fait-elle partie de l'étude ? » — à laquelle le
test spatial ne sait pas répondre.

La donnée reste informative, hors algorithme et hors fiabilité.

### Tolérance de 150 m

Ordre de grandeur du segment médian des polygones (114 m). Elle absorbe les slivers entre zones
adjacentes et les sites en limite de zone, sans étendre artificiellement les îlots. La zone retenue
est la plus proche (`ST_Distance` géodésique croissante), départagée par `iuhi` décroissant en cas
d'égalité — ce qui préserve le comportement antérieur pour un point à l'intérieur de deux zones.

## Options envisagées

### Option A — Couverture à la commune, état `non` par défaut dans le périmètre (retenue)

- Avantages : répond à la question que l'utilisateur se pose (« mon site est-il dans un îlot de
  chaleur ? ») ; conserve trois états ; réserve `non-couvert` à un cas qui correspond enfin à son
  libellé. L'inférence est raisonnable : le CSTB cartographie précisément les secteurs où le
  phénomène existe, les secteurs non retenus sont les moins denses et les plus végétalisés.
- Inconvénients : `non` couvre deux réalités différentes (mesuré sous le seuil, ou non mesuré dans
  une commune étudiée) ; c'est une inférence produit, pas une mesure CSTB.

### Option B — Quatrième état « hors zone cartographiée »

- Avantages : strictement fidèle à la donnée ; conserve la distinction mesuré / non mesuré que
  l'ADR-0034 défendait.
- Inconvénients : quatre badges pour une donnée informative ; l'utilisateur en périphérie d'une
  commune étudiée garde un « je ne sais pas » déguisé, sans pouvoir en faire quoi que ce soit.

### Option C — Tolérance de bord seule, sans test de couverture communale

- Avantages : correctif minimal, aucune évolution sémantique.
- Inconvénients : ne corrige rien pour un site à plus de 150 m d'une zone, c'est-à-dire le cas
  signalé. Les 43 % du territoire d'Angers sans zone continueraient d'afficher « non couvert ».

## Conséquences

### Positives

- Un site dans une commune étudiée obtient toujours une réponse exploitable.
- « Commune non couverte par la cartographie » ne s'affiche plus que pour les ~34 300 communes
  réellement hors étude.
- Les sites en limite de zone ne dépendent plus de la précision d'un contour IRIS simplifié.

### Négatives / Risques

- L'état `non` agrège « mesuré sous le seuil » et « commune étudiée, pas de zone ici ». La nuance
  est portée par l'infobulle du champ, pas par le badge.
- La tolérance de 150 m peut déclarer `oui` un site situé jusqu'à 150 m d'un îlot. Assumé pour une
  donnée informative, dont les contours sources sont administratifs.
- `ST_DWithin` sur `geom::geography` n'utilise pas l'index GIST, posé sur `geom` : mesuré à 114 ms
  de scan séquentiel quand aucune zone n'est proche, soit précisément le cas devenu courant. La
  requête filtre donc d'abord sur une emprise indexée en degrés (0,003°, sur-ensemble strict de la
  tolérance) avant la distance géodésique exacte — 2,4 ms mesurés.

### Migration

Aucune : ni schéma, ni réimport, ni changement de contrat d'API. Les évaluations en cache de moins
de 24 h conservent l'ancien état jusqu'à expiration.

## Liens

- ADR amendé : [ADR-0034](0034-ilot-chaleur-urbain-donnee-informative.md)
- Source de vérité unique de la documentation des sources : [ADR-0026](0026-source-verite-unique-documentation-sources.md)
- Fichiers :
  - `apps/api/src/enrichissement/repositories/icu.repository.ts`
  - `apps/api/src/enrichissement/services/climat/icu-enrichissement.service.ts`
  - `packages/shared-types/src/enrichissement/enums/ilot-chaleur-urbain.enum.ts`
  - `packages/shared-types/src/recapitulatif/valeurs.labels.ts`
  - `packages/shared-types/src/documentation/sources-donnees.data.ts`
  - `apps/ui/src/features/qualification/components/IlotChaleurField.tsx`
  - `apps/ui/src/features/qualification/pages/QualificationSitePage.tsx`
