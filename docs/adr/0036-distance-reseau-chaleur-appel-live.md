# ADR-0036 : Distance au réseau de chaleur en appel live, et absence de réseau scorée comme éloignement

**Date** : 2026-09-10
**Statut** : Accepté

## Contexte

L'algorithme de mutabilité gagne un 29e critère, `distanceReseauChaleur` (poids 1) : la distance
entre le site et le réseau de chaleur urbain le plus proche, classée sur un seuil unique de 500 m.
Sous ce seuil, la possibilité de raccordement valorise fortement les usages résidentiel,
équipements et culture, positivement le tertiaire, et reste neutre pour les trois autres.

La source est **France Chaleur Urbaine**, service du ministère de la Transition écologique. Deux
endpoints publics permettent d'obtenir la donnée, et ils appellent des architectures opposées :

| Endpoint | Ce qu'il renvoie | Intégration correspondante |
|---|---|---|
| `GET /v1/eligibility?lat=&lon=` | La distance au réseau le plus proche pour un point | Appel live par enrichissement |
| `GET /v1/networks` | Les tracés GeoJSON de tous les réseaux (~63 Mo) | Import dans une table PostGIS locale |

Deux décisions structurantes en découlent.

### 1. Une jurisprudence contraire aux appels live

Les ADR-0024 (LOVAC) et ADR-0032 (zonage ABC) ont tous deux remplacé un appel live par un
référentiel local. Suivre cette jurisprudence sans l'examiner conduirait mécaniquement à importer
`/v1/networks`.

Mais leur motif est précis : le throttling silencieux de `tabular-api.data.gouv.fr` sous charge,
qui renvoyait des réponses vides sans erreur. Il vise **cette plateforme**, pas les appels live en
général. France Chaleur Urbaine est un service autonome, hébergé indépendamment, dont
`/v1/eligibility` est le chemin critique de son propre front — le test d'éligibilité par adresse
est sa fonction principale.

Mesures réalisées le 2026-09-10 : réponse en ~50 ms, aucun en-tête de quota, 15 requêtes
consécutives sans dégradation ni 429, aucune authentification requise (le jeton Bearer ne couvre
que l'API partenaire `/v2/demands`), licence Ouverte 2.0.

Le vrai risque n'est donc pas le throttling, mais la **disponibilité** : le cache d'enrichissement
en mode strict (`EnrichissementRepository.findValidCache`) exige `sourcesEchouees` vide. Une panne
France Chaleur Urbaine rendrait donc non réutilisables tous les enrichissements réalisés pendant
la panne, dégradant la latence et la charge des autres sources pour l'ensemble de l'application.

### 2. Une distance nulle qui recouvre deux situations

L'API renvoie `distance: null` dans deux cas sémantiquement opposés :

- **aucun réseau connu à proximité** (tous les champs à `null`) ;
- **un réseau connu dont France Chaleur Urbaine n'a pas le tracé** (`id`, `name` et `gestionnaire`
  renseignés, mais pas de géométrie pour calculer une distance). C'est le cas de la parcelle
  49353000AV1652 à Trélazé, qui renvoie le réseau « LES PLAINES - TRELAZE » sans distance.

Or dans l'algorithme, un critère `null` est **ignoré** au scoring tout en comptant comme renseigné
pour la fiabilité. Et la tranche « >= 500 m » n'est pas arithmétiquement neutre : un score NEUTRE
ajoute son poids aux avantages **et** aux contraintes, ce qui tire l'indice vers 50 %. Laisser
`null` être ignoré ferait donc diverger l'indice d'un site sans réseau connu de celui d'un site
simplement éloigné, avec une discontinuité fixée par le rayon de recherche interne de France
Chaleur Urbaine — non documenté et susceptible de changer sans préavis.

## Décision

> **1.** Nous interrogeons `GET /v1/eligibility` en **appel live** à chaque enrichissement, avec un
> timeout de **3 secondes** au lieu des 10 s par défaut, et nous écartons explicitement la
> jurisprudence ADR-0024 / ADR-0032, dont le motif ne s'applique pas à cette source.
>
> **2.** Une distance indisponible reste `null` dans le DTO — donc comptée comme renseignée pour la
> fiabilité — et est **ramenée à la tranche « >= 500 m »** dans `CalculService.extraireCriteres`,
> à la même frontière que la conversion mètres → kilomètres des autres distances.
>
> **3.** Une distance indisponible est un **succès d'enrichissement**, jamais une source échouée.

### Conséquences du timeout court

