# ADR-0005 : Séparation adapters / services domaine

**Date** : 2025-06-01
**Statut** : Accepté

## Contexte

Le module d'enrichissement interagit avec 24 APIs externes et 3 bases locales. Il faut structurer le code pour séparer l'accès aux données (HTTP, PostGIS) de la logique métier (calculs de distance, catégorisation, agrégation).

## Décision

Nous séparons le module en deux couches :
- **Adapters** (`adapters/`) : clients HTTP purs, retournent `ApiResponse<T>`
- **Services domaine** (`services/`) : logique métier, reçoivent un `Site`, retournent `EnrichmentResult`

## Options envisagées

### Option A — Deux couches (retenue)

- Avantages : un adapter peut être réutilisé par plusieurs domaines, les mocks de test sont simples (mock de l'adapter uniquement), le remplacement d'une API ne touche pas la logique métier
- Inconvénients : plus de fichiers, indirection supplémentaire

### Option B — Services monolithiques

- Avantages : moins de fichiers, tout au même endroit
- Inconvénients : impossible de mocker l'API sans mocker la logique, duplication si deux domaines utilisent la même API, tests plus complexes

## Conséquences

### Positives

- GéoRisques illustre bien le pattern : 1 orchestrateur GéoRisques + 13 sous-adapters spécialisés, tous consommés par les services risques-naturels et risques-technologiques
- Les tests unitaires mockent uniquement l'adapter et testent la logique métier en isolation

### Négatives / Risques

- Le nombre de fichiers est élevé (25+ adapters, 12 services domaine)
- Les patterns ne sont pas encore uniformes entre tous les services (voir ticket d'harmonisation)

## Liens

- Adapters : `apps/api/src/enrichissement/adapters/`
- Services domaine : `apps/api/src/enrichissement/services/`
- Module : `apps/api/src/enrichissement/enrichissement.module.ts`
