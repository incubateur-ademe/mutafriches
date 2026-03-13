# ADR-0001 : NestJS + Drizzle ORM

**Date** : 2025-06-01
**Statut** : Accepté

## Contexte

Mutafriches remplace un fichier Excel pour analyser la mutabilité des friches urbaines. L'API doit gérer des données spatiales PostGIS, appeler 24 APIs externes, et servir une UI React. Le choix du framework backend et de l'ORM est structurant.

## Décision

Nous utilisons **NestJS** comme framework backend et **Drizzle ORM** pour l'accès base de données.

## Options envisagées

### Option A — NestJS + Drizzle ORM (retenue)

- Avantages : architecture modulaire NestJS (injection de dépendances, guards, interceptors), Drizzle est SQL-first avec un excellent support TypeScript, support natif PostGIS, léger et performant
- Inconvénients : écosystème Drizzle plus jeune que Prisma/TypeORM

### Option B — NestJS + Prisma

- Avantages : écosystème mature, Prisma Studio, migrations robustes
- Inconvénients : support PostGIS limité (extensions spatiales complexes), couche d'abstraction plus épaisse, génération de code

### Option C — Express + TypeORM

- Avantages : flexibilité maximale, TypeORM supporte PostGIS
- Inconvénients : pas d'architecture structurée (guards, modules), TypeORM en perte de vitesse, plus de boilerplate

## Conséquences

### Positives

- Drizzle permet d'écrire des requêtes SQL proches du métal pour PostGIS (ST_Distance, ST_Contains, etc.)
- L'architecture modulaire NestJS structure naturellement les 10 domaines d'enrichissement
- Le typage Drizzle est inféré automatiquement depuis les schémas

### Négatives / Risques

- Drizzle étant plus récent, certaines fonctionnalités avancées peuvent manquer
- L'équipe doit maîtriser à la fois NestJS et Drizzle

## Liens

- Drizzle ORM : https://orm.drizzle.team/
- NestJS : https://nestjs.com/
- Schémas Drizzle : `apps/api/src/shared/database/schemas/`
