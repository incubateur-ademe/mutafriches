# ADR-0033 : Contrat d'erreur des données complémentaires et dépréciation du contrat metadata

**Date** : 2026-08-28
**Statut** : Accepté

## Contexte

Un partenaire intégrateur a reçu des `500 Internal Server Error` répétés sur `POST /evaluation/calculer`. La cause n'était pas une panne : son bloc `donneesComplementaires` ne contenait que 7 des 9 champs requis (`trameVerteEtBleue`, `presenceEspecesProtegees` et `presenceZoneHumide` manquaient). `Site.estComplete()` renvoyait `false`, l'orchestrateur levait un `Error` nu, et le contrôleur le convertissait en 500 générique.

Le partenaire n'avait pas commis d'erreur d'intégration : il avait repris l'exemple publié sur notre propre page de documentation, et `GET /evaluation/metadata` décrivait le même contrat tronqué. Trois descriptions du contrat d'entrée coexistaient et avaient divergé — la page UI, l'endpoint `metadata` et les exemples Swagger.

Deux questions se posaient donc, au-delà du correctif : que doit renvoyer l'API quand une entrée est incomplète, et comment faire évoluer un contrat public déjà consommé sans casser les intégrateurs en production (Bénéfriches, SCET).

## Décision

> Nous refusons explicitement une entrée incomplète par un **400 nommant les champs manquants**, plutôt que de compléter silencieusement les valeurs absentes.

> Nous faisons évoluer le contrat public **par ajout puis dépréciation annoncée**, jamais par suppression directe dans un correctif.

Concrètement :

- La validation s'exécute en **première instruction** de `calculerMutabilite()` et `comparerMutabilite()`, avant toute lecture du cache ou de la base.
- La réponse porte un `code` machine (`DONNEES_COMPLEMENTAIRES_INCOMPLETES`) et un tableau `champsManquants`.
- `GET /evaluation/metadata` expose désormais `champsComplementairesRequis` et `champsDerives` : une énumération de valeurs d'enum décrit ce qui est *autorisé*, pas ce qui est *obligatoire*.
- `raccordementEau` (dérivé) et `trameVerteEtBleue` (mal classé dans le bloc `enrichissement`) restent à leur emplacement actuel, documentés comme dépréciés, le temps d'une version.

## Options envisagées

### Option A — 400 explicite nommant les champs (retenue)

- Avantages : l'intégrateur corrige en une itération sans nous solliciter ; l'erreur est distinguable d'une panne serveur ; le `code` permet un traitement automatique côté client ; les 4xx sortent des alertes d'incident
- Inconvénients : rupture pour un appelant qui envoyait jusqu'ici un payload incomplet — mais il recevait déjà un 500, donc rien ne fonctionnait

### Option B — Compléter les champs absents par `ne-sait-pas` et répondre 201

- Avantages : aucune rupture, l'algorithme sait déjà ignorer un critère non renseigné (la fiabilité baisse en conséquence)
- Inconvénients : renvoie un score d'apparence normale sur des données que l'intégrateur croit avoir transmises. Remplace un 500 visible par un résultat faux invisible, bien plus coûteux à diagnostiquer

### Option C — Validation exhaustive du corps via class-validator

- Avantages : solution NestJS canonique, valide aussi les valeurs d'enum
- Inconvénients : rendrait la validation d'enum bloquante alors qu'une valeur inconnue est aujourd'hui silencieusement ignorée au scoring. Un intégrateur en production passerait de 201 à 400 sans préavis. À reprendre séparément, en journalisation d'abord

## Conséquences

### Positives

- Un contrat d'entrée dont l'API est la source de vérité, et non trois pages de documentation
- La liste des champs requis est servie de façon exploitable par machine : un intégrateur peut la lire au démarrage
- Les 4xx sont journalisés en `warn` et non en `error` : les vraies pannes redeviennent visibles
- La validation précédant le cache, un bloc absent ne peut plus produire de `TypeError` dans le comparateur

### Négatives / Risques

- Un intégrateur qui énumérerait rigidement les clés de `enums.saisie` verra apparaître trois clés supplémentaires — additif, donc sans rupture, mais à surveiller
- La dépréciation de `raccordementEau` et `trameVerteEtBleue` reste à solder dans une version ultérieure : tant qu'ils figurent dans `enums.saisie`, la confusion persiste partiellement
- La liste `CHAMPS_COMPLEMENTAIRES_REQUIS` est un tuple explicite, pas une dérivation de `CRITERES_METADATA` : `saisie: "MANUELLE"` y décrit une provenance et non une obligation. Un test de cohérence garde les deux alignés, mais la vraie dérivation demandera un attribut `requisPourCalcul` dans le référentiel

### Migration

1. Les intégrateurs ajoutent les trois champs manquants, avec `"ne-sait-pas"` pour toute information non connue.
2. `raccordementEau` peut être retiré de leurs appels : il est recalculé à partir de la surface bâtie.
3. Retrait effectif de `raccordementEau` et `trameVerteEtBleue` de leurs emplacements dépréciés dans `enums`, après annonce aux intégrateurs.

## Liens

- Validation partagée : `packages/shared-types/src/evaluation/utils/donnees-complementaires.validation.ts`
- Orchestrateur : `apps/api/src/evaluation/services/orchestrateur.service.ts`
- Contrat metadata : `apps/api/src/evaluation/dto/output/metadata.enums.ts`
- Documentation intégrateur : `docs/integration/README.md`
- PR : #174 (correctif du 500), puis PR de suivi (clé de cache et contrat metadata)