Les domaines d'enrichissement sont orchestrés en série (`await` chaînés). Un 11e appel s'ajoute
donc intégralement au chemin critique. Avec un timeout de 10 s, une indisponibilité de France
Chaleur Urbaine ajouterait 10 s au P99 du parcours utilisateur pour un critère de poids 1 sur 31 :
disproportionné. Le timeout de 3 s est le compromis retenu, sans changer le pattern
d'orchestration — le passage à `Promise.allSettled` entre domaines serait un changement de fond,
qui mériterait son propre ADR.

### Conséquences de la source échouée assumée

Nous conservons le comportement honnête : si l'appel échoue réellement (réseau, timeout, 5xx), la
source entre dans `sourcesEchouees` et l'enrichissement n'est pas mis en cache strict. L'alternative
— exclure France Chaleur Urbaine du critère de fraîcheur du cache — masquerait la panne et créerait
dans `findValidCache` une exception que personne ne retrouverait dans six mois.

En revanche, `distance: null` ne doit **jamais** y entrer : les réseaux de chaleur sont
essentiellement urbains, et la majorité des friches sont hors de leur portée. Traiter ce cas en
échec priverait durablement de cache la plus grande partie des sites.

## Alternatives écartées

**Importer `/v1/networks` dans une table PostGIS locale.** Aligné sur la jurisprudence, et
insensible à une panne de France Chaleur Urbaine. Écarté pour trois raisons : le motif de cette
jurisprudence ne s'applique pas ici ; le périmètre triple (schéma Drizzle, migration, script
d'import, GeoJSON de 63 Mo commité, registre d'imports, commandes, README) ; et la donnée
vieillirait entre deux imports manuels, alors que les réseaux de chaleur évoluent en continu, y
compris les réseaux en construction que l'API signale déjà.

**Fabriquer une distance sentinelle dans l'enrichissement** (à la manière de
`ENEDIS_SEUILS.DISTANCE_DEFAUT = 999000`). Rejeté : le DTO est un contrat public, exposé aux
intégrateurs et affiché à l'utilisateur. Y écrire une distance que l'API n'a pas fournie ferait
afficher « 999 km » sur un site sans réseau connu. Le repli appartient à l'algorithme, pas à la
donnée.

**Distinguer « réseau connu sans tracé » de « aucun réseau ».** Sémantiquement plus juste, mais cela
ajoute un troisième état à propager dans le DTO, l'UI, le récapitulatif et le PDF, pour un critère
binaire dont les deux cas produisent le même score. À reconsidérer si France Chaleur Urbaine
documente un jour la proportion de réseaux sans tracé.

## Conséquences

- Le poids total passe de 30 à 31 : **la fiabilité de toutes les évaluations à venir est recalculée
  sur ce dénominateur**, et un intégrateur qui construit lui-même `donneesEnrichies` sans ce champ
  verra la fiabilité de ses évaluations baisser d'environ 0,3 point avant arrondi, silencieusement.
  Bénéfriches doit être prévenu avant le déploiement.
- La ligne « >= 500 m » étant NEUTRE sur les sept usages, **les indices de tous les sites éloignés
  d'un réseau se rapprochent de 50 %** — y compris ceux que le critère ne « concerne » pas.
- `POST /evaluation/comparer` rejoue des instantanés d'enrichissement : une comparaison v1.12 contre
  v1.13 sur un instantané antérieur au déploiement mesurera l'absence de la donnée, pas l'effet de
  la matrice.
- Le cache d'évaluation est filtré sur `VERSION_COURANTE` : le passage à v1.13 l'invalide de
  lui-même. Le cache d'enrichissement, lui, court sur 24 h : pendant cette fenêtre, une partie des
  sites reviendra sans le champ. Lancer `pnpm partenaires:prefetch` après le déploiement pour les
  pages partenaires.
- L'API rejoint `API_MONITORING_ENTRIES`, donc la page publique « Données utilisées » et le
  health-check quotidien.

## Références

- API France Chaleur Urbaine : <https://www.data.gouv.fr/dataservices/api-france-chaleur-urbaine>
- Schéma OpenAPI : <https://france-chaleur-urbaine.beta.gouv.fr/openapi-schema.yaml> — attention, il
  déclare `distance`, `id`, `name` et `gestionnaire` non nullables, ce qui est faux ; ne pas
  régénérer les types depuis ce schéma.
- ADR-0024 (LOVAC en référentiel local), ADR-0032 (zonage ABC en référentiel local) : la
  jurisprudence écartée ici.
- ADR-0027 : convention d'unité des distances — `distanceReseauChaleur` reste en mètres de bout en
  bout, comme `distanceTransportCommun`.
- ADR-0034 : précédent d'une donnée à trois états (ICU), écarté ici pour un critère binaire.
