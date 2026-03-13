# ADR-0011 : Sécurisation des endpoints POST par validation d'Origin (sans clé d'API)

**Date** : 2026-03-13
**Statut** : Accepté

## Contexte

Les endpoints POST de l'API (`/enrichissement`, `/evaluation/calculer`) sont consommés par :

- L'UI Mutafriches elle-même (même domaine en production)
- Des intégrateurs tiers (Bénéfriches) via iframe ou appels directs depuis leur frontend

La question se pose de la stratégie de sécurisation de ces endpoints : faut-il utiliser des clés d'API individuelles par intégrateur, ou un mécanisme plus simple ?

## Décision

Nous utilisons un **guard de validation d'Origin** (`IntegrateurOriginGuard`) basé sur une whitelist de domaines autorisés, sans clé d'API.

Le guard vérifie le header `Origin` (fallback sur `Referer`) de chaque requête POST et rejette celles provenant de domaines non whitelistés.

## Options envisagées

### Option A — Validation d'Origin par whitelist (retenue)

- Avantages :
  - Zéro friction pour les intégrateurs : pas de clé à générer, stocker, transmettre ou renouveler
  - Pas de secret à gérer côté intégrateur (une clé d'API dans le code frontend d'une SPA serait visible dans le navigateur de toute façon)
  - Ajout d'un nouvel intégrateur via une simple variable d'environnement (`ALLOWED_INTEGRATOR_ORIGINS`)
  - Suffisant pour le niveau de sensibilité des données (données cadastrales publiques, pas de données personnelles)
  - Cohérent avec le modèle Beta.gouv : API publique d'intérêt général, pas de monétisation
- Inconvénients :
  - Le header `Origin` peut être forgé dans des requêtes serveur-à-serveur (pas de protection contre un scraping backend)
  - Pas de granularité par intégrateur (impossible de révoquer un intégrateur sans affecter les autres sur le même domaine)
  - Pas de métriques d'usage par intégrateur (on ne sait pas qui consomme combien)

### Option B — Clés d'API par intégrateur

- Avantages :
  - Identification précise de chaque intégrateur
  - Possibilité de révoquer individuellement
  - Métriques d'usage par intégrateur
  - Rate-limiting personnalisé par intégrateur
- Inconvénients :
  - Les intégrateurs actuels (Bénéfriches) appellent l'API depuis le **navigateur** (SPA/iframe) : la clé d'API serait exposée dans le code JavaScript, donc pas de sécurité réelle ajoutée
  - Complexité de gestion : génération, distribution, rotation, stockage sécurisé
  - Nécessite une infrastructure (base de données de clés, middleware de validation)
  - Friction à l'onboarding de nouveaux intégrateurs
  - Surdimensionné pour le cas d'usage actuel (2-3 intégrateurs connus)

### Option C — OAuth2 / JWT

- Avantages :
  - Sécurité robuste, standards du marché
  - Tokens à durée de vie limitée
- Inconvénients :
  - Complexité disproportionnée pour une API sans données sensibles
  - Nécessite un serveur d'autorisation
  - Les intégrateurs devraient implémenter un flux OAuth côté client

## Conséquences

### Positives

- Déploiement immédiat, zéro infrastructure supplémentaire
- Les intégrateurs n'ont rien à faire côté code (leur domaine est ajouté à la whitelist)
- Protection suffisante contre l'utilisation abusive depuis des domaines non autorisés
- Le rate-limiting global (100 req/min par IP via ThrottlerGuard) complète la protection

### Négatives / Risques

- Un acteur déterminé peut contourner la vérification d'Origin en faisant du scraping côté serveur
- Ce risque est accepté car les données manipulées (cadastre, risques, zonages) sont des données publiques
- Si un besoin d'identification par intégrateur émerge (facturation, quotas différenciés), il faudra migrer vers des clés d'API

### Évolution possible

Si le nombre d'intégrateurs augmente significativement ou si un besoin de métriques par intégrateur apparaît, envisager une migration vers des clés d'API avec un header `X-API-Key`. Cette migration serait rétro-compatible (le guard peut vérifier Origin ET clé d'API en parallèle pendant une période de transition).

## Liens

- Guard : `apps/api/src/shared/guards/integrateur-origin.guard.ts`
- Configuration : variable d'environnement `ALLOWED_INTEGRATOR_ORIGINS`
- Contexte sécurité : `.claude/context/security-rules.md`
