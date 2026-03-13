# ADR-0010 : Matrice de scoring 24×7 dérivée d'Excel

**Date** : 2025-06-01
**Statut** : Accepté

## Contexte

Mutafriches remplace un fichier Excel de calcul de mutabilité utilisé par les urbanistes de l'ADEME. L'algorithme de scoring doit reproduire fidèlement la logique Excel tout en étant maintenable en code.

## Décision

Nous reproduisons la **matrice Excel 24 critères × 7 usages** dans un fichier de configuration TypeScript séparé (`algorithme.config.ts`). La formule de calcul `avantages / (avantages + contraintes) × 100` et le comportement spécial du score NEUTRE (0.5) sont préservés à l'identique.

## Options envisagées

### Option A — Matrice en configuration TypeScript (retenue)

- Avantages : reproduit exactement le comportement Excel (validable par les experts métier), séparation configuration/code, facile à modifier les scores sans toucher à la logique
- Inconvénients : fichier de config volumineux (24 critères × 7 usages × N valeurs), le score NEUTRE=0.5 est contre-intuitif

### Option B — Algorithme calculé dynamiquement

- Avantages : plus flexible, moins de configuration statique
- Inconvénients : impossible de valider par rapport à l'Excel de référence, risque de divergence

### Option C — Fichier Excel lu directement

- Avantages : source unique de vérité, modification par les non-devs
- Inconvénients : dépendance runtime à un fichier Excel, parsing complexe, pas de typage

## Conséquences

### Positives

- Les experts métier peuvent vérifier chaque score dans `algorithme.config.ts` par rapport à l'Excel
- Le score NEUTRE (0.5) ajouté aux avantages ET contraintes reproduit fidèlement le calcul Excel
- L'ajout d'un critère se fait en ajoutant une ligne dans la matrice et un poids dans les constantes

### Négatives / Risques

- Le score NEUTRE=0.5 est un piège documenté dans les Gotchas du CLAUDE.md
- Toute modification de la matrice doit être validée par rapport au fichier Excel de référence
- La fiabilité utilise une sémantique `null` vs `undefined` subtile (documentée dans `.claude/context/evaluation-patterns.md`)

## Liens

- Matrice de scoring : `apps/api/src/evaluation/services/algorithme/algorithme.config.ts`
- Constantes (poids) : `apps/api/src/evaluation/services/algorithme/algorithme.constants.ts`
- Calculateur fiabilité : `apps/api/src/evaluation/services/algorithme/fiabilite.calculator.ts`
- Documentation algorithme : `docs/evaluation-mutabilite.md`
- Patterns d'évaluation : `.claude/context/evaluation-patterns.md`
