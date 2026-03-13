# ADR-0003 : Pattern de mutation du Site

**Date** : 2025-06-01
**Statut** : Accepté

## Contexte

Le pipeline d'enrichissement traverse 10 services domaine séquentiellement. Chaque service ajoute des données au résultat. Il faut choisir entre un pattern immutable (chaque service retourne un nouvel objet) ou mutable (chaque service modifie l'objet en place).

## Décision

Nous utilisons un **objet `Site` mutable** qui traverse tout le pipeline. Chaque service d'enrichissement reçoit le Site et le modifie directement (mutation in-place).

## Options envisagées

### Option A — Mutation in-place du Site (retenue)

- Avantages : simple à comprendre, pas de copie d'objets complexes (géométries PostGIS), naturel pour un pipeline séquentiel de 10+ services, pas de composition de résultats intermédiaires
- Inconvénients : effets de bord possibles, debug plus difficile (état intermédiaire non capturé), tests nécessitent des mocks soigneux

### Option B — Immutable avec transformation

- Avantages : pas d'effets de bord, chaque étape est une fonction pure, facilite le debug
- Inconvénients : copie coûteuse des géométries PostGIS, composition complexe de 10+ résultats partiels, plus de boilerplate

## Conséquences

### Positives

- Le code est lisible : `site.distanceTransportCommun = result.data.distance`
- Le Site accumule naturellement les données au fil du pipeline
- L'orchestrateur n'a pas besoin de fusionner 10 résultats intermédiaires

### Négatives / Risques

- L'ordre d'appel des services peut impacter le résultat (dépendances entre domaines)
- Un service qui échoue peut laisser le Site dans un état partiel (géré via `EnrichmentResult.sourcesEchouees`)

## Liens

- Entité Site : `apps/api/src/evaluation/entities/site.entity.ts`
- Orchestrateur : `apps/api/src/enrichissement/services/enrichissement.service.ts`
- Pattern documenté : `.claude/context/enrichissement-patterns.md`
