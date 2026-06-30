# ADR-0021 : Persistance en base des partenaires et de leurs sites

**Date** : 2026-06-30
**Statut** : Accepté

## Contexte

Les pages partenaires multisites (cf. ADR-0015) sont aujourd'hui entièrement statiques :

- Les partenaires et leurs sites sont définis en dur côté UI (`apps/ui/src/features/partenaires/partners/<slug>/parcelles.ts` + `registry.ts`) et dupliqués côté API pour le prefetch (`apps/api/src/scripts/partenaires/`).
- Les sites ajoutés par l'utilisateur (« custom ») ne vivent qu'en `localStorage` (`apps/ui/src/features/partenaires/core/hooks/useCustomSites.ts`), donc par navigateur et non partagés.
- Les données complémentaires saisies et la mutabilité calculée ne sont qu'en mémoire de session (`MultisitePage.tsx`, refs `manualDataRef` / `mutabilityCacheRef`) : elles sont perdues au rafraîchissement de la page.
- Le `nom` d'un site n'est défini que pour les sites multi-parcelles statiques (= première parcelle, via `core/group.ts`), n'est pas éditable et ne porte aucun libellé de voie.
- L'`idtup` des sites custom multi-parcelles est instable (`custom-<timestamp>`, régénéré à chaque ajout).

De nouveaux besoins produit imposent de revoir ce socle :

- A. Disposer d'une vraie notion de nom de site.
- B. Nom par défaut = la rue la plus proche.
- C. Pouvoir modifier ce nom.
- D. Le dernier nom à jour fait foi lorsque plusieurs personnes éditent (multi-utilisateur).
- E. Sauvegarder les données manuelles d'un site et la mutabilité associée.

Le besoin D est déterminant : une source de vérité partagée entre plusieurs éditeurs est structurellement impossible en `localStorage` (les navigateurs sont isolés, aucune convergence). Il tranche le choix d'architecture.

## Décision

> Nous persistons les partenaires **et** leurs sites en base PostgreSQL (Drizzle ORM) pour couvrir l'ensemble des besoins, en réutilisant l'infrastructure existante (pattern repository, table `evaluations` qui stocke déjà les données complémentaires et les résultats de mutabilité, cache TTL 24h).

Le périmètre est entièrement en base (métadonnées partenaire incluses), afin de découpler l'onboarding d'un partenaire du déploiement front.

### Modèle de données (2 nouvelles tables)

- `partenaires` : `slug` (PK), `nom`, `description`, `departement`, `created_at`, `updated_at`.
- `partenaire_sites` : `id` (uuid PK), `partenaire_slug` (FK), `idtup` (stable : mono = identifiant cadastral, multi = clé dérivée des parcelles triées — fin du `custom-<timestamp>`), `parcelles` (jsonb), `commune`, `code_insee`, `nom` (nullable, éditable), `nom_defaut` (nullable, rue BAN), `origine` (`seed` | `custom`), `created_at`, `updated_at`, `updated_by` (nullable), `UNIQUE(partenaire_slug, idtup)`.

La table `partenaire_sites` ne porte que les données **partagées** (identité du site et nom). Source de vérité du nom (besoin D) : **last-write-wins** sur `updated_at`, sans verrou ni droits par utilisateur.

### Répartition de la persistance

| Donnée | Stockage | Pourquoi |
|---|---|---|
| Partenaires, sites, parcelles, nom du site | **Base** (`partenaires`, `partenaire_sites`) | Identité partagée, source de vérité multi-utilisateur (D) |
| Données manuelles « Connaissance terrain » + mutabilité associée | **localStorage** (par utilisateur) | Saisie subjective propre à chaque utilisateur ; survit au refresh sur l'appareil (E) |
| Enrichissement (cache) + évaluations (cache) | **Base existante** (`enrichissements`, `sites`, `evaluations`) | Cache serveur mutualisé déjà en place, inchangé |

Besoin E (« sauvegarder localement les données manuelles et la mutabilité liée ») : la saisie complémentaire et son résultat de mutabilité restent **en localStorage**, propres à l'utilisateur, en prolongeant le pattern de `useCustomSites`. La table `evaluations` continue de servir de **cache serveur** (TTL 24h, inchangé) pour éviter les recalculs, mais n'est pas la « sauvegarde utilisateur » : aucune donnée manuelle n'est rattachée au site partagé.

### Surface API

- `GET /partenaires/:slug` : métadonnées + sites.
- `POST /partenaires/:slug/sites` : ajoute un site (enrichit pour obtenir le centroïde, dérive le nom par défaut via BAN, persiste).
- `PATCH /partenaires/:slug/sites/:id` : renomme (last-write-wins).

Pas d'endpoint de sauvegarde de saisie : la « Connaissance terrain » et sa mutabilité restent en localStorage (cf. répartition ci-dessus). Le calcul de mutabilité passe par l'endpoint existant `POST /evaluation/calculer` (inchangé).

Écriture protégée par l'origine seule (`IntegrateurOriginGuard`), comme l'existant : pas de jeton par partenaire ni de login pour l'instant.

### Nom de la rue la plus proche

Reverse geocoding via BAN (`api-adresse.data.gouv.fr/reverse`). Le reverse geocoding n'existait pas côté API (uniquement côté UI pour le diagnostic IDU) ; le centroïde de la parcelle est fourni par l'enrichissement.

Le calcul du `nom_defaut` est intégré **directement dans le script de seed** (pas de script ni d'adapter Nest dédié pour l'instant), en deux temps : (1) upsert des partenaires/sites en SQL ; (2) pour chaque site sans `nom_defaut`, enrichissement (centroïde, qui réchauffe aussi le cache) puis BAN reverse. Best-effort : nécessite l'API en marche, tout échec laisse `nom_defaut` à `NULL` et un prochain passage réessaiera (idempotent). À la création d'un site via `POST` (phase 3), le même calcul sera fait dans la requête.

