# ADR-0015 : Pages partenaires multisites mutualisées

**Date** : 2026-06-03
**Statut** : Accepté

## Contexte

Mutafriches propose à certains partenaires une page dédiée listant les friches de leur
territoire (sélection d'un site, enrichissement, saisie des données complémentaires, calcul de
mutabilité). La première a été développée pour la CCI Hauts-de-Seine dans
`apps/ui/src/features/cci92/` : une page, une liste de sites, un panneau de détail, une modale
d'ajout, un hook de sites personnalisés, un fichier de data, et une route dédiée.

L'arrivée d'un nouveau partenaire (AURA, Agence d'urbanisme de la région angevine) puis d'autres
ensuite imposait, en l'état, de **dupliquer l'intégralité de la feature** par copier-coller en
ne changeant que la data et quelques libellés. Ce schéma multiplie la dette à chaque partenaire
et fait diverger les comportements (un correctif appliqué à un partenaire est oublié sur les
autres).

Le constat clé : les composants, le hook, l'orchestration et le routing sont **identiques** d'un
partenaire à l'autre. Le seul vrai spécifique est la **liste de parcelles**, quelques
**libellés** et une **clé de stockage**.

## Décision

> Nous mutualisons les pages partenaires en un moteur générique piloté par un registre, avec une
> route dynamique unique et une organisation « un dossier par partenaire ».

Concrètement, la feature `cci92/` devient `apps/ui/src/features/partenaires/` :

- Un **moteur partagé** `core/` : composants (`SiteList`, `SiteDetail`, `DonneesForm`,
  `AddSiteModal`), hook (`useCustomSites`), pages (`MultisitePage` orchestrateur,
  `PartenairesPage` hub), types (`PartnerConfig`, `PartnerSite`, `PartnerParcelle`) et helpers de
  groupement. Le moteur ne dépend d'aucun partenaire.
- Un **dossier autonome par partenaire** `partners/<slug>/` : `parcelles.ts` (la data) et
  `index.ts` exportant un `PartnerConfig`.
- Un **registre** `registry.ts` (`PARTNERS[]`), source unique de vérité, consommé par le hub et
  par la résolution de route.
- Une **route dynamique unique** `/partenaires/:slug` (`ROUTES.PARTENAIRE_DETAIL`).
  `MultisitePage` résout le partenaire via `getPartnerBySlug()` et remonte l'orchestrateur avec
  `key={slug}` pour repartir d'un état propre par partenaire.

Précision de vocabulaire : ce découpage n'est **pas du DDD**. Un partenaire n'est pas un
*bounded context* mais une **instance de configuration** du même domaine « partenaires
multisites ». Il s'agit donc d'une organisation *package-by-instance* (colocation), pas d'un
découpage par domaine métier.

## Options envisagées

### Option A — Moteur générique + registre + route dynamique + dossier par partenaire (retenue)

- Avantages : ajouter un partenaire = 1 dossier data + 1 ligne de registre, zéro composant et
  zéro route à écrire ; comportement strictement identique entre partenaires (un seul code) ;
  colocation forte (tout un partenaire au même endroit, facile à ajouter/supprimer/retrouver) ;
  le dossier accueille un éventuel besoin spécifique futur (logo, libellés, override).
- Inconvénients : une indirection (config + registre) à comprendre au départ ; un dossier +
  `index.ts` même pour de la pure data.

### Option B — Page et route dédiées dupliquées par partenaire

- Avantages : aucune abstraction, chaque page totalement libre.
- Inconvénients : duplication massive à chaque partenaire ; divergence des comportements et des
  correctifs ; coût de maintenance croissant. Écartée.

### Option C — Routes explicites par partenaire (au lieu de la route dynamique)

- Avantages : routes listées explicitement dans `App.tsx`.
- Inconvénients : il faut éditer `App.tsx` et `routes.config.ts` à chaque partenaire ; plus
  verbeux pour aucun gain réel. Écartée au profit de `/partenaires/:slug`.

### Option D — Data à plat dans un unique dossier `data/`

- Avantages : cérémonie minimale (un fichier par partenaire).
- Inconvénients : colocation faible (data ici, reste ailleurs) ; n'accueille pas proprement un
  spécifique partenaire. Écartée au profit de `partners/<slug>/`.

## Conséquences

### Positives

- Onboarding d'un partenaire réduit à de la configuration (data + une entrée de registre).
- Un seul code à maintenir et à tester pour tous les partenaires.
- Hub `/partenaires` alimenté automatiquement par le registre.

### Négatives / Risques

- La `storageKey` doit être **unique par partenaire** : une collision mélangerait les sites
  ajoutés manuellement entre partenaires.
- Le `slug` du registre doit rester cohérent avec l'URL communiquée aux partenaires.
- Le préchauffage du cache côté API est généralisé (`apps/api/src/scripts/prefetch-partenaires.ts`
  + registre `partenaires.prefetch-data.ts`, keyé par slug) : il garde une liste miroir des
  parcelles, à maintenir en cohérence avec la data UI. Le slug du registre prefetch doit
  correspondre au slug UI.

### Migration (réalisée)

1. Création de `features/partenaires/core/` (composants, hook, pages, types, helpers, CSS
   renommée `mf-ms-*`) à partir de l'ancienne feature.
2. Création de `partners/cci92/` (`parcelles.ts` + `index.ts` → `CCI92_CONFIG`) et du
   `registry.ts`.
3. Route dynamique `/partenaires/:slug` dans `App.tsx` ; helper `partenaireRoute(slug)` et
   constante `ROUTES.CCI_92` conservée (l'URL `/partenaires/cci-92` reste inchangée).
4. Suppression de `features/cci92/`.
5. `pnpm format && pnpm lint && pnpm typecheck && pnpm test` au vert.

## Liens

- Moteur : `apps/ui/src/features/partenaires/core/`
- Partenaires : `apps/ui/src/features/partenaires/partners/<slug>/`
- Registre : `apps/ui/src/features/partenaires/registry.ts`
- Routing : `apps/ui/src/App.tsx`, `apps/ui/src/shared/config/routes.config.ts`
- Recette d'ajout d'un partenaire : `apps/ui/src/features/partenaires/README.md`
- Préchauffage API : `apps/api/src/scripts/prefetch-partenaires.ts`, `partenaires.prefetch-data.ts`, `.github/workflows/partenaires-prefetch.yml`
