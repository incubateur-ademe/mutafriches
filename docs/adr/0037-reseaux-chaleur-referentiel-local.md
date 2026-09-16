# ADR-0037 : Réseaux de chaleur en référentiel local, distance calculée en PostGIS

**Date** : 2026-09-16
**Statut** : Accepté
**Remplace** : la décision n°1 de l'[ADR-0036](./0036-distance-reseau-chaleur-appel-live.md) (appel live)

## Contexte

L'ADR-0036 a retenu l'appel live à `GET /v1/eligibility` de France Chaleur Urbaine pour alimenter
le critère `distanceReseauChaleur`, et a explicitement écarté l'import du tracé publié par
`GET /v1/networks`. Son argument central :

> « FCU est un service beta.gouv autonome dont cet endpoint est le chemin critique de production. »

Un signalement terrain a invalidé cet argument.

### Le signalement

La parcelle **49020000AK0118** (Beaucouzé, 49) est visuellement sur le tracé du réseau de chaleur
de Belle Beille. Mutafriches affichait **764 m**.

### Ce que mesure réellement l'API

En interrogeant `/v1/eligibility` sur six points pris **pile sur le tracé publié** de ce réseau —
qui devraient tous renvoyer 0 :

```
47.47576,-0.61172  ->  752 m   id=4910C
47.47012,-0.59387  ->  276 m   id=4910C
47.47043,-0.58506  ->  147 m   id=4910C
47.47704,-0.60733  ->  461 m   id=4910C
47.47302,-0.58133  ->    0 m   id=4910C
47.47598,-0.56685  ->  114 m   id=4910C
```

Deux anomalies se cumulent. Les distances sont fausses sur la majeure partie du tracé. Et l'API
renvoie systématiquement l'identifiant `4910C`, alors que `/v1/networks` publie ce réseau sous
`4911C` — `4910C` y désigne « Angers Rive Droite », un autre réseau distant de 3 km. Le moteur
d'éligibilité interroge donc une géométrie partielle rattachée au mauvais enregistrement.

La distance réelle, calculée sur le tracé publié, est de **59 m**.

### Ampleur, mesurée

Sur 125 réseaux tirés au hasard, trois points pris sur le tracé publié de chacun :

| Constat | Part |
|---|---|
| Tracé correctement indexé (écart ≤ 50 m) | 92 % |
| Tracé partiellement indexé | 2 % |
| API muette (`null`) alors que le point est sur le tracé | 6 % |

Sur un échantillon de 150 points géographiques quelconques, l'API reste cohérente à ±100 m dans
94 % des cas. Le défaut est donc minoritaire mais structurel : il touche **environ 8 % des
réseaux**, silencieusement, et un site concerné est classé « au-delà de 500 m » alors qu'il est
desservi.

## Décision

> Nous importons le tracé publié par `GET /v1/networks` dans une table locale
> `raw_reseaux_chaleur` (`pnpm db:reseaux-chaleur:import`) et calculons la distance en PostGIS
> (`ST_Distance` sur la projection geography). L'appel live à `/v1/eligibility` est abandonné.

Le seuil métier de 500 m, la matrice et le poids du critère sont **inchangés** : seule la donnée
d'entrée devient juste. Ce n'est donc pas une nouvelle version d'algorithme — les indices des sites
concernés changent, c'est précisément la correction attendue.

### Le tracé est téléchargé, pas commité

Le GeoJSON pèse 63 Mo (2 millions de segments), dix fois le plus gros référentiel du dépôt
(`base-ite-3000.geojson`, 5,9 Mo). L'endpoint étant public, stable et sans authentification, le
script le télécharge à l'exécution. C'est une différence assumée avec l'ICU et l'ITE fret, dont les
sources nécessitaient une conversion hors ligne (GDAL, indisponible au runtime Scalingo).

### Les réseaux sans tracé sont conservés et marqués

235 réseaux sur 1 307 (18 %) ne sont publiés que par un point — la position de la chaufferie, sans
le tracé. Les écarter reviendrait à ignorer un réseau sur cinq. Ils sont donc importés, avec une
colonne `trace_complet` à `false` : pour ceux-là, la distance mesurée est un **majorant** de la
distance réelle au réseau. C'est la même limite que celle qu'on reproche à l'API, mais elle est
ici explicite et traçable.

### Index sur la projection geography

`ST_DWithin(geom::geography, …)` n'utilise pas l'index GiST posé sur `geom`. Sans un index dédié
`gist((geom::geography))`, la requête passe de 63 ms à 1,3 s. Il est créé par la migration.

## Conséquences

- **La latence baisse** : un appel HTTP externe (50 ms nominal, 3 s de timeout) est remplacé par
  une requête locale à 63 ms. Le domaine énergie ne dépend plus d'un service tiers au runtime.
- **Une panne de FCU n'a plus d'effet** sur l'enrichissement, ni sur le cache strict.
- **La donnée vieillit entre deux imports.** C'est le reproche que l'ADR-0036 adressait au
  référentiel local, et il reste valable : les réseaux en construction évoluent en continu.
  L'import est à rejouer une à deux fois par an, ou sur signalement d'un écart. En contrepartie,
  8 % des réseaux cessent d'être faux en permanence.
- **France Chaleur Urbaine sort du monitoring des APIs live** et entre au registre des imports :
  la page « Données utilisées » la présente désormais comme un référentiel local, plus comme une
  API interrogée à chaque analyse.
- **Les champs annexes de `/v1/eligibility` ne sont plus accessibles** — `inPDP`, `isEligible`,
  `futurNetwork`, `rateENRR`. Aucun n'était exploité. `inPDP` (périmètre de développement
  prioritaire, avec obligation de raccordement) reste la piste la plus intéressante si le besoin
  métier se confirme : il faudrait alors soit un appel live complémentaire, soit une seconde
  source. Volontairement hors périmètre ici.
- **Le bug est signalé à l'équipe France Chaleur Urbaine.** S'il est corrigé, cette décision
  restera valable pour les autres raisons ci-dessus (latence, indépendance au runtime), mais
  l'écart de fraîcheur redeviendra l'argument dominant et mériterait un réexamen.

## Alternatives écartées

**Attendre le correctif de FCU.** Coût nul, mais délai inconnu, et l'erreur est invisible pour
l'utilisateur : elle se lit comme une donnée normale.

**Appel live avec repli local sur réponse suspecte.** Cumule les deux mécaniques et leur
maintenance. Surtout, on n'a pas de règle fiable pour qualifier une réponse de « suspecte » sans
déjà disposer du référentiel local — auquel cas autant s'en servir directement.

**Mesurer depuis le polygone de la parcelle plutôt que son centroïde.** Traite un vrai sujet
(l'écart croît avec la surface du site), mais pas celui-ci : les quatre coins de la parcelle
donnaient 691 à 823 m, tous très loin des 59 m réels. À reconsidérer séparément.

## Références

- ADR-0036 : décision révisée ici, dont le raisonnement sur la sémantique de `null` (ramenée à la
  tranche « ≥ 500 m ») reste entièrement valable.
- ADR-0024 (LOVAC), ADR-0032 (zonage ABC) : précédents de passage en référentiel local, dont la
  jurisprudence retrouve ici sa portée.
- ADR-0034 (ICU) : gabarit du référentiel spatial local et de son script d'import.
