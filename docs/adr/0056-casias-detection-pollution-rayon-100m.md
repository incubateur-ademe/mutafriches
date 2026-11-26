# ADR-0056 : CASIAS dans la détection de pollution, avec un rayon de 100 m

**Date** : 2026-11-25
**Statut** : Accepté

## Contexte

`siteReferencePollue` signale un site « potentiellement pollué ». Il n'est pas noté : il propose « Oui » d'office à la question « Présence de pollution » (critère `presencePollution`, poids 2) et vaut « pollution supposée » dans l'export CNIG quand l'utilisateur n'a rien saisi. Il combinait trois sources : sites pollués ADEME (500 m), SIS (1 km) et ICPE (500 m).

L'équipe produit croyait CASIAS (carte des anciens sites industriels et activités de service, BRGM) déjà branché : aucune ligne de code ne l'appelait. L'API GéoRisques l'expose sur `GET /api/v1/ssp/casias` (`latlon`, `rayon` jusqu'à 10 000 m, `page_size` jusqu'à 1 000, total dans `results`).

CASIAS n'est pas un référentiel de pollution : il recense des activités passées (garages, ateliers, dépôts, stations-service), sans diagnostic, et il est très dense en ville. Le rayon décide donc de tout. Mesure du 25 novembre 2026 sur 400 parcelles tirées au hasard parmi les 1 600 réellement analysées (hors pré-chauffe, hors démonstration), en comptant les sites CASIAS autour du centroïde :

| Rayon | Parcelles avec au moins un site CASIAS | En centre-ville | Médiane (max) | Parcelles signalées, toutes sources |
|-------|----------------------------------------|-----------------|---------------|-------------------------------------|
| sans CASIAS | — | — | — | 66 % |
| 50 m | 19 % | 19 % | 0 (7) | 71 % |
| 100 m | 35 % | 37 % | 0 (12) | 74 % |
| 250 m | 60 % | 64 % | 1 (94) | 81 % |
| 500 m | 80 % | 88 % | 3 (241) | 86 % |

Sur seize adresses typées, les six centres urbains ont de 21 à 203 sites à 500 m (Paris, Lyon, Lille, Saint-Étienne, Angers, Épinal) et tous en ont encore au moins un à 100 m ; quatre des cinq adresses périurbaines et les cinq rurales n'en ont aucun à 100 m.

### Illustration : Trélazé (49)

La base compte 101 parcelles analysées à Trélazé, dont 77 déjà signalées par ADEME, SIS ou ICPE lors de leur dernier enrichissement. Sur les 24 autres, CASIAS en ferait basculer 1 à 100 m, 9 à 250 m et 22 à 500 m : 98 % des parcelles de la commune seraient alors signalées. La commune n'a pourtant que 34 fiches CASIAS.

| Adresse | Parcelle | Sites CASIAS à 100 / 250 / 500 m | Plus proche |
|---------|----------|----------------------------------|-------------|
| 47 allée des Toises | `49353000AW0224` | 0 / 2 / 3 | 165 m |
| 17 allée de l'Authion | `49353000AT0124` | 0 / 0 / 3 | 255 m |
| rue Édouard Branly | `49353000AV1459` | 0 / 1 / 3 | 218 m |

Aucune de ces trois parcelles n'est signalée par ADEME, SIS ou ICPE : à 500 m, « Oui » serait proposé à cause d'une activité arrêtée à plusieurs centaines de mètres, sans lien avec le terrain. Deux raisons s'ajoutent :

