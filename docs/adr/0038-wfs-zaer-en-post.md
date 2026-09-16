# ADR-0038 : Interrogation du WFS ZAER en POST XML plutôt qu'en GET CQL

**Date** : 2026-09-16
**Statut** : Accepté
**Amende** : [ADR-0035](0035-zone-exclusion-enr-quatrieme-valeur-zaer.md)

## Contexte

Un site testé à Jarrie (38200), situé dans la réserve naturelle régionale de l'Étang de
Haute-Jarrie — donc dans une zone d'interdiction APER — était restitué « Non » sur le critère
`zoneAccelerationEnr`, sans effet sur l'indice de mutabilité.

Le diagnostic, mené contre le WFS de production, fait apparaître deux défauts enchaînés.

### La requête partait en 414

L'adapter construisait `CQL_FILTER=INTERSECTS(geom, MULTIPOLYGON(...))` et l'envoyait en **GET**.
Pour la parcelle `38200000AB0192`, le WKT fait 10 081 caractères et l'URL 11 214. La limite du
serveur, mesurée par dichotomie, est de **8 192 octets** : la requête échoue en
`414 Request-URI Too Long`, sur les deux couches.

Sont concernées les parcelles de plus de ~330 sommets — 0,4 % des parcelles de Jarrie, mais ce sont
les grandes parcelles naturelles ou industrielles, c'est-à-dire la population que l'outil évalue. Un
site multi-parcelles cumule davantage, l'union des géométries partant dans le même filtre.

### L'échec était masqué

`EnrCalculator.evaluer()` traitait l'absence de données comme une absence de zone et renvoyait
`NON`, alors que l'ADR-0035 prévoit explicitement `undefined` dans ce cas. La panne était donc
invisible : pas d'alerte, un « Non » affirmatif, et un critère compté comme renseigné dans la
fiabilité. Corrigé dans le même lot.

## Décision

> Le `GetFeature` part désormais en **POST, en XML natif WFS 2.0**, avec un filtre
> `fes:Intersects` portant une géométrie **GML** (`gml:MultiSurface` pour la géométrie du site,
> `gml:Point` pour le repli par coordonnées). Il n'y a plus de plafond de taille, et la géométrie
> exacte de la parcelle continue d'être envoyée.

Vérifications menées sur le WFS de production le 2026-09-16 :

| Transport | Résultat sur `38200000AB0192` |
|---|---|
| GET + `CQL_FILTER` (précédent) | `414` |
| POST `application/x-www-form-urlencoded` | `500` — non supporté par data.geopf.fr |
| **POST XML natif + filtre GML** | **`200`, retourne « Étang de Haute-Jarrie »** |

Le serveur accepte `srsName`, les anneaux intérieurs, `wfs:PropertyName` et `count` dans cette
forme. L'ordre des axes reste **(latitude, longitude)**, comme en CQL. Temps de réponse mesurés :
0,1 s sur la couche d'interdiction, 1,3 à 4,5 s sur `zaer:zaer` (1,1 million d'entités) — dans le
budget des 15 s du client.

Les coordonnées sont les seules valeurs non constantes injectées dans le document : elles sont
refusées si elles ne sont pas des nombres finis, plutôt que de laisser une chaîne entrer dans le
XML. La construction GML est paresseuse afin que cette validation lève **à l'intérieur** du
try/catch de la requête — un adapter ne doit jamais propager d'exception.

## Options envisagées

### Option A — POST XML natif WFS (retenue)

- Avantages : supprime le plafond de taille ; conserve la géométrie exacte, donc la détection d'un
  recouvrement partiel ; forme documentée du standard WFS 2.0, supportée par le serveur ; un seul
  chemin de code pour la géométrie et pour le point.
- Inconvénients : construction d'un document XML à la main plutôt qu'une chaîne CQL ; les tests
  d'adapter vérifient désormais un corps XML.

### Option B — Repli sur le centroïde quand le WKT est trop long

- Avantages : quelques lignes, le chemin par point existe déjà.
- Inconvénients : une parcelle recouverte à 40 % par une réserve naturelle mais dont le centroïde
  est dehors serait déclarée non exclue. Remplacer un échec visible par un faux négatif silencieux
  sur le critère le plus pénalisant de la matrice n'est pas un progrès.

### Option C — Simplifier la géométrie avant de bâtir le filtre

- Avantages : conserve le GET et son outillage.
- Inconvénients : introduit une tolérance à arbitrer, donc des faux positifs et des faux négatifs
  en bordure de zone, pour contourner une limite de transport qui n'a rien de métier.

### Option D — Importer la couche OFB en référentiel local

- Avantages : supprime la dépendance au WFS, déjà envisagé par l'ADR-0035 (4,4 Mo filtrés au régime
  « sauf toiture »).
- Inconvénients : ne règle pas le cas de `zaer:zaer` (1,1 million d'entités), qui reste en WFS et
  souffre du même plafond. À reconsidérer pour d'autres motifs, pas pour celui-ci.

## Conséquences

### Positives

- Les grandes parcelles et les sites multi-parcelles sont enfin évalués sur les deux couches.
- Une zone d'interdiction recouvrant partiellement le site est détectée, la géométrie complète
  restant transmise.
- Combiné au retour à `undefined` en cas d'échec, une panne du WFS devient visible — critère absent
  du récapitulatif et fiabilité en baisse — au lieu d'un « Non » silencieux.

### Négatives / Risques

- Le corps XML est construit par concaténation de chaînes, sans bibliothèque. Le périmètre est
  étroit (constantes du code plus des nombres validés) mais toute valeur textuelle ajoutée plus tard
  devra être échappée.
- Une requête POST n'est plus rejouable en collant une URL dans un navigateur : le diagnostic passe
  par les logs, qui indiquent la taille du document envoyé.

### Migration

Aucune : pas de schéma, pas de contrat d'API, pas de configuration. Les évaluations en cache de
moins de 24 h conservent l'ancienne valeur jusqu'à expiration.

## Liens

- ADR amendé : [ADR-0035](0035-zone-exclusion-enr-quatrieme-valeur-zaer.md)
- Affichage granulaire des filières : [ADR-0013](0013-zaenr-affichage-granulaire-scoring-grossier.md)
- Fichiers :
  - `apps/api/src/enrichissement/adapters/zaer-wfs/zaer-wfs.service.ts`
  - `apps/api/src/enrichissement/services/enr/enr.calculator.ts`
