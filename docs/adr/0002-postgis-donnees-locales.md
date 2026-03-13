# ADR-0002 : PostGIS avec données locales

**Date** : 2025-06-01
**Statut** : Accepté

## Contexte

Le module d'enrichissement doit calculer des distances et proximités géographiques (transport en commun, commerces, sites pollués). Deux approches possibles : tout appeler via APIs externes, ou stocker certaines données localement dans PostGIS pour les requêtes spatiales fréquentes.

## Décision

Nous utilisons **PostgreSQL + PostGIS** avec 3 tables de données locales (BPE INSEE, arrêts de transport, sites pollués ADEME) en complément des 24 APIs externes.

## Options envisagées

### Option A — Données locales PostGIS (retenue)

- Avantages : performances (requêtes spatiales < 50ms vs 2-5s par API), réduction de 99% du volume de données (2.8M → 182K pour BPE), pas de dépendance réseau pour les calculs de proximité, pas de quota API
- Inconvénients : maintenance des imports (scripts de mise à jour), espace disque, risque de données obsolètes

### Option B — Tout via APIs externes

- Avantages : données toujours à jour, pas de maintenance d'import
- Inconvénients : latence élevée (24+ appels réseau par enrichissement), quotas API, indisponibilité partielle fréquente

## Conséquences

### Positives

- Un enrichissement complet prend ~3s au lieu de ~15s (les requêtes PostGIS locales sont quasi-instantanées)
- Les données BPE filtrées ne retiennent que 15 codes équipements pertinents sur les centaines disponibles
- Les calculs de distance (ST_Distance) et de proximité (ST_DWithin) sont natifs et optimisés

### Négatives / Risques

- Les données BPE et transport doivent être mises à jour annuellement
- Les scripts d'import doivent être maintenus (`pnpm db:bpe:import`, `pnpm db:transport-stops:import`, `pnpm db:ademe-sites:import`)

## Liens

- Scripts d'import : `apps/api/src/scripts/`
- Schémas PostGIS : `apps/api/src/shared/database/schemas/raw-bpe.schema.ts`
- Documentation BPE : `README.md` section "Import des données BPE"