- une seule fiche (`PAL4902790`, « rue Louis Pasteur », sans nom d'établissement, statut « Indéterminé ») touche 69 des 101 parcelles à 500 m ;
- les fiches sont localisées à la voie ou au lieu-dit (« route départementale 4 », « Île du Diable », « les Grands Carreaux »), sans numéro : leur position est déjà incertaine de plusieurs dizaines de mètres, ce qu'un rayon de 500 m amplifie au lieu de corriger.

À 100 m, le signalement garde son sens : au 10 rue de Valongo (`49353000AV1386`), la fiche « rue Louis Pasteur » est à 30 m du centroïde.

## Décision

> CASIAS devient la quatrième source de `siteReferencePollue`, avec un rayon de 100 m autour du centroïde du site : au moins un site recensé dans ce rayon signale le site.

Le rayon de l'appel est le seuil lui-même (`GEORISQUES_RAYONS_DEFAUT.CASIAS`). Le total vient du champ `results` : une page de cinq sites suffit, sans pagination ni calcul de distance.

## Options envisagées

### Option A — rayon de 100 m (retenue)

- Avantages : le signal garde un sens (« une activité industrielle ou de service a existé sur le site ou contre lui ») ; 35 % des parcelles concernées, 8 points de signalement en plus ; la moitié des sites analysés font moins de 3 000 m², soit un rayon équivalent de 31 m.
- Inconvénients : en hypercentre dense, presque toute adresse a un ancien atelier à 100 m ; sur un grand site (15 % dépassent 3 ha), un établissement éloigné du centroïde n'est pas vu.

### Option B — rayon de 500 m, comme ADEME et ICPE

- Avantages : cohérence apparente des seuils.
- Inconvénients : 80 % des parcelles concernées, 88 % en centre-ville, 86 % signalées toutes sources confondues. « Oui » serait proposé presque partout et ne distinguerait plus rien.

### Option C — CASIAS affiché à titre informatif, sans pré-sélection

- Avantages : aucune confusion entre activité passée et pollution ; l'utilisateur lit l'inventaire et tranche.
- Inconvénients : nouveau champ dans le DTO, l'UI, l'export et la doc d'intégration ; ne répond pas à l'attente d'une source déjà « branchée » sur la question pollution.

### Option D — rayon de 50 m

- Avantages : 19 % des parcelles, signal le plus net.
- Inconvénients : inférieur à la précision du géocodage CASIAS (adresses anciennes, parfois placées au centre de la rue) et au rayon de la plupart des sites de plus d'un hectare.

### Option E — rayon réglable dans le panneau de diagnostic, pour comparer en staging

- Avantages : l'équipe produit voit l'effet de 100, 250 et 500 m sur un site réel.
- Inconvénients : un site à la fois, une route et un guard de plus à maintenir puis à retirer. Prototypé puis abandonné : les mesures ci-dessus suffisent à trancher.

## Conséquences

### Positives

- CASIAS apparaît dans `sourcesUtilisees`, sur `/comprendre-les-analyses` (« Présence de pollution ») et dans la documentation des sources.
- Le seuil tient en une constante : le changer ne touche ni l'adapter ni les tests de structure.

### Négatives / Risques

- Un appel GéoRisques de plus par enrichissement (une centaine de millisecondes, en parallèle des trois autres).
- Environ 8 points de sites en plus avec « Oui » proposé d'office, et autant d'exports CNIG en « pollution supposée » quand rien n'est saisi. Le commentaire CNIG associé (`sol_pollution_commentaire`) cite désormais les quatre bases.
- 66 % des parcelles étaient déjà signalées avant CASIAS : les rayons SIS (1 km) et ICPE (500 m) mériteraient la même mesure.
- L'API v1 de GéoRisques est publique et sans jeton ; la v2 en exige un. Une fermeture de la v1 toucherait les quatorze endpoints à la fois.

### Migration

Aucune : le booléen est recalculé à chaque enrichissement, les enrichissements en cache (24 h) expirent seuls.

## Liens

- Adapter : `apps/api/src/enrichissement/adapters/georisques/casias/`
- Règle : `apps/api/src/enrichissement/services/pollution/pollution-detection.service.ts`
- Seuil : `GEORISQUES_RAYONS_DEFAUT.CASIAS` (`apps/api/src/enrichissement/adapters/georisques/georisques.constants.ts`)
- Documentation : `docs/enrichissement.md` (section 7), [API GéoRisques](https://www.georisques.gouv.fr/doc-api), [CASIAS](https://www.georisques.gouv.fr/donnees/bases-de-donnees/inventaire-historique-de-sites-industriels-et-activites-de-service)
