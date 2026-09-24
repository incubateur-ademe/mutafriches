# ADR-0047 : Distance par la route jusqu'à l'accès autoroutier

**Date** : 2026-09-24
**Statut** : Accepté — remplace la méthode de calcul décrite dans l'ADR-0028 (le filtrage serveur `DWITHIN` est conservé)

## Contexte

Le critère `distanceAutoroute` (poids 0,5, seuils 1 / 2 / 5 km) valorise la desserte routière, surtout pour l'industrie et la logistique. Il mesurait jusqu'ici la distance **à vol d'oiseau** entre le centroïde du site et le **tronçon** le plus proche parmi `nature IN ('Type autoroutier','Route à 2 chaussées','Bretelle') OR importance IN ('1','2')`.

La note de comparaison Sitésol avec Cartofriches (juillet 2026) relève des écarts systématiques. Sur Trélazé, Champigneulles et Cavigny, Mutafriches affichait 57 m, 123 m et 2,2 km, contre 4, 22 et 58 km côté Cartofriches. Un écart de ce facteur (× 26 à × 180) ne vient pas du vol d'oiseau, qui ne sous-estime une distance routière que de 20 à 50 %. Il vient surtout du filtre :

- `Route à 2 chaussées` inclut tout boulevard urbain à terre-plein central, `importance 1-2` la plupart des nationales et grandes départementales : le « grand axe » trouvé était souvent une simple route ;
- mesurer jusqu'au tracé ignore qu'une autoroute ne s'emprunte qu'à ses échangeurs ;
- la distance à vol d'oiseau ignore les coupures (voie ferrée, cours d'eau, l'autoroute elle-même).

Les valeurs Cartofriches ne sont pas une référence : l'A31 dessert Champigneulles par un échangeur sur la commune, loin des 22 km annoncés. Leur méthode n'est pas documentée.

## Décision

> `distanceAutoroute` est la **distance par la route** (plus court chemin en voiture) entre le centroïde du site et l'**entrée d'autoroute ou de voie express** la plus proche.

1. **Réseau retenu** : tronçons BD TOPO de nature `Type autoroutier` (autoroutes et voies express à caractéristiques autoroutières) et leurs `Bretelle`, lus sur le WFS Géoplateforme avec le filtre serveur de l'ADR-0028.
2. **Entrées** (`AccesAutoroutierCalculator`), déduites de la topologie orientée par `sens_de_circulation` :
   - tête de chaque bretelle d'insertion, remontée le long de la chaîne de bretelles jusqu'au nœud où elle quitte le réseau local ;
   - origine d'une chaussée autoroutière sans amont connu (autoroute débutant sur un giratoire).
3. **Rayons croissants** 5 / 15 / 50 km : en zone dense, un rayon large renvoie près de 5 000 tronçons en 30 s ; le premier rayon suffit presque partout.
4. **Itinéraire** : service de calcul d'itinéraire Géoplateforme (`/navigation/itineraire`, ressource `bdtopo-osrm`, `optimization=shortest`, sans clé). Les entrées sont interrogées de la plus proche à vol d'oiseau à la plus lointaine, en s'arrêtant dès que le vol d'oiseau dépasse la meilleure route trouvée (une route n'est jamais plus courte que le vol d'oiseau). Au plus 4 appels, en série. Si la meilleure route dépasse le rayon courant, le rayon suivant est exploré.
5. **Absence d'accès** dans 50 km : `null` (recherche aboutie sans résultat), ramené à la tranche « au-delà de 5 km » à la frontière de l'algorithme (`DISTANCE_ACCES_AUTOROUTIER_HORS_RAYON_M`), comme le raccordement électrique.
6. **Repli** : si aucun itinéraire n'aboutit, la distance à vol d'oiseau jusqu'à l'entrée la plus proche est conservée et la source `IGN Itinéraire` est déclarée en échec.

La matrice, les poids et les seuils sont inchangés : pas de nouvelle version d'algorithme. Seule la donnée qui alimente le critère change.

## Options envisagées

### Option A — Restreindre le filtre, rester à vol d'oiseau

- Avantages : une seule requête, aucune nouvelle dépendance.
- Inconvénients : corrige le mauvais axe, mais pas l'accessibilité réelle (autoroute longée sans échangeur, coupures).

### Option B — Entrées BD TOPO + itinéraire IGN (retenue)

- Avantages : mesure ce que le critère prétend mesurer ; service public, gratuit, sans clé, même graphe BD TOPO que le WFS ; peu d'appels grâce à l'élagage par vol d'oiseau.
- Inconvénients : nouvelle API externe ; plafond d'environ 10 requêtes/s par IP (429 au-delà) ; latence supplémentaire (1 à 8 s selon la densité).

### Option C — Moteur de routage auto-hébergé (OSRM sur extrait OSM)

- Avantages : pas de quota, matrice un-vers-plusieurs en un appel.
- Inconvénients : infrastructure à héberger et mettre à jour sur Scalingo, disproportionnée pour un critère de poids 0,5.

## Conséquences

### Positives

- Valeurs cohérentes avec le terrain sur les sites de la note : Champigneulles ~1,7 km (A31), Trélazé ~2,5 km (A87), Cavigny ~2,9 km (N174 en voie express).
- Fin des sous-estimations qui plaçaient à tort des sites dans la tranche « < 1 km » (Industrie très positif, photovoltaïque négatif).
- Les territoires sans autoroute ni voie express (Corse, Guyane) obtiennent `null`, scoré « au-delà de 5 km », au lieu d'une distance à une route quelconque.

### Négatives / Risques

- Quota du service d'itinéraire : une relance après `Retry-After` (plafonnée à 2 s), puis repli à vol d'oiseau. La pré-chauffe partenaire (4 sites en parallèle) reste sous le plafond grâce aux appels en série et à l'élagage.
- Définition plus stricte que « voie à grande circulation » au sens du Code de la route : les 2×2 voies classées `Route à 2 chaussées` ne comptent plus.
- Les scores Industrie et photovoltaïque bougent pour les sites proches d'un grand axe non autoroutier. Les évaluations en cache (24 h) gardent l'ancienne valeur jusqu'à expiration.

### Migration

- `ign-wfs.service.ts` : `getTronconsAutoroutiers` remplace `getDistanceVoieGrandeCirculation` ; timeout de 30 s ajouté.
- Nouvel adapter `adapters/ign-itineraire/`, nouveau service `services/transport/acces-autoroutier.service.ts` et calculateur `acces-autoroutier.calculator.ts`.
- `distanceAutoroute` devient `number | null` (DTO de sortie, `Site`, types partagés).

## Liens

- `apps/api/src/enrichissement/services/transport/acces-autoroutier.service.ts`
- `apps/api/src/enrichissement/services/transport/acces-autoroutier.calculator.ts`
- `apps/api/src/enrichissement/adapters/ign-itineraire/ign-itineraire.service.ts`
- `apps/api/src/enrichissement/adapters/ign-wfs/ign-wfs.service.ts`
- `apps/api/src/evaluation/services/calcul.service.ts` (`extraireCriteres`)
- Service d'itinéraire : https://geoservices.ign.fr/documentation/services/services-geoplateforme/itineraire
- ADR liés : ADR-0027 (unité mètres → km), ADR-0028 (filtrage serveur WFS)
