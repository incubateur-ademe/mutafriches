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

- **Routing** : route dynamique unique `/partenaires/:slug` (cf. `routes.config.ts`,
  `PARTENAIRE_DETAIL`). `MultisitePage` résout le `slug` via `getPartnerBySlug()` et remonte
  l'orchestrateur avec `key={slug}` (état + localStorage propres par partenaire).
- **Hub** : `/partenaires` liste automatiquement toutes les entrées du registre.

## Ajouter un partenaire en 2 étapes

### 1. Créer le dossier du partenaire

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

### 2. Enregistrer le partenaire

Dans `registry.ts` :

```ts
import { AURA_CONFIG } from "./partners/aura";

export const PARTNERS: PartnerConfig[] = [CCI92_CONFIG, AURA_CONFIG];
```

C'est tout. La page `/partenaires/aura` et la carte sur le hub `/partenaires` apparaissent
automatiquement. Aucun changement de routing ni de composant.

## Conventions

- `slug` : en minuscules, sans espace (segment d'URL).
- `storageKey` : unique par partenaire (sinon les sites ajoutés manuellement se mélangeraient).
- Le calcul utilise les routes API standard (`/enrichissement`, `/evaluation/calculer` en
  `modeDetaille`) via les services partagés — rien de spécifique côté partenaire.

> Décision d'architecture : voir l'ADR « Pages partenaires multisites mutualisées »
> dans `docs/adr/`.
