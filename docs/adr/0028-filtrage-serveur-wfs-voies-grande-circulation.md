# ADR-0028 : Filtrage côté serveur des voies de grande circulation (WFS IGN)

**Date** : 2026-07-09
**Statut** : Accepté

## Contexte

Le critère `distanceAutoroute` mesure la distance à la voie de grande circulation la plus proche, via le WFS IGN geopf (couche `BDTOPO_V3:troncon_de_route`).

L'adaptateur interrogeait le WFS sur une **BBOX de 15 km sans filtre ni tri**, puis filtrait côté client par nature/importance et calculait la distance minimale. Or **geopf plafonne les réponses à 5000 tronçons**, tous types de routes confondus. Sur une BBOX de 15 km en zone dense, le service renvoyait donc un sous-ensemble **tronqué** de 5000 tronçons, qui **n'incluait pas nécessairement l'autoroute la plus proche**.

Cas réel constaté (parcelle `38468000AE0898`, Salaise-sur-Sanne, à ~115 m d'un grand axe et ~26 m de l'A7) : l'enrichissement renvoyait **3825 m** au lieu de la centaine de mètres réelle. Augmenter `COUNT` ne change rien (le plafond de 5000 est imposé par le serveur). Ce bug rendait `distanceAutoroute` non fiable pour une grande partie des sites, indépendamment de la correction d'unité (ADR-0027).

## Décision

> Nous filtrons **côté serveur** via `CQL_FILTER`, en combinant un prédicat spatial `DWITHIN` (rayon en mètres) et un filtre attributaire sur la nature/importance des tronçons. Le WFS ne renvoie ainsi que les grands axes proches (quelques milliers au plus, sous le plafond de 5000), sans troncature.

Filtre appliqué (axes `lat lon` pour EPSG:4326) :

```
DWITHIN(geometrie, POINT(<lat> <lon>), <rayonMetres>, meters)
AND (nature IN ('Type autoroutier','Route à 2 chaussées','Bretelle') OR importance IN ('1','2'))
```

Le calcul de distance point-à-segment reste côté client (le WFS ne renvoie pas la distance), désormais appliqué à un jeu **complet** de tronçons pertinents.

## Options envisagées

### Option A — Filtrage serveur `DWITHIN` + nature/importance (retenue)

- Avantages : ne renvoie que les grands axes du rayon (~2000 vs 5000+ tronqués sur l'exemple), donc sous le plafond → résultat exact ; une seule requête ; réduit le volume transféré.
- Inconvénients : dépend du support CQL de geopf et de l'ordre des axes (`POINT(lat lon)`) ; le nom de colonne géométrie (`geometrie`) est spécifique à la couche.

### Option B — Recherche par rayons croissants (BBOX 2 km, puis 5 km, 15 km)

- Avantages : pas de dépendance à CQL ; petit rayon = peu de tronçons, pas de troncature pour les sites proches.
- Inconvénients : plusieurs requêtes ; en cœur urbain très dense, même un petit rayon peut dépasser 5000 tronçons (tous types) et re-tronquer ; logique plus complexe.

### Option C — Augmenter `COUNT` / paginer

- Avantages : changement minimal.
- Inconvénients : **inopérant** — geopf plafonne à 5000 quel que soit `COUNT` ; la pagination (`STARTINDEX`) multiplierait les requêtes sans garantie d'ordre par distance.

## Conséquences

### Positives

- `distanceAutoroute` redevient fiable (fin de la surestimation par troncature).
- Combiné à ADR-0027 (unité m→km), le scoring Industrie/Photovoltaïque reflète enfin la proximité réelle des grands axes.
- Requêtes WFS plus légères (seulement les grands axes).

### Négatives / Risques

- Couplage au dialecte CQL de geopf (nom de colonne `geometrie`, ordre des axes `lat lon`, valeurs de `nature` accentuées). Un spec dédié (`ign-wfs.service.spec.ts`) verrouille la forme de la requête.
- En zone extrêmement dense, le nombre de grands axes dans 15 km pourrait s'approcher du plafond ; le rayon reste réglable (`RAYON_RECHERCHE_AUTOROUTE_M`) si nécessaire.

### Migration

- `ign-wfs.service.ts` : remplacement du paramètre `BBOX` par `CQL_FILTER` (`DWITHIN` + nature/importance).
- Ajout de `ign-wfs.service.spec.ts` (forme de la requête + calcul de distance + cas vide).

## Liens

- `apps/api/src/enrichissement/adapters/ign-wfs/ign-wfs.service.ts`
- `apps/api/src/enrichissement/adapters/ign-wfs/ign-wfs.service.spec.ts`
- `docs/enrichissement.md` (section 3.2 Distance autoroute)
- ADR lié : ADR-0027 (unité des distances mètres → km)