### Onboarding / seed et intégration du prefetch existant

Script idempotent `db:partenaires:seed` (upsert `partenaires` + `partenaire_sites`), lancé une fois par environnement via `scalingo run` sur le `dist/` compilé (cf. gotcha CLAUDE.md : `ts-node` indisponible en runtime Scalingo).

Le prefetch existant (`apps/api/src/scripts/prefetch-partenaires.ts`) réchauffe le cache d'enrichissement en appelant `POST /enrichissement?acceptDegradedCache=true` pour chaque site, à partir du registry statique `apps/api/src/scripts/partenaires/registry.ts`. Il est intégré ainsi :

- **Source de seed** = ce registry statique (déjà au format `idtup` / `commune` / `parcelles`) : le seed le lit et upsert dans `partenaire_sites`. Lignage clair : registry → seed → base.
- **Le prefetch lit ensuite la base** (`partenaire_sites`) au lieu du registry statique, devenant la source unique. Les sites « custom » ajoutés par les utilisateurs (`origine = custom`) sont donc réchauffés au prochain passage du prefetch, sans modification du script.
- **`POST /partenaires/:slug/sites` réchauffe le cache comme effet de bord** : l'ajout enrichit déjà le site pour obtenir le centroïde (nécessaire à BAN), ce qui peuple `enrichissements`/`sites`. Pas de double appel.
- Le registry statique `scripts/partenaires/` pourra être retiré une fois la base seedée sur tous les environnements (nettoyage en fin de Phase 3).

## Options envisagées

### Option A — Partenaires et sites en base (retenue)

- Avantages : couvre tous les besoins, dont la source de vérité multi-éditeurs (D) ; persistance cross-device (E) ; onboarding sans redéploiement front ; noms par défaut calculés côté serveur (BAN) ; `idtup` stables ; auditabilité ; réutilise la table `evaluations`.
- Inconvénients : 2 tables et migrations à maintenir ; bascule UI `localStorage` → API à gérer ; nouvelle dépendance externe (BAN).

### Option B — Sans base (tout en localStorage)

- Avantages : aucun changement back ; simple ; survie au refresh possible ; édition de nom mono-utilisateur.
- Inconvénients : **ne couvre pas le besoin D** (multi-utilisateur impossible entre navigateurs isolés) ; pas de cross-device ; pas d'onboarding hors déploiement. Rejetée car ne satisfait pas une exigence dure.

## Conséquences

### Positives

- Tous les besoins A–E couverts.
- Onboarding d'un partenaire découplé du déploiement front.
- `idtup` stables (fin du `custom-<timestamp>`).
- Réutilisation de la table `evaluations` comme cache serveur (pas de duplication de la logique de mutabilité).
- Répartition nette : identité partagée en base, saisie subjective en local — modèle simple, table `partenaire_sites` allégée.
- Prefetch existant conservé et intégré (base comme source unique, custom sites réchauffés automatiquement).

### Négatives / Risques

- 2 nouvelles tables + migrations Drizzle à maintenir.
- Nouvelle dépendance API externe (BAN) — atténuée par le pattern `ApiResponse<T>` (jamais bloquant, fallback commune) et le calcul une seule fois.
- Endpoints d'écriture non authentifiés au-delà de l'origine : risque d'édition non maîtrisée, accepté pour l'instant et revisitable (jeton par partenaire) si abus.
- Last-write-wins : un nom peut être écrasé sans avertissement (pas de concurrence optimiste dans cette version).

### Migration

Livraison en 3 phases, chacune laissant `pnpm validate` vert et livrable indépendamment :

1. **Fondation lecture** : tables + migration + script de seed depuis le registry de prefetch + `GET /partenaires/:slug` ; l'UI lit les sites via l'API avec fallback statique le temps de la bascule ; le prefetch bascule sur la base comme source.
2. **Noms éditables + source de vérité** : `nom_defaut` calculé dans le seed (enrichissement + BAN reverse) ; `PATCH` rename (LWW) ; branchement du bouton « Modifier site ».
3. **Ajout de site en base + persistance locale de la saisie** : `POST` add-site (en base, réchauffe le cache) ; migration best-effort des sites `localStorage` existants vers la base ; persistance localStorage des données manuelles « Connaissance terrain » + mutabilité (extension de `useCustomSites`) pour survivre au refresh. Nettoyage du registry statique `scripts/partenaires/` une fois la base seedée partout.

## Liens

- ADR-0015 : `docs/adr/0015-pages-partenaires-multisites-mutualisees.md` (socle des pages partenaires)
- ADR-0009 : `docs/adr/0009-cache-evaluation-24h.md` (cache et table `evaluations` réutilisée)
- ADR-0011 : `docs/adr/0011-securisation-origin-guard-sans-api-key.md` (modèle de sécurité par origine)
- ADR-0016 : `docs/adr/0016-configuration-centralisee-appconfig.md` (config des variables d'environnement, ex. URL BAN)
- Code UI : `apps/ui/src/features/partenaires/` (types, registry, `useCustomSites`, `MultisitePage`, `SiteDetail`, `AddSiteModal`)
- Code API : `apps/api/src/shared/database/schemas/` (schémas Drizzle), `apps/api/src/evaluation/repositories/evaluation.repository.ts`, `apps/api/src/scripts/partenaires/`, `apps/api/src/enrichissement/adapters/` (pattern adapter pour BAN)
- API externe : Base Adresse Nationale — https://api-adresse.data.gouv.fr/reverse/
- Issue : #XXX
- PR : #XXX
