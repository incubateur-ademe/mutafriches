# ADR-0006 : Déploiement sur Scalingo

**Date** : 2025-06-01
**Statut** : Accepté

## Contexte

Mutafriches est un projet Beta.gouv / ADEME. L'hébergement doit respecter les exigences du gouvernement français en matière de souveraineté des données et de conformité RGPD.

## Décision

Nous déployons sur **Scalingo** avec un serveur NestJS monolithique qui sert à la fois l'API et l'UI React compilée.

## Options envisagées

### Option A — Scalingo (retenue)

- Avantages : hébergement français (SecNumCloud), addon PostgreSQL avec PostGIS intégré, conformité RGPD native, review apps par PR, support du monorepo pnpm
- Inconvénients : moins de flexibilité qu'AWS/GCP, écosystème plus petit

### Option B — Vercel + base externe

- Avantages : excellent pour le frontend React, déploiement automatique
- Inconvénients : pas de support PostGIS natif, backend NestJS non standard pour Vercel, données hors de France

### Option C — Clever Cloud

- Avantages : hébergement français, PaaS mature
- Inconvénients : pas d'addon PostGIS aussi intégré, coût plus élevé

## Conséquences

### Positives

- Architecture monolithique simple : un seul conteneur sert API + UI
- PostGIS activé en une commande SQL (`CREATE EXTENSION postgis`)
- Les review apps permettent de tester chaque PR en environnement isolé

### Négatives / Risques

- Le build monolithique est plus long (shared-types → API → UI dans un seul `scalingo-postbuild`)

## Liens

- Configuration : `scalingo.json`, `Procfile`
- Build script : `package.json` → `scalingo-postbuild`
- Production : https://mutafriches.beta.gouv.fr
- Staging : https://mutafriches.incubateur.ademe.dev
