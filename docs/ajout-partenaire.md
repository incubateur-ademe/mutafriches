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
    parcelle, ex. inventaire SCET/CCPM, inventaires EODD) : résoudre les IDU réels via l'API
    Carto Cadastre.
    - Outil de mise au point ponctuel : page de test `/test/resolution-idu` (numéro de parcelle
      + INSEE, ou point WGS84).
    - Traitement par lot : script `apps/api/src/scripts/resolve-idu-partenaire.ts` (moteur dans
      `apps/api/src/scripts/coord-to-idu/`). Il résout chaque IDU par attributs
      (`code_insee`/section/numéro), contre-vérifie par les coordonnées quand la source en
      fournit (reprojection Lambert-93 → WGS84), et génère directement `parcelles.ts` (UI) et
      `<slug>.ts` (backend), plus un rapport d'audit `data/<slug>.resolved.json`.
      ```bash
      # 1. décrire le partenaire dans coord-to-idu/partenaires.config.ts
      # 2. déposer l'inventaire anonymisé dans coord-to-idu/data/<slug>.input.json
      pnpm --filter api build:nest
      PARTENAIRE=<slug> pnpm partenaires:resolve-idu
      ```
    - **Ni IDU ni coordonnées** (seulement « commune + numéros de parcelle ») : renseigner
      `departement` dans le descripteur, le code INSEE est résolu depuis le nom de commune via
      la BAN. Sans coordonnées, la contre-vérification saute : relire le rapport d'audit site
      par site, le statut `OK` n'y atteste que la résolution par attributs.
    - Vérifier le rapport **avant** de commiter : tout site en `ECHEC` ou `PARTIEL` est à
      arbitrer à la main. Un IDU inventé ferait échouer la pré-chauffe et afficherait une
      parcelle fausse à l'utilisateur.
- [ ] **Réconcilier avec le cadastre courant** (ADR-0044). Les fichiers fonciers ont souvent un
      millésime de retard : une parcelle divisée ou renumérotée depuis est écartée par
      l'enrichissement, ce qui réduit la carte, la surface et fausse les indices. Une fois
      `apps/api/src/scripts/partenaires/<slug>.ts` en place :
      ```bash
      pnpm --filter api build:nest
      PARTENAIRE=<slug> pnpm partenaires:reconcilier-cadastre
      ```
      Le rapport `cadastre-successeurs/data/<slug>.rapport.json` propose, pour chaque site
      touché, les parcelles actuelles qui remplacent les disparues (`parcellesApres`). Arbitrer à
      la main toute couverture inférieure à 100 % ou parcelle `ecartes`, puis reporter les
      listes dans les fichiers UI et backend. À relancer à chaque nouveau millésime cadastral :
      l'alerte « parcelles absentes du cadastre actuel » de la page partenaire le signale.
- [ ] **Anonymiser les libellés de sites avant tout commit.** Le dépôt est public et les
      fichiers d'inventaire, le rapport d'audit et les sites générés y sont versionnés : un
      libellé qui nomme une personne physique (« Prénom NOM », ou une SCI/SARL portant un
      patronyme) publie une donnée personnelle rattachée à une parcelle précise. Retirer le
      `nom` de ces sites — le nom par défaut (rue la plus proche, ADR-0021) prend le relais.
      Les raisons sociales et marques (« Cémoi », « EXACOMPTA ») se conservent : ce sont des
      données d'entreprise, déjà publiées par BASOL et CARTOFRICHES.
- [ ] Choisir un **`slug`** (minuscules, sans espace ; segment d'URL, ex. `aura`, `cci-92`).
- [ ] **Un inventaire = un territoire = une page.** Un bureau d'études qui livre plusieurs
      inventaires donne autant de pages que de territoires (ex. EODD → `petr-sologne` et
      `ccpeidf`), nommées d'après le territoire et créditant le bureau d'études dans la
      `description`. Fusionner deux territoires sur une page casserait `departement`
      (mono-valué), mélangerait le `storageKey`, l'export CNIG et le canal de mesure
      `partenaire:<slug>`, et exposerait à chaque territoire les friches de l'autre.
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
      Saisir le schéma et l'hôte seuls (`https://partenaire.fr`), sans slash final ni chemin :
      un header `Origin` n'en porte jamais. Le guard normalise ces écarts au démarrage
      (ADR-0043) et journalise chaque entrée réécrite, mais la variable reste plus lisible
      sans eux. La liste s'ajoute aux origines par défaut, elle ne les remplace pas.
      Procédure détaillée, cas serveur à serveur et vérification :
      [docs/acces-api-integrateur.md](./acces-api-integrateur.md).

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

Ces appels sont enregistrés avec `source_utilisation = PREFETCH` (query param `prefetch=true`,
cf. ADR-0041) : les exclure de toute statistique d'usage, sans quoi la pré-chauffe est comptée
comme des qualifications utilisateur.

## Conventions

- `slug` : minuscules, sans espace (segment d'URL). **Identique** côté UI et côté prefetch API.
- `storageKey` : unique par partenaire (sinon les sites ajoutés manuellement se mélangeraient).
- Le calcul utilise les routes API standard (`/enrichissement`, `/evaluation/calculer`) via les
  services partagés — rien de spécifique côté partenaire.

## Liens

- Détail des fichiers et exemples de code : `apps/ui/src/features/partenaires/README.md`
- ADR socle : `docs/adr/0015-pages-partenaires-multisites-mutualisees.md`
- ADR persistance en base (à venir) : `docs/adr/0021-persistance-base-partenaires-sites.md`
- Ouvrir un accès API à un tiers : `docs/acces-api-integrateur.md`
