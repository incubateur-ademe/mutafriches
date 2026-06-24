# ADR-0019 : Dérivation automatique du raccordement eau depuis la surface bâtie

**Date** : 2026-06-24
**Statut** : Accepté

## Contexte

Le critère `raccordementEau` (poids 1) était l'un des 10 champs complémentaires saisis manuellement par l'utilisateur dans l'UI (liste déroulante Oui / Non / Ne sait pas). Or l'information est largement déductible d'une donnée déjà enrichie automatiquement : la surface bâtie issue de la BDNB (`surfaceBati`). La présence d'un bâtiment significatif sur le site implique en pratique un raccordement aux réseaux d'eau.

Demander cette saisie ajoutait une friction inutile dans le parcours et exposait à des incohérences (utilisateur déclarant « non raccordé » sur un site manifestement bâti). La règle métier retenue avec l'équipe est simple : du bâti de plus de 20 m² sur le site implique un raccordement supposé.

## Décision

> Nous dérivons automatiquement `raccordementEau` depuis `surfaceBati`, côté serveur, à la construction de l'entité `Site`. La valeur dérivée fait autorité sur toute valeur transmise.

Règle (helper partagé `deriverRaccordementEau` dans `packages/shared-types`) :

- `surfaceBati > 20 m²` => `OUI`
- `surfaceBati <= 20` (dont terrain nu à 0) => `NON`
- `surfaceBati` indisponible (BDNB en panne) => `NE_SAIT_PAS`

La dérivation est appliquée dans `Site.fromEnrichissement` et `Site.fromInput`, après copie des données complémentaires. Le champ devient optionnel dans `DonneesComplementairesInputDto` : inutile à transmettre, la valeur fournie est ignorée (vaut aussi pour les intégrateurs API). Côté UI, la liste déroulante est remplacée par un badge figé en lecture seule (`RaccordementEauField`, badges DSFR).

La matrice de scoring et les poids restent inchangés : aucune nouvelle version d'algorithme.

## Options envisagées

### Option A — Dérivation côté serveur via helper partagé (retenue)

- Avantages : règle métier unique appliquée à tous les appelants (UI et intégrateurs API type Benefriches) ; un seul endroit pour le seuil ; `estComplete()` satisfait même si l'intégrateur n'envoie rien ; UI et serveur partagent le même helper, pas de divergence.
- Inconvénients : `raccordementEau` reste structurellement dans le DTO complémentaire (et le snapshot de cache) bien qu'il ne soit plus saisi ; classification doc « complémentaire » devenue « dérivée ».

### Option B — Calcul uniquement côté UI

- Avantages : changement le plus localisé, aucune modification de l'API.
- Inconvénients : les intégrateurs appelant directement l'API devraient continuer à fournir le champ manuellement ; règle métier dupliquée hors du serveur, source de vérité ambiguë.

## Conséquences

### Positives

- Un champ de saisie en moins dans le parcours utilisateur.
- Cohérence garantie entre la présence de bâti et le raccordement eau.
- Bénéfice automatique pour les intégrateurs API (plus besoin d'envoyer le champ).
- Poids total et scoring inchangés (29,5) : pas de rupture de reproductibilité.

### Négatives / Risques

- Quand `surfaceBati` est indisponible (BDNB en panne, cas rare), la valeur dérivée est `NE_SAIT_PAS` : le résultat n'est pas mis en cache et la fiabilité baisse légèrement. Compromis assumé.
- Une valeur `raccordementEau` explicitement transmise par un intégrateur est désormais ignorée au scoring (mais conservée telle quelle dans le snapshot persisté) : écart possible entre snapshot et valeur effective sur ce cas marginal.

### Migration

Aucune migration de données. Les évaluations passées conservent leur snapshot. Les nouveaux calculs dérivent la valeur à la volée.

## Liens

- Helper : `packages/shared-types/src/evaluation/utils/raccordement-eau.derivation.ts`
- Entité : `apps/api/src/evaluation/entities/site.entity.ts`
- DTO : `apps/api/src/evaluation/dto/input/donnees-complementaires.dto.ts`, `packages/shared-types/src/evaluation/dto/donnees-complementaires-input.dto.ts`
- UI : `apps/ui/src/features/qualification/components/RaccordementEauField.tsx`, `apps/ui/src/features/qualification/pages/QualificationSitePage.tsx`
- Documentation : `docs/evaluation-mutabilite.md`, `.claude/context/evaluation-patterns.md`
- Branche : `feat/raccordement-eau-auto`
