# ADR-0009 : Cache d'évaluation 24h

**Date** : 2025-06-01
**Statut** : Accepté

## Contexte

Un calcul de mutabilité implique un enrichissement (24 APIs + 3 bases locales) puis un scoring. Ce processus prend ~3-5 secondes. Les utilisateurs peuvent recalculer plusieurs fois la même parcelle en changeant les données complémentaires manuelles.

## Décision

Nous cachons les évaluations **24 heures** avec invalidation par comparaison champ par champ des données complémentaires. Les évaluations contenant `"ne-sait-pas"` ne sont pas cachées.

## Options envisagées

### Option A — Cache 24h avec comparaison champ par champ (retenue)

- Avantages : évite les recalculs inutiles, le TTL de 24h correspond à la stabilité des données urbaines (cadastre, risques, transport), la comparaison champ par champ est précise
- Inconvénients : 8 champs à comparer, pas de hash (plus verbeux)

### Option B — Pas de cache

- Avantages : résultats toujours frais, pas de logique de cache
- Inconvénients : 24+ appels API à chaque calcul, latence élevée, quotas API consommés

### Option C — Cache par hash des entrées

- Avantages : comparaison en O(1), plus simple
- Inconvénients : risque de collision, moins lisible pour le debug

## Conséquences

### Positives

- Un utilisateur qui change un seul champ complémentaire obtient un nouveau calcul (cache miss)
- Un utilisateur qui relance le même calcul obtient le résultat instantanément (cache hit)
- Les résultats partiels (`"ne-sait-pas"`) ne polluent pas le cache

### Négatives / Risques

- Si les données d'une API externe changent dans les 24h, le cache retourne l'ancien résultat
- La comparaison de 8 champs est fragile si on ajoute un nouveau champ complémentaire (il faut penser à l'ajouter à la comparaison)

## Liens

- Repository cache : `apps/api/src/evaluation/repositories/evaluation.repository.ts`
- Validateur cache : `apps/api/src/evaluation/utils/cache-validator.ts`
- Orchestrateur : `apps/api/src/evaluation/services/orchestrateur.service.ts`
