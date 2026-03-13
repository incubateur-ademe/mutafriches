# Mutafriches - Instructions pour Claude Code

## Description du projet

Mutafriches est une API NestJS qui remplace un fichier Excel pour analyser la mutabilité des friches urbaines. Elle calcule des indices de mutabilité sur 7 usages différents et fournit un indice de fiabilité selon la précision des critères d'entrée.

Projet Beta.gouv / gouvernement français.

## Stack technique

- **Backend** : NestJS (TypeScript)
- **Base de données** : PostgreSQL avec PostGIS (données spatiales)
- **ORM** : Drizzle ORM
- **UI** : App react avec vite avec DSFR (Design System de l'État)
- **Package Manager** : pnpm (OBLIGATOIRE, jamais npm ou yarn)
- **Tests** : Vitest
- **Monorepo** : Structure avec apps/api, apps/ui, packages/shared-types

## Règles de code STRICTES

### 1. TypeScript - Typage explicite obligatoire

```typescript
// INTERDIT - génère @typescript-eslint/no-unsafe-assignment
const result = someApiCall();
const value = result.data;

// OBLIGATOIRE - cast explicite
const result = someApiCall() as ApiResponse<MyData>;
const value = result.data as MyData;
```

- TOUJOURS typer les paramètres et retours de fonction
- TOUJOURS utiliser `as Type` lors d'assignations depuis `any` ou `unknown`
- JAMAIS utiliser `any` sans cast explicite
- TOUJOURS importer les types nécessaires

### 2. Pas d'emojis/icônes dans le code

```typescript
// INTERDIT
console.log(`🏢 Intégrateurs: ${integrators.length}`);

// CORRECT
console.log(`Intégrateurs: ${integrators.length}`);
```

### 3. Accents français OBLIGATOIRES

Le code et les commentaires doivent respecter l'orthographe française avec tous les accents appropriés :

```typescript
// INTERDIT - accents manquants
const message = "Donnees recuperees avec succes";
// Configuration des etapes de qualification

// OBLIGATOIRE - accents corrects
const message = "Données récupérées avec succès";
// Configuration des étapes de qualification
```

**Accents courants à respecter :**

- **é** : données, récupéré, étape, créé, sélectionner, résultat, fiabilité, qualité
- **è** : critère, accès, précédent, problème, système
- **ê** : être, fenêtre, requête
- **à** : à (préposition), déjà, voilà
- **ô** : contrôle, bientôt, côté
- **ç** : français, façon, reçu
- **î** : maîtrise, connaître

Cette règle s'applique à :

- Tous les textes affichés à l'utilisateur (labels, messages, boutons)
- Les commentaires dans le code
- Les messages d'erreur
- Les tooltips et placeholders

### 4. Conventions de nommage

- Services : `*.service.ts`
- Controllers : `*.controller.ts`
- DTOs : `*.dto.ts`
- Entités : `*.entity.ts`
- Tests : `*.spec.ts`
- Calculateurs : `*.calculator.ts`

## Commandes courantes

```bash
# Setup initial
pnpm setup                  # Installation complète (env, dépendances, BDD, schéma)

# Développement
pnpm start:dev              # Lance API + UI en développement
pnpm dev:api                # API uniquement (NestJS watch mode)
pnpm dev:ui                 # UI uniquement (Vite dev server)

# Tests
pnpm test                   # Tests unitaires (Vitest)
pnpm test:watch             # Tests en mode watch
pnpm test:coverage          # Tests avec rapport de couverture

# Qualité de code
pnpm lint                   # Linter ESLint
pnpm format                 # Formatter Prettier
pnpm typecheck              # Vérification TypeScript
pnpm validate               # Tout vérifier (format + lint + typecheck + test)

# Build
pnpm build                  # Build complet (shared-types + API + UI)

# Base de données
pnpm db:start               # Démarrer PostgreSQL (Docker)
pnpm db:stop                # Arrêter PostgreSQL
pnpm db:reset               # Reset complet (supprime les données)
pnpm db:generate            # Générer les migrations Drizzle
pnpm db:migrate             # Appliquer les migrations
pnpm db:push                # Synchroniser le schéma directement
pnpm db:studio              # Interface Drizzle Studio

# Import de données
pnpm db:bpe:import          # Importer les données BPE (commerces INSEE)
pnpm db:transport-stops:import  # Importer les arrêts de transport
pnpm db:ademe-sites:import  # Importer les sites pollués ADEME
```

## Architecture

Le projet suit une architecture modulaire NestJS :

```
apps/api/src/
├── enrichissement/         # Enrichissement parcelles (24 APIs externes + 3 bases locales)
│   ├── adapters/           # Clients APIs externes (IGN, Enedis, GéoRisques, ZAER...)
│   ├── domains/            # Logique métier par domaine (cadastre, énergie, transport...)
│   ├── dtos/               # Objets de transfert
│   ├── entities/           # Entités domaine
│   └── repositories/       # Accès base de données
├── evaluation/             # Calcul mutabilité (matrice 24 critères × 7 usages)
│   ├── algorithme/         # Logique de calcul pure
│   ├── dtos/               # Objets de transfert
│   └── entities/           # Entités domaine
├── evenements/             # Tracking événements utilisateur
├── friches/                # DEPRECATED (routes historiques)
├── stats/                  # Endpoint KPIs publics
├── metabase/               # Intégration dashboard Metabase
├── shared/                 # Services, guards, database, utilitaires partagés
│   ├── database/           # Schémas Drizzle, migrations
│   └── guards/             # IntegrateurOriginGuard, OriginGuard
└── scripts/                # Scripts d'import de données (BPE, transport, ADEME)
```

## APIs externes intégrées

- **IGN Cadastre** (`cadastre.data.gouv.fr`) : données parcellaires, géométrie, surface
- **BDNB** (`api.bdnb.io`) : surface bâtie
- **Enedis** (`data.enedis.fr`) : distance raccordement électrique
- **GéoRisques** (`georisques.gouv.fr`) : 13 APIs risques (RGA, SIS, ICPE, cavités, inondation, CATNAT, etc.)
- **API Carto Nature** (`apicarto.ign.fr`) : zonages environnementaux (Natura 2000, ZNIEFF, Parcs)
- **API Carto GPU** (`apicarto.ign.fr`) : zonages patrimoniaux et réglementaires (PLU, Monuments)
- **IGN WFS** (`data.geopf.fr`) : voies de grande circulation (autoroutes)
- **ZAER WFS** (`data.geopf.fr`) : zones d'accélération des énergies renouvelables
- **API Service Public** (`service-public.fr`) : coordonnées mairies (centre-ville)
- **LOVAC** (`data.gouv.fr`) : taux de logements vacants
- **Bases locales PostGIS** : arrêts de transport (data.gouv), BPE INSEE (commerces), sites pollués ADEME

## Tests

- Fichiers de test à côté des fichiers source (`*.spec.ts`)
- Utiliser des fixtures pour les données de test
- Mock des APIs externes obligatoire
- Coverage minimum attendu : 80%

## Déploiement

- Plateforme : Scalingo
- CI/CD : GitHub Actions
- Environnements : review apps par PR

## Variables d'environnement

### Environnement d'exécution

- `NODE_ENV` : `development`, `staging`, ou `production`
  - `development` : Mode local, bypass de sécurité sur certains guards
  - `staging` : Environnement de pré-production
  - `production` : Environnement de production

### Sécurité des origines (API)

- `ALLOWED_INTEGRATOR_ORIGINS` : Liste des origines supplémentaires autorisées pour les intégrateurs (séparées par des virgules)
  - Origines par défaut : `mutafriches.beta.gouv.fr`, `mutafriches.incubateur.ademe.dev`, `benefriches.ademe.fr`, `benefriches.incubateur.ademe.dev`
  - En mode `development` : localhost autorisé automatiquement
  - Exemple : `ALLOWED_INTEGRATOR_ORIGINS=https://custom-domain.fr,https://autre-domaine.fr`

- `ALLOWED_ORIGINS` : Liste des origines autorisées pour les événements (tracking interne, séparées par des virgules)
  - Origines par défaut : `mutafriches.beta.gouv.fr`, `mutafriches.incubateur.ademe.dev`
  - Localhost autorisé uniquement en mode `development`
  - Note : Les intégrateurs (Benefriches, etc.) ne doivent PAS envoyer d'événements

### Comportement des guards

| Route | Guard | Dev | Staging/Prod |
|-------|-------|-----|--------------|
| POST /enrichissement | IntegrateurOriginGuard | Bypass | Origines whitelistées |
| POST /evaluation/calculer | IntegrateurOriginGuard | Bypass | Origines whitelistées |
| POST /friches/* (deprecated) | IntegrateurOriginGuard | Bypass | Origines whitelistées |
| POST /evenements | OriginGuard | localhost + Mutafriches | Mutafriches uniquement |

## Points d'attention

1. Les identifiants cadastraux français ont des formats complexes (DOM-TOM, Corse)
2. Coordonnées en Lambert 93 (EPSG:2154) pour la France métropolitaine
3. Données spatiales gérées via PostGIS
4. Conformité DSFR obligatoire pour l'UI
