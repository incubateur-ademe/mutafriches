# Pages partenaires (multisites)

Pages dédiées aux partenaires de Mutafriches pour qualifier et calculer la mutabilité d'une
liste de friches propre à leur territoire (ex. CCI 92).

Le moteur est **générique et piloté par un registre** : ajouter un partenaire = ajouter un
dossier de data + une entrée de registre. Aucun composant n'est dupliqué.

## Architecture

```
partenaires/
├── core/                    # moteur partagé (ne dépend d'aucun partenaire)
│   ├── types.ts             # PartnerSite, PartnerParcelle, PartnerConfig
│   ├── group.ts             # groupByIdtup / groupByCommune
│   ├── download-json.ts
│   ├── partenaires.css      # classes mf-ms-*
│   ├── hooks/useCustomSites.ts
│   ├── components/          # SiteList, SiteDetail, DonneesForm, AddSiteModal
│   └── pages/               # MultisitePage (orchestrateur), PartenairesPage (hub)
├── partners/                # un dossier autonome par partenaire
│   └── cci92/
│       ├── parcelles.ts     # PartnerParcelle[] (idpar, commune, idtup)
│       └── index.ts         # PartnerConfig (assemble + groupe les parcelles)
└── registry.ts              # PARTNERS[] — source unique de vérité
```

Côté API, un miroir sert à pré-chauffer le cache d'enrichissement (cron quotidien) :

```
apps/api/src/scripts/
├── prefetch-partenaires.ts          # runner générique (cf. workflow partenaires-prefetch.yml)
└── partenaires/
    ├── types.ts                     # SitePrefetch
    ├── cci92.ts                     # CCI92_SITES (sites regroupés par idtup)
    └── registry.ts                  # PARTENAIRES_PREFETCH keyé par slug
```

- **Routing** : route dynamique unique `/partenaires/:slug` (cf. `routes.config.ts`,
  `PARTENAIRE_DETAIL`). `MultisitePage` résout le `slug` via `getPartnerBySlug()` et remonte
  l'orchestrateur avec `key={slug}` (état + localStorage propres par partenaire).
- **Hub** : `/partenaires` liste automatiquement toutes les entrées du registre.

## Ajouter un partenaire — checklist

Remplacer `<slug>` par le slug du partenaire (minuscules, sans espace, ex. `aura`).

**UI — obligatoire (rend la page et la carte visibles)**

- [ ] Créer `partners/<slug>/parcelles.ts` — la liste des IDU (cf. exemple ci-dessous)
- [ ] Créer `partners/<slug>/index.ts` — le `PartnerConfig` (`slug`, `nom`, `description`,
      `sousTitre`, `sidemenuTitre`, `storageKey` **unique**)
- [ ] Modifier `registry.ts` — importer le config et l'ajouter au tableau `PARTNERS`

**Prefetch CI — recommandé (cache chaud), uniquement avec des IDU réels**

- [ ] Créer `apps/api/src/scripts/partenaires/<slug>.ts` — sites regroupés par `idtup` (miroir de
      la data UI)
- [ ] Modifier `apps/api/src/scripts/partenaires/registry.ts` — ajouter `"<slug>": <SLUG>_SITES`
      à `PARTENAIRES_PREFETCH`

**Production — avant mise en ligne (si le partenaire appelle l'API directement)**

- [ ] Ajouter l'origine du partenaire à `ALLOWED_INTEGRATOR_ORIGINS` (var d'env Scalingo) —
      aucun code à modifier (cf. `IntegrateurOriginGuard`)

**Vérification**

- [ ] `pnpm validate` (format + lint + typecheck + test) au vert
- [ ] `/partenaires` affiche la carte, `/partenaires/<slug>` charge, un site s'enrichit et son
      indice de mutabilité se calcule

> Aucun changement de routing ni de composant : la route `/partenaires/<slug>` et la carte du hub
> apparaissent automatiquement dès que le registre UI est mis à jour.

### Détail — fichiers à créer

`partners/<slug>/parcelles.ts` — la liste des parcelles (IDU 14 caractères). Des parcelles
partageant le même `idtup` sont regroupées en un seul site (mono ou multi-parcelle).

```ts
import type { PartnerParcelle } from "../../core/types";

export const PARCELLES_AURA: PartnerParcelle[] = [
  { idpar: "49007000AB0123", commune: "ANGERS", idtup: "49007000AB0123" },
  { idpar: "49353000AC0045", commune: "TRELAZE", idtup: "ufAURA0001" },
  { idpar: "49353000AC0046", commune: "TRELAZE", idtup: "ufAURA0001" }, // même site
];
```

`partners/<slug>/index.ts` — la config du partenaire.

```ts
import type { PartnerConfig } from "../../core/types";
import { groupByCommune, groupByIdtup } from "../../core/group";
import { PARCELLES_AURA } from "./parcelles";

const sites = groupByIdtup(PARCELLES_AURA);

export const AURA_CONFIG: PartnerConfig = {
  slug: "aura", // → /partenaires/aura
  nom: "AURA — Agence d'urbanisme de la région angevine",
  description: "Qualification et mutabilité des friches du territoire d'AURA.",
  sousTitre: "Qualification et mutabilité des friches sur le territoire d'AURA.",
  sidemenuTitre: "Sites AURA",
  storageKey: "aura-custom-sites", // doit être unique par partenaire
  sites,
  sitesByCommune: groupByCommune(sites),
};
```

Enregistrement dans `registry.ts` :

```ts
import { AURA_CONFIG } from "./partners/aura";

export const PARTNERS: PartnerConfig[] = [CCI92_CONFIG, AURA_CONFIG];
```

La page `/partenaires/aura` et la carte sur le hub `/partenaires` apparaissent alors
automatiquement.

`apps/api/src/scripts/partenaires/<slug>.ts` (prefetch, IDU réels uniquement) — sites
regroupés par `idtup`, miroir de la data UI :

```ts
import { SitePrefetch } from "./types";

export const AURA_SITES: SitePrefetch[] = [
  { idtup: "ufAURA0001", commune: "TRELAZE", parcelles: ["49353000AC0045", "49353000AC0046"] },
];
```

Enregistrement dans `apps/api/src/scripts/partenaires/registry.ts` :

```ts
import { AURA_SITES } from "./aura";

export const PARTENAIRES_PREFETCH: Record<string, SitePrefetch[]> = {
  "cci-92": CCI92_SITES,
  aura: AURA_SITES,
};
```

## Conventions

- `slug` : en minuscules, sans espace (segment d'URL).
- `storageKey` : unique par partenaire (sinon les sites ajoutés manuellement se mélangeraient).
- Le calcul utilise les routes API standard (`/enrichissement`, `/evaluation/calculer` en
  `modeDetaille`) via les services partagés — rien de spécifique côté partenaire.

> Décision d'architecture : voir l'ADR « Pages partenaires multisites mutualisées »
> dans `docs/adr/`.
