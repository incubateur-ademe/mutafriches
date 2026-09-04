# ADR-0035 : Modéliser la zone d'exclusion EnR comme quatrième valeur du critère ZAER

**Date** : 2026-09-04
**Statut** : Accepté

## Contexte

La loi APER permet de définir, en plus des zones d'accélération des EnR, des **zones d'exclusion** où l'implantation de nouvelles installations est interdite, à l'exception du photovoltaïque en toiture. Mutafriches n'exploitait que les zones d'accélération, via la couche `zaer:zaer` du WFS Géoplateforme : un site interdit d'EnR n'était pas distingué d'un site simplement hors zone d'accélération.

Contrairement à l'hypothèse de départ, la couche `zaer:zaer` ne porte **pas** cette information : son schéma compte 18 propriétés et aucune ne décrit un régime d'interdiction (`DescribeFeatureType` vérifié le 2026-09-04). Les interdictions vivent dans une couche OFB distincte du même WFS, `OFB_INTERDICTION-ZAER-SAUF-TOITURE:zones_exclues_aires_acceleration_sauf_toiture`, issue des travaux de l'Office français de la biodiversité. Cette couche mélange deux régimes, portés par son champ `zonage` :

- « Interdiction ZAER (loi APER) toutes ENR sauf toiture » (373 entités) — le photovoltaïque au sol est interdit ;
- « Interdiction ZAER (loi APER) éolien uniquement » (1258 entités) — sans effet sur nos 7 usages, aucun ne portant l'éolien.

Une troisième couche, `OFB.ZONES.EXCLUES:zones_exclues_aires_acceleration_eolien_terrestre`, ne concerne que l'éolien terrestre : elle n'est pas interrogée.

La règle métier fournie par l'équipe distingue trois cas exclusifs : site en zone d'accélération (algorithme inchangé), site hors zone d'accélération et hors zone d'exclusion (algorithme inchangé), site en zone d'exclusion (neutre sur les six usages non énergétiques, très négatif sur le photovoltaïque).

## Décision

> Nous représentons la zone d'exclusion comme une **quatrième valeur de l'enum `ZoneAccelerationEnr`** (`exclusion`), et non comme un critère supplémentaire de l'algorithme.

Concrètement :

- [zone-acceleration-enr.enum.ts](../../packages/shared-types/src/enrichissement/enums/zone-acceleration-enr.enum.ts) expose `EXCLUSION`, scorée `TRES_NEGATIF` pour l'usage photovoltaïque et `NEUTRE` pour les six autres dans [algorithme.config.ts](../../apps/api/src/evaluation/services/algorithme/algorithme.config.ts) (algorithme v1.12).
- L'exclusion est **prioritaire** dans [enr.calculator.ts](../../apps/api/src/enrichissement/services/enr/enr.calculator.ts) : un site couvert à la fois par une zone d'accélération et par une interdiction vaut `EXCLUSION`, et ses badges de filières laissent place au badge d'exclusion.
- Les deux couches sont interrogées **en parallèle** avec le même filtre `INTERSECTS`. La détection porte sur le **mot-clé** `SAUF TOITURE` du champ `zonage`, normalisé en majuscules : c'est lui qui sépare les deux régimes de la couche OFB, `INTERDICTION` étant présent dans les deux.
- Un échec de la couche d'interdiction fait échouer tout l'enrichissement ENR (`sourcesEchouees`, champ manquant `zaer`), plutôt que de renvoyer un `enZoneExclusion: false` faussement rassurant. Le critère vaut alors `undefined` : il est ignoré au scoring et ne compte pas dans la fiabilité.
- Le nombre de critères (28), le poids du critère (1) et le poids total (30) sont inchangés : la fiabilité n'est pas affectée.

Cette décision complète l'[ADR-0013](0013-zaenr-affichage-granulaire-scoring-grossier.md), qui séparait l'affichage granulaire des filières du scoring grossier : le scoring reste grossier, mais gagne une classe qui n'est pas une filière — c'est un régime réglementaire.

## Options envisagées

### Option A — Quatrième valeur de l'enum `ZoneAccelerationEnr` (retenue)

- Avantages :
  - Les trois cas de la règle métier sont des **états mutuellement exclusifs d'un même critère** : un site est en zone d'accélération, en zone d'exclusion, ou dans aucune des deux.
  - Poids total (30) et nombre de critères (28) inchangés : ni la fiabilité, ni le garde-fou doc/algo ([algorithme.config.spec.ts](../../apps/api/src/evaluation/services/algorithme/algorithme.config.spec.ts)), ni `CRITERES_METADATA` ne bougent.
  - Aucun nouveau champ dans les DTO d'évaluation, ni dans la clé de cache, ni dans le récapitulatif.
  - Les versions figées de l'algorithme ignorent nativement la valeur inconnue (`obtenirScoreCritere` renvoie `null`, le critère n'est alors ni avantage ni contrainte) : une évaluation rejouée en v1.11 reste reproductible.
