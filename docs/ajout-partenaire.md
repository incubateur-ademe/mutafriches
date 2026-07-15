# Ajouter un nouveau partenaire — todolist

Procédure pas à pas pour publier une nouvelle page partenaire multisite
(`/partenaires/<slug>`). Le moteur est générique et piloté par registre : aucun composant
à dupliquer.

> État actuel : data **statique** (configs TypeScript). La bascule prévue vers une persistance
> en base (sites, noms éditables) est décrite dans l'ADR-0021
> (`docs/adr/0021-persistance-base-partenaires-sites.md`) et ne change pas cette procédure tant
> qu'elle n'est pas livrée. Détail technique des fichiers : `apps/ui/src/features/partenaires/README.md`.

## Pré-requis : récupérer la data du partenaire

- [ ] Obtenir la **liste des parcelles** (IDU cadastraux, 14 caractères) du partenaire.
  - **Partenaire sans IDU** (fichier avec seulement des coordonnées et/ou des numéros de
    parcelle, ex. inventaire SCET/CCPM) : résoudre les IDU réels via l'API Carto Cadastre.
    - Outil de mise au point ponctuel : page de test `/test/resolution-idu` (numéro de parcelle
      + INSEE, ou point WGS84).
    - Traitement par lot : script `apps/api/src/scripts/resolve-idu-scet.ts` (générique,
      moteur dans `apps/api/src/scripts/coord-to-idu/`). Il reprojette les coordonnées
      Lambert-93 → WGS84, résout chaque IDU par attributs (`code_insee`/section/numéro) et
      contre-vérifie par les coordonnées ; il génère directement `parcelles.ts` (UI) et
      `<slug>.ts` (backend), et un rapport d'audit `data/<slug>.resolved.json`. Adapter le
      chemin d'entrée/sortie pour un nouveau partenaire.
- [ ] Choisir un **`slug`** (minuscules, sans espace ; segment d'URL, ex. `aura`, `cci-92`).
- [ ] Définir le **regroupement en sites** : des parcelles partageant le même `idtup` forment
      un seul site (mono ou multi-parcelle).
  - Site mono-parcelle : `idtup = idpar` (l'identifiant cadastral).
  - Site multi-parcelles : `idtup` synthétique stable (ex. `ufAURA0001`, `aura-04`).
- [ ] Noter le **département** (code INSEE : `49`, `92`, `2A`, `971`…).

## 1. UI — obligatoire (rend la page et la carte visibles)

- [ ] Créer `apps/ui/src/features/partenaires/partners/<slug>/parcelles.ts`
      — `PartnerParcelle[]` (`idpar`, `commune`, `idtup`).
- [ ] Créer `apps/ui/src/features/partenaires/partners/<slug>/index.ts`
      — le `PartnerConfig` : `slug`, `nom`, `description`, `departement`,
      `storageKey` (**unique** par partenaire), `sites`, `sitesByCommune`.
- [ ] Modifier `apps/ui/src/features/partenaires/registry.ts`
      — importer le config et l'ajouter au tableau `PARTNERS`.

La route `/partenaires/<slug>` et la carte sur le hub `/partenaires` apparaissent alors
automatiquement (aucun changement de routing).

## 2. Prefetch API — recommandé (cache chaud), IDU réels uniquement

Le prefetch réchauffe le cache d'enrichissement pour que la première visite soit rapide.
N'ajouter ici qu'un partenaire dont les **IDU sont réels** (des identifiants fictifs feraient
échouer le pré-chauffe et l'alarme du cron).

- [ ] Créer `apps/api/src/scripts/partenaires/<slug>.ts`
      — `SitePrefetch[]` (`idtup`, `commune`, `parcelles`), miroir de la data UI.
- [ ] Modifier `apps/api/src/scripts/partenaires/registry.ts`
      — ajouter `"<slug>": <SLUG>_SITES` à `PARTENAIRES_PREFETCH`.

## 3. Production — si le partenaire appelle l'API directement

- [ ] Ajouter l'origine du partenaire à `ALLOWED_INTEGRATOR_ORIGINS` (variable d'env Scalingo)
      — aucun code à modifier (cf. `IntegrateurOriginGuard`).

## 4. Vérification

- [ ] `pnpm validate` (format + lint + typecheck + test) au vert.
- [ ] `/partenaires` affiche la carte du partenaire.
- [ ] `/partenaires/<slug>` charge ; un site s'enrichit et son indice de mutabilité se calcule.

## 5. Réchauffer le cache (par environnement, après déploiement)

Le pré-chauffe n'est pas lancé au `postdeploy` (coûteux). Le déclencher une fois par
environnement, après que les IDU réels soient en place :

```bash
# Tous les partenaires
scalingo --app <app> run "pnpm partenaires:prefetch"

# Un seul partenaire
scalingo --app <app> run "PARTENAIRE=<slug> pnpm partenaires:prefetch"
```

Un rafraîchissement périodique est par ailleurs assuré par le workflow GitHub
`.github/workflows/partenaires-prefetch.yml` (le TTL du cache serveur est de 24h).

## Conventions

- `slug` : minuscules, sans espace (segment d'URL). **Identique** côté UI et côté prefetch API.
- `storageKey` : unique par partenaire (sinon les sites ajoutés manuellement se mélangeraient).
- Le calcul utilise les routes API standard (`/enrichissement`, `/evaluation/calculer`) via les
  services partagés — rien de spécifique côté partenaire.

## Liens

- Détail des fichiers et exemples de code : `apps/ui/src/features/partenaires/README.md`
- ADR socle : `docs/adr/0015-pages-partenaires-multisites-mutualisees.md`
- ADR persistance en base (à venir) : `docs/adr/0021-persistance-base-partenaires-sites.md`
