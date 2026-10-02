# ADR-0048 : Critères excluants par usage

**Date** : 2026-10-01
**Statut** : Accepté

## Contexte

L'algorithme compense tous ses critères entre eux : l'indice d'un usage vaut avantages / (avantages + contraintes). Un critère « Très négatif » pèse au plus 2 × son poids, si bien qu'une caractéristique qui rend un usage **impossible** peut être noyée par le reste.

Deux cas ont été remontés par l'équipe produit :

- en zone d'exclusion des EnR (loi APER), seul le photovoltaïque en toiture est autorisé, et pourtant la centrale au sol pouvait sortir 2e avec un potentiel « Très bon » ;
- avec une zone humide **et** des espèces protégées sur le site, l'industrie et les bureaux restaient classés « Bon ». Sur la parcelle de test de Beaucouzé, ils arrivaient même juste derrière la renaturation.

Afficher un pourcentage pour un usage interdit induit en erreur. Les maquettes demandent de remplacer l'indice par un message et de marquer « Bloquant » les critères en cause.

## Décision

> Nous ajoutons à l'algorithme (v1.16) des règles d'exclusion binaires, déclarées hors matrice et versionnées dans le registre. Leur résultat est exposé par l'API de manière additive.

- `REGLES_EXCLUSION` (`algorithme.config.ts`) : chaque règle désigne des usages et des conditions sur la valeur scorée des critères. Elle se déclenche quand **toutes** ses conditions sont réunies. « Ne sait pas » ne déclenche donc jamais d'exclusion.
- Les règles sont portées par `AlgorithmeConfig.reglesExclusion`. Les versions antérieures n'en ont pas : un calcul en `?versionAlgorithme=v1.15` reste identique à l'historique.
- `UsageResultat` gagne `exclu` et `criteresExcluants`. L'indice reste **calculé et exposé**. Le `potentiel` vaut « Exclu ».
- Les usages exclus sont relégués en fin de classement, et chaque groupe est trié par indice décroissant. Le rang 1 n'est donc jamais un usage exclu (sauf si les sept l'étaient).
- L'UI n'affiche pas d'indice pour un usage exclu, ne le place pas au podium et marque ses critères « Bloquant » (niveau d'impact `bloquant`) dans le détail et dans le PDF.

## Options envisagées

### Option A — Règles binaires hors matrice, contrat additif (retenue)

- Avantages : la matrice, les poids et la fiabilité ne changent pas, et l'Excel de référence reste comparable. La règle est lisible en une ligne. Les intégrateurs (Bénéfriches, API AURA / Indre / ARNIA, export CNIG) continuent de lire un `indiceMutabilite` numérique. Les anciennes versions restent reproductibles.
- Inconvénients : un consommateur qui ignore `exclu` peut encore lire un indice pour un usage impossible. Le classement par rang compense en partie ce risque.

### Option B — Nouveau niveau `ScoreImpact.EXCLUANT` dans la matrice

- Avantages : une seule structure à maintenir.
- Inconvénients : la matrice score un critère seul. Elle ne sait pas exprimer « zone humide **et** espèces protégées ». Il faudrait aussi traiter ce niveau à part dans le calcul de l'indice, de la fiabilité et du détail.

### Option C — Indice forcé à 0 ou à `null` pour un usage exclu

- Avantages : impossible à mal interpréter côté consommateur.
- Inconvénients : `null` casse le contrat des intégrateurs, qui attendent un nombre. Un 0 se confond avec un vrai score nul. Dans les deux cas, on perd l'information utile à l'outil de comparaison d'algorithmes.

## Conséquences

### Positives

- Un usage impossible n'est plus jamais recommandé (podium, rang 1, résumé iframe, usage prioritaire CNIG).
- Une nouvelle exclusion s'ajoute en une entrée de `REGLES_EXCLUSION`, sans toucher au calcul.
- Le cache d'évaluation n'est servi que pour `VERSION_COURANTE` : le passage en v1.16 l'invalide sans purge.

### Négatives / Risques

- Le rang d'un usage peut changer sans que son indice bouge. Une statistique Metabase sur `rang` mélangera v1.15 et v1.16 : il faut ventiler par `version_algorithme`.
- Les intégrateurs API doivent lire `exclu` pour ne pas afficher d'indice sur un usage exclu. Le champ est documenté dans Swagger et sur la page de documentation API.
- Aucune source Excel ne couvre ces règles : leur source est l'arbitrage produit, cité dans `versions/v1.16.ts`.

## Liens

- `apps/api/src/evaluation/services/algorithme/algorithme.config.ts` (`REGLES_EXCLUSION`)
- `apps/api/src/evaluation/services/calcul.service.ts` (`determinerCriteresExcluants`)
- `apps/api/src/evaluation/services/algorithme/versions/v1.16.ts`
- `packages/shared-types/src/evaluation/dto/mutabilite-output.dto.ts`
- `packages/shared-types/src/recapitulatif/detail-usage.builder.ts`
- `apps/ui/src/features/resultats/utils/usagesLabels.utils.ts`
- Documentation : `docs/evaluation-mutabilite.md` (étape 5c), `.claude/context/evaluation-patterns.md`