- Inconvénients :
  - Un enum nommé « zone d'accélération » porte une valeur qui en est le contraire — le libellé du critère devient légèrement impropre.
  - Impossible de scorer indépendamment le cumul « en zone d'accélération ET en zone d'exclusion » : la priorité écrase l'information au niveau du score (elle reste visible dans `zaer.zones`).

### Option B — Nouveau critère `zoneExclusionEnr`

- Avantages :
  - Sémantiquement net : un critère par régime réglementaire, et le cumul accélération/exclusion reste scorable.
  - Permettrait une pondération propre, indépendante de celle de la zone d'accélération.
- Inconvénients :
  - 29 critères et poids total 31 : recalcul de la fiabilité de **toutes** les évaluations à venir, doc métier et technique à reprendre intégralement, garde-fou à mettre à jour.
  - Nouveau champ dans le DTO d'enrichissement, dans `CRITERES_METADATA`, dans le récapitulatif et l'export PDF, pour une information qui n'a de sens que croisée avec la précédente.
  - Deux critères pourraient se contredire (accélération positive + exclusion négative) sans qu'aucune règle ne tranche au niveau du score.

### Option C — Donnée informative hors algorithme

- Avantages :
  - Aucun impact sur les indices ni sur les versions d'algorithme ; simple affichage, comme l'îlot de chaleur urbain (ADR-0034).
- Inconvénients :
  - Laisse le bug en place : un site interdit d'EnR continuerait de recevoir le bonus photovoltaïque de la zone d'accélération.
  - Contredit la règle métier fournie, qui demande explicitement un effet sur le scoring.

## Conséquences

### Positives

- Un site en zone d'interdiction n'est plus valorisé pour le photovoltaïque : le classement des usages reflète la réalité réglementaire.
- Le message d'interdiction est porté par une constante partagée (`MESSAGE_ZONE_EXCLUSION_ENR`) et une `mention` sur le récapitulatif, donc rendu à l'identique en qualification, dans le détail par usage, dans le récapitulatif écran et dans l'export PDF.
- Les six autres usages sont strictement inchangés, ce qui rend la nouvelle version comparable à v1.11 sur ces usages.

### Négatives / Risques

- La détection dépend du libellé du champ `zonage` : un changement de vocabulaire de la source (par exemple « hors toiture » à la place de « sauf toiture ») ferait silencieusement retomber les sites en régime « accélération ». À surveiller à chaque millésime, avec les tests de [enr.calculator.spec.ts](../../apps/api/src/enrichissement/services/enr/enr.calculator.spec.ts) comme garde-fou de vocabulaire.
- Le domaine ENR passe de une à **deux requêtes WFS par site**, lancées en parallèle : la latence du domaine reste celle de la plus lente, mais sa probabilité d'échec double, et un échec de la couche d'interdiction prive désormais le calcul du critère entier.
- L'alias `OFB_ZONES.EXCLUES.SAUF.TOITURE:zones_exclues_aires_acceleration_sauf_toiture` pointe la même donnée mais son `DescribeFeatureType` renvoie une page de métriques Tomcat : le typename retenu est `OFB_INTERDICTION-ZAER-SAUF-TOITURE:...`, à ne pas « simplifier ».
- La couche OFB est un travail d'expertise environnementale, pas un recueil des délibérations communales : elle recense les zonages de protection excluant les EnR, non les exclusions décidées localement hors de ces zonages.
- L'enum mélange deux sémantiques (présence d'une zone d'accélération et régime d'interdiction), au prix d'une lecture moins évidente pour un nouvel arrivant.

### Migration

- Les évaluations déjà en base conservent leur version d'algorithme : aucune reprise de données. v1.11 a été figée en copie statique dans le même mouvement, car elle ré-exportait la configuration courante.
- Les deux couches étant interrogées à la volée, aucune tâche d'import ni migration de schéma n'est nécessaire.
- `ZaerDetail.zonage` a été retiré du DTO d'enrichissement : le champ décrivait un régime que la couche `zaer:zaer` ne porte pas. Le régime d'interdiction est exposé par le seul booléen `enZoneExclusion`.

## Liens

- Sources : [zaer-wfs.service.ts](../../apps/api/src/enrichissement/adapters/zaer-wfs/zaer-wfs.service.ts), [enr-enrichissement.service.ts](../../apps/api/src/enrichissement/services/enr/enr-enrichissement.service.ts), [v1.12.ts](../../apps/api/src/evaluation/services/algorithme/versions/v1.12.ts)
- ADR liés : [ADR-0013](0013-zaenr-affichage-granulaire-scoring-grossier.md) (affichage granulaire / scoring grossier)
- Documentation : [docs/evaluation-mutabilite.md](../evaluation-mutabilite.md), [docs/enrichissement.md](../enrichissement.md)
- Source de données : [Carte des zones d'accélération et d'exclusion — Géoplateforme](https://data.geopf.fr/wfs)
