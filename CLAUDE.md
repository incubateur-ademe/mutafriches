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

### 5. Commentaires : simples et brefs

Les commentaires doivent être **courts** et n'expliquer que le **pourquoi** (jamais le quoi évident).

```typescript
// INTERDIT - verbeux, paraphrase le code, multi-lignes inutiles
/**
 * Cette fonction prend en entrée un Site déjà enrichi et applique
 * successivement toutes les règles de scoring de la matrice 27×7
 * pour produire en sortie un objet contenant les indices de mutabilité
 * pour chacun des 7 usages possibles.
 */
export function calculer(site: Site): MutabiliteResult { ... }

// CORRECT - bref, va à l'essentiel
// Calcule les indices des 7 usages. Matrice : algorithme/algorithme.config.ts
export function calculer(site: Site): MutabiliteResult { ... }
```

Règles :

- Pas de commentaires qui paraphrasent le code (le code est déjà lisible).
- Pas de docblocks JSDoc longs sauf si la fonction a une sémantique non évidente.
- Un commentaire d'une ligne suffit dans 90 % des cas.
- Préférer un nom de variable/fonction explicite à un commentaire d'explication.
- Référencer la source (chemin de fichier, version d'algorithme, ticket) en une ligne, pas en paragraphe.

### 6. CSS : DSFR + Tailwind, pas de CSS custom

Pour toute UI (`apps/ui/`), **ordre de priorité strict** :

1. **DSFR** (`@gouvfr/dsfr` 1.14+) — classes `fr-*`, composants documentés sur [systeme-de-design.gouv.fr](https://www.systeme-de-design.gouv.fr/). C'est le défaut absolu pour layout, formulaires, boutons, badges, alertes, etc.
2. **Tailwind CSS** (v4) — uniquement pour les ajustements utilitaires que le DSFR ne couvre pas (espacements fins, grille spécifique, responsive ponctuel).
3. **CSS custom** (fichier `.css` dédié ou inline) — **uniquement** si DSFR + Tailwind ne suffisent pas, et **après avoir justifié** dans un commentaire pourquoi.

```tsx
// CORRECT — DSFR pour la structure, Tailwind pour le détail
<div className="fr-card fr-card--shadow flex items-center gap-2">
  <span className="fr-badge fr-badge--success">Mutabilité élevée</span>
</div>

// INTERDIT — CSS inline alors qu'une classe DSFR existe
<div style={{ padding: 16, border: "1px solid #ddd" }}>...</div>

// TOLÉRÉ — uniquement si justifié
<div
  className="fr-grid-row"
  // Hauteur min imposée par la maquette de la carte interactive, non couverte par DSFR
  style={{ minHeight: "320px" }}
>
```

Règles :

- Ne jamais réinventer un composant DSFR existant (callout, alert, accordion, badge, etc.).
- En cas de doute, chercher d'abord dans la doc DSFR avant d'écrire du Tailwind.
- Si une override de style DSFR est nécessaire, utiliser `mt-0!` (Tailwind v4 important, syntaxe suffixe) plutôt qu'un fichier CSS séparé.
- Pas de framework UI tiers (Material UI, Chakra, etc.) — la conformité Beta.gouv impose DSFR.

## Workflow obligatoire

### Découpage et livraison d'une feature

Pour **chaque feature identifiée** (un groupe cohérent de modifications, typiquement une nouvelle conversation) :

- **Découper en commits** atomiques et cohérents (un commit = une étape qui laisse `pnpm validate` vert).
- **Réutiliser / mutualiser** le code existant dès que possible plutôt que de dupliquer (composants, services, types partagés).
- **Justifier les choix** : dans la description des commits (le pourquoi), et via un ADR (`/adr`) si le choix est architecturalement significatif.
- **Auditer les vulnérabilités** (voir section dédiée) : lancer `pnpm audit` sur toute feature qui touche aux dépendances.
- **Vérifier le `README.md`** : à chaque feature, contrôler si le README doit être mis à jour (nouvelle commande, nouvelle source de données, changement d'installation/déploiement, nouvelle route). Ne le modifier que si un élément documenté a réellement changé — pas de doc superflue.
- **Vérifier la doc des sources de données** : si la feature ajoute, retire ou modifie une source d'enrichissement (nouvelle API/base, changement des champs récupérés ou de leur traitement), mettre à jour `SOURCES_DONNEES` (`packages/shared-types/src/documentation/sources-donnees.data.ts`) **dans le même commit**, puis régénérer le Markdown avec `pnpm docs:sources:gen` (rebuild `shared-types` au préalable). La page UI `/documentation-donnees` et l'export PDF en découlent automatiquement (source de vérité unique, cf. ADR-0026) — ne jamais éditer le `.md` à la main.
- **Proposer à l'utilisateur des tests manuels E2E côté UI** à réaliser lui-même, en fin de feature : un parcours pas à pas couvrant le comportement attendu.

### Vérification post-implémentation

Après toute implémentation ou modification de code, TOUJOURS lancer la vérification complète :

```bash
pnpm format && pnpm lint && pnpm typecheck && pnpm test
```

Si des erreurs apparaissent, les corriger immédiatement et relancer jusqu'à ce que tout passe. Ne JAMAIS considérer une tâche comme terminée sans cette vérification.

### Audit de sécurité des dépendances

À **chaque feature** (groupe de commits) qui ajoute, met à jour ou remplace une dépendance, vérifier les vulnérabilités :

```bash
pnpm audit              # Toutes les dépendances
pnpm audit --prod       # Isole le périmètre runtime (hors devDependencies)
```

- Toute vulnérabilité **nouvelle ou acceptée** doit être tracée dans `docs/security/vulnerabilites-acceptees.md` avec : sévérité, paquet et chemin transitif, et **justification d'acceptation** (faux positif, non exploitable dans notre contexte) **ou plan de correction** (version cible, échéance).
- Ne PAS accepter silencieusement une vulnérabilité : soit elle est corrigée (bump), soit elle est tracée avec justification.
- Créer le fichier de suivi s'il n'existe pas encore, en suivant ce format.

### Version de l'application

Quand une **feature est terminée et vérifiée**, il est recommandé d'incrémenter la version de l'application dans le `package.json` racine via un **commit dédié** (séparé du commit de la feature).

- Versionnage **SemVer** : `feat` → bump **mineur** (`1.11.0` → `1.12.0`), `fix` → bump **patch** (`1.11.0` → `1.11.1`), changement cassant → bump **majeur**.
- Seul le `package.json` racine porte la version (les sous-packages n'en ont pas).
- Commit dédié : `chore(release): vX.Y.Z`.
- Ne PAS confondre avec le versionnage de l'algorithme de mutabilité (voir section dédiée), qui est indépendant.

### ADR automatique

Quand une tâche implique un **choix architectural significatif**, créer automatiquement un ADR dans `docs/adr/` via le skill `/adr`. Déclencheurs :

- Ajout ou remplacement d'une dépendance majeure
- Nouveau pattern de code (nouveau type de service, nouvelle convention)
- Changement d'infrastructure ou de déploiement
- Choix entre plusieurs approches avec des compromis

Ne PAS créer d'ADR pour les corrections de bugs, refactorings mineurs ou fonctionnalités qui suivent un pattern existant.

### Commits : simples et conventionnels

Suivre **Conventional Commits** : un titre court, une seule ligne de description.

Format :

```
<type>(<scope?>): <titre court à l'impératif>

<description en une seule ligne, le pourquoi plus que le quoi>
```

**Types courants** : `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`, `perf`, `build`, `ci`.

**Exemples** :

```
feat(algo): publication v1.10 avec correction matrice ZAER

Corrige les scores ZAER pour le photovoltaïque suite à validation avec la formule Excel de référence.
```

```
fix(enrichissement): timeout API GéoRisques porté à 15s

Les requêtes RGA sur certaines communes dépassaient les 10s par défaut et déclenchaient des sources échouées non justifiées.
```

```
docs(adr): justifie le passage à Drizzle ORM

Tradeoffs vs TypeORM et raisons du choix pour le contexte PostGIS.
```

Règles :

- Titre **sous 70 caractères**, à l'impératif, en minuscules.
- **Une seule ligne** de description (pas de listes à puces, pas de paragraphes).
- Préférer le **pourquoi** au quoi (le diff montre déjà le quoi).
- **Aucune mention d'auteur ou de co-auteur** dans le corps du commit (pas de `Co-Authored-By`, pas de `Generated with`, etc.). L'auteur git suffit.
- Committer uniquement à la demande explicite de l'utilisateur.
- **Ne jamais `git push`** (ni `push --force`, ni création/mise à jour de PR distante) : les push sont gérés **exclusivement par l'utilisateur**. Se limiter au commit local.

### Compaction du contexte

Lors de la compaction automatique ou manuelle (`/compact`), TOUJOURS préserver :
- La liste des fichiers modifiés dans la session
- Les commandes de test et vérification à relancer
- Les Gotchas rencontrés pendant la session
- Les décisions architecturales prises

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
pnpm db:lovac:import        # Importer le référentiel LOVAC (logements vacants par commune)
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
├── evaluation/             # Calcul mutabilité (matrice 27 critères × 7 usages)
│   ├── algorithme/         # Logique de calcul pure
│   ├── dtos/               # Objets de transfert
│   └── entities/           # Entités domaine
├── evenements/             # Tracking événements utilisateur
├── stats/                  # Endpoint KPIs publics
├── metabase/               # Intégration dashboard Metabase
├── shared/                 # Services, guards, database, utilitaires partagés
│   ├── database/           # Schémas Drizzle, migrations
│   └── guards/             # IntegrateurOriginGuard, OriginGuard
└── scripts/                # Scripts d'import de données (BPE, transport, ADEME)
```

## Versionnage de l'algorithme de mutabilité

L'algorithme de scoring est versionné pour préserver la reproductibilité des évaluations passées et permettre la comparaison entre versions.

- **Source de vérité** : `apps/api/src/evaluation/services/algorithme/versions/` — un fichier par version (`v1.1.ts`, `v1.2.ts`, …), agrégés par `index.ts` (tableau chronologique ascendant, **dernière entrée = version courante**, pointée par `VERSION_COURANTE`). C'est aussi l'ordre renvoyé par `GET /evaluation/algorithme/versions`.
- **Référence métier** : chaque version doit pointer vers le fichier Excel de référence correspondant (matrice 27×7), conservé dans `docs/sources/` (ou équivalent)
- **Exposition** : la version courante et la liste complète sont exposées via `GET /evaluation/metadata` et `GET /evaluation/algorithme/versions`. Toute modification doit **immédiatement** se refléter dans ces endpoints (et dans les exemples Swagger associés).
- **Documentation OBLIGATOIRE** : toute modification de l'algorithme — ajout ou retrait d'un critère, changement de poids, de seuil, de la matrice de scoring, ou de la formule de fiabilité — DOIT être répercutée **dans le même commit** sur :
  - `docs/evaluation-mutabilite.md` (doc métier : liste des critères, poids, poids total, formules, exemples)
  - `.claude/context/evaluation-patterns.md` (doc technique : nombre de critères, répartition enrichis/complémentaires, poids total, sémantique)
  - `packages/shared-types/src/recapitulatif/criteres.metadata.ts` (`CRITERES_METADATA` : le `poids` de chaque critère mirroir `POIDS_CRITERES` — un garde-fou casse en cas de divergence), puis régénérer `docs/sources-donnees-externes.md` via `pnpm docs:sources:gen` (la page `/documentation-donnees` et le PDF en découlent, cf. ADR-0026)

  La **source de vérité** est `POIDS_CRITERES` dans `algorithme.config.ts`. Une doc dont le nombre de critères, les poids ou le poids total divergent de `POIDS_CRITERES` est considérée comme un **bug**. Ne JAMAIS livrer un changement d'algo sans avoir mis à jour ces fichiers.

### Procédure pour publier une nouvelle version

Quand une nouvelle version d'algorithme entre en vigueur :

1. Copier les sources datées (Excel, notes de calcul) dans `docs/sources/`
2. Créer un fichier `vX.Y.ts` dans `versions/` avec `dateEffet` (ISO), `description`, `changements`, `pullRequest`, lien vers la source
3. Adapter les règles (`algorithme.config.ts`, calculateurs) jusqu'à `pnpm test` vert
4. **Ajouter l'entrée en fin de l'export agrégé** dans `versions/index.ts` (ordre chronologique ascendant strict) et mettre à jour `VERSION_COURANTE`
5. Mettre à jour les exemples Swagger qui exposent la version (`metadata.dto.ts`, `evaluation.dto.ts`)
6. **Mettre à jour la doc de l'algorithme** (`docs/evaluation-mutabilite.md` + `.claude/context/evaluation-patterns.md`) : critères, poids, poids total, fiabilité — en cohérence stricte avec `POIDS_CRITERES`
7. `pnpm validate`
8. Commit : `feat(algo): publication vX.Y avec <résumé>`

Le test dédié (`versions.spec.ts`) garantit l'ordre chronologique ascendant strict, le format ISO des dates, l'unicité des versions et que `VERSION_COURANTE` correspond à la dernière entrée du registre.

**Règle d'or** : ne JAMAIS hardcoder la version d'algorithme dans la doc ou les exemples Swagger — toujours la lire dynamiquement depuis `versions/index.ts`. Une version désynchronisée entre code et doc casse la confiance des intégrateurs.

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
- **Bases locales PostGIS** : arrêts de transport (data.gouv), BPE INSEE (commerces), sites pollués ADEME
- **Référentiel local LOVAC** (`raw_lovac`) : taux de logements vacants par commune, importé annuellement (`pnpm db:lovac:import`) — remplace l'appel live data.gouv.fr, rate-limité sous charge (cf ADR)

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

Toutes les variables sont lues via la classe centralisée **`AppConfig`** (`apps/api/src/config/`), validée au démarrage (fail-fast). Ne JAMAIS lire `process.env` directement dans un service : injecter `AppConfig` ou utiliser `getAppConfig()` (singleton, pour les scripts hors DI). Ajouter une nouvelle variable = l'ajouter dans `env.validation.ts` (décorateur de validation) puis exposer un getter typé dans `app.config.ts`. Voir ADR-0016.

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
| POST /evenements | OriginGuard | localhost + Mutafriches | Mutafriches uniquement |

### Contact multisites (calendrier ZCal)

La modale « Analyser plusieurs sites » (page résultats) embarque un **calendrier ZCal** en iframe pour la prise de rendez-vous (cf. ADR-0020). **Aucune donnée nominative n'est collectée ni stockée**, et l'application **n'envoie plus d'e-mails transactionnels** (la brique `mailer/`, le module `contact/` et la table `demandes_contact` ont été supprimés). L'ouverture de la modale reste tracée (`OUVERTURE_MODALE_MULTISITES`, sans PII).

- `VITE_ZCAL_URL` (UI) : URL du calendrier ZCal embarqué (défaut : calendrier de l'équipe). Config dans `apps/ui/src/shared/config/zcal.config.ts`.
- Réintroduire un envoi d'e-mails imposerait de recréer une brique dédiée : voir les ADR-0015 / 0017 (remplacés) comme référence d'implémentation.

## Documentation contextuelle

- @.claude/context/enrichissement-patterns.md — Comment ajouter un nouveau domaine ou une nouvelle API externe
- @.claude/context/security-rules.md — Checklist sécurité (secrets, validation, injection SQL, guards)
- @.claude/context/feature-example.md — Parcours complet d'ajout d'une source d'enrichissement
- @.claude/context/evaluation-patterns.md — Algorithme de scoring (matrice 27×7), fiabilité, cache, sémantique `null` vs `undefined`

## Gotchas

Pièges rencontrés en session. Chaque entrée documente un piège pour éviter d'y retomber.

### `dist` de shared-types périmé → tests API en échec fantôme

- Les tests de l'API résolvent `@mutafriches/shared-types` depuis son **`dist` compilé** (le `vitest.config.ts` de l'API n'aliase que `@` → `/src`, pas le package). Un `dist` obsolète fait donc échouer des tests API sur des symptômes trompeurs (ex. `criteres-metadata.guard.spec.ts` : `CRITERES_METADATA` vs `POIDS_CRITERES` désalignés alors que les **sources** sont cohérentes).
- Le build **incrémental** (`pnpm --filter shared-types build`) ne régénère pas toujours les fichiers modifiés. En cas de doute, forcer un build propre : `rm -rf packages/shared-types/dist && pnpm --filter shared-types build`.
- Avant de conclure à un bug de source suite à un échec de test API portant sur un type/constante partagé, **rebuild proprement shared-types** et relancer. `pnpm validate` ne rebuild pas shared-types : le faire en amont si les types partagés ont changé.

### Identifiants cadastraux

- Les identifiants Corse utilisent `2A` / `2B` au lieu de `20` dans le code département
- Les DOM-TOM ont des formats spécifiques (3 chiffres département : `971`, `972`, etc.)
- Le format complet fait 14 caractères : `DDDCCCSSNNNNPP` (département, commune, section, numéro, parcelle)
- TOUJOURS valider le format avant d'appeler les APIs cadastrales

### Fiabilité : sémantique `null` vs `undefined`

- `null` = recherche effectuée, aucun résultat → **compte comme renseigné** (contribue à la fiabilité)
- `undefined` = donnée indisponible (erreur technique) → **ne compte pas**
- `"ne-sait-pas"` = réponse utilisateur explicite → **ne compte pas**
- Ne JAMAIS confondre `null` et `undefined` dans le calcul de fiabilité

### Score NEUTRE dans l'algorithme

- Le score `NEUTRE = 0.5` est ajouté **simultanément** aux avantages ET aux contraintes
- C'est un comportement intentionnel qui reproduit le fichier Excel original
- Ne PAS modifier ce comportement sans valider avec la formule Excel de référence

### Mutation du Site

- Les services d'enrichissement **mutent directement** l'objet `Site` passé en paramètre
- C'est un pattern volontaire (pas de retour de données, mutation in-place)
- Le `Site` traverse tout le pipeline : enrichissement → évaluation → persistance

### Cache d'évaluation

- Si les données complémentaires contiennent `"ne-sait-pas"` → **pas de mise en cache** (résultat partiel)
- Le cache compare les 10 champs complémentaires un par un (pas de hash)
- TTL de 24 heures, basé sur le `siteId` (identifiant cadastral)

### PostGIS et coordonnées

- Les coordonnées en entrée sont en WGS84 (EPSG:4326 — latitude/longitude)
- Les calculs spatiaux PostGIS utilisent le SRID 4326
- Lambert 93 (EPSG:2154) est utilisé pour certaines distances métriques
- TOUJOURS valider les coordonnées (latitude -90/+90, longitude -180/+180) avant les requêtes PostGIS

### Pattern `ApiResponse<T>` des adapters

- Les adapters ne doivent JAMAIS throw — ils retournent `{ success: false, error: ... }`
- TOUJOURS mesurer le `responseTimeMs` pour le monitoring
- TOUJOURS configurer un `timeout` sur les appels HTTP (10s par défaut)

### Déploiement Scalingo — review apps, migrations et scripts d'import

- Les review apps par PR (`mutafriches-preprod-prXXX`) ont une **base de données éphémère créée à la volée** par Scalingo (clone de l'app parente au moment de la création de la PR). Tester une migration sur une review app **ne reflète pas** ce qui se passera en production : la DB de la review app peut être quasi-vide ou contenir un snapshot daté.
- Pour valider une migration avant un merge en main, **toujours** :
  1. La rejouer sur la DB locale restaurée depuis un backup de prod (`bash .local/restore-db.sh <backup>.tar.gz`)
  2. Vérifier les requêtes/jointures contre la volumétrie réelle
- **`ts-node` ne fonctionne PAS en runtime sur Scalingo** : il est en `devDependencies` et Scalingo le supprime au `Pruning devDependencies` (changement de buildpack autour de pnpm 10.x). Tous les scripts CLI (imports, prefetch, etc.) doivent être appelés sur la version compilée par `nest build` :
  ```json
  "db:epci:import": "node dist/src/scripts/import-epci-communes.js"
  ```
  Pas de `ts-node -r tsconfig-paths/register src/scripts/...ts` qui ne tournera qu'en dev (et même en dev il faut avoir un `dist/` à jour : `pnpm --filter api build:nest`). En prod, Scalingo a compilé `dist/` au build avant le prune, donc tout est disponible.
- Les scripts d'import de référentiels (`db:bpe:import`, `db:epci:import`, etc.) **ne sont pas** lancés par le `postdeploy` (ils sont coûteux et idempotents) : à exécuter une fois par environnement via `scalingo --app <app> run "pnpm db:xxx:import"`.
- Le `postdeploy` hook ne contient que `pnpm db:migrate` (qui appelle `drizzle-kit`, lui en `dependencies` donc non pruné).

## Points d'attention

1. Les identifiants cadastraux français ont des formats complexes (DOM-TOM, Corse)
2. Coordonnées en Lambert 93 (EPSG:2154) pour la France métropolitaine
3. Données spatiales gérées via PostGIS
4. Conformité DSFR obligatoire pour l'UI
