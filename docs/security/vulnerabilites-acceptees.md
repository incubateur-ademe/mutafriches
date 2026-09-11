# Vulnérabilités de dépendances : suivi et acceptations

> Registre imposé par `CLAUDE.md` (section « Audit de sécurité des dépendances »).
> Toute vulnérabilité remontée par `pnpm audit` est soit **corrigée**, soit **tracée ici**
> avec sa sévérité, son paquet, son chemin transitif, et une justification d'acceptation
> ou un plan de correction (version cible + échéance).
>
> Aucune vulnérabilité ne doit être acceptée silencieusement.

## Comment reproduire l'audit

```bash
pnpm audit --prod   # Périmètre runtime : ce qui tourne réellement sur Scalingo
pnpm audit          # Tout, devDependencies incluses (outillage dev/build)
```

Le périmètre `--prod` est celui qui compte pour l'exposition réelle : Scalingo supprime les
`devDependencies` à l'étape `Pruning devDependencies` du build (cf. « Gotchas » de `CLAUDE.md`),
donc l'outillage de build n'est jamais présent dans le conteneur qui sert le trafic.

## Mécanisme de correction : overrides pnpm

Les vulnérabilités transitives qu'aucun bump de dépendance directe ne couvre sont corrigées
par un **plancher de version** dans la section `overrides` de `pnpm-workspace.yaml`, chaque
entrée portant son GHSA et sa justification en commentaire. Ce fichier est la source de vérité :
les planchers y sont relevés au fil des avis, et un plancher devenu obsolète est un bug.

Quand la plage semver de la dépendance directe couvre déjà le correctif, on ne crée pas
d'override : un simple `pnpm update -r <paquet>` suffit et évite d'accumuler de la dette
d'override.

---

## Audit du 2026-09-11 — périmètre runtime (`--prod`)

**État initial** : 10 vulnérabilités (5 high, 3 moderate, 2 low), toutes transitives.
**État final** : `pnpm audit --prod` → `No known vulnerabilities found`.

Les 10 ont été **corrigées**, aucune n'a été acceptée. Détail ci-dessous, conservé comme
trace d'analyse (notamment l'atteignabilité réelle, qui justifie la priorisation).

### multer — 3 high + 1 low — CORRIGÉ

| Champ | Valeur |
|-------|--------|
| Sévérité | 3 high, 1 low |
| Version installée | 2.2.0 → **2.3.0** |
| Avis | GHSA-wc9g-mqfw-jrwm (high, DoS via noms de champs multipart forgés), GHSA-535w-7cp7-47q4 (high, DoS via index de tableau surdimensionné), GHSA-qfvm-cv95-jqjf (high, DoS par fuite de descripteurs sur upload interrompu), GHSA-qvfw-j98x-7q72 (low, contournement de la limite de taille via race `fileFilter` async) |

Chemins transitifs (4) :

```
apps__api>@nestjs/platform-express>multer
apps__api>@nestjs/core>@nestjs/platform-express>multer
apps__api>@nestjs/swagger>@nestjs/core>@nestjs/platform-express>multer
apps__api>@nestjs/throttler>@nestjs/core>@nestjs/platform-express>multer
```

**Atteignabilité : nulle (vérifié).** L'API n'expose aucun endpoint d'upload : une recherche sur
`multer`, `FileInterceptor`, `FilesInterceptor`, `AnyFilesInterceptor`, `UploadedFile`,
`MulterModule` et `multipart` dans `apps/` et `packages/` ne remonte **aucune occurrence**.
Côté `@nestjs/platform-express`, `multer` n'est chargé que par `require("multer")` dans
`multer/interceptors/*.interceptor.js` — des modules qu'aucun de nos contrôleurs n'importe.
Le paquet est donc présent dans l'arbre de dépendances mais jamais chargé au runtime.

**Pourquoi un override et pas un bump.** `@nestjs/platform-express` **épingle `multer` à une
version exacte** (`2.2.0`), et ce jusqu'à la dernière publiée : vérifié sur 11.1.27 (`2.1.1`),
11.1.28, 11.1.29, 11.2.0 → 11.2.3, **et aussi sur 12.0.1**. Même un bump majeur vers NestJS 12
ne corrige donc pas ces avis. L'override est le seul levier ; le plancher existant
(`multer: ">=2.2.0"`, posé en juin 2026) était simplement devenu obsolète.

Correction : plancher relevé à `>=2.3.0` dans `pnpm-workspace.yaml`.

### js-yaml — 1 high + 1 moderate — CORRIGÉ

| Champ | Valeur |
|-------|--------|
| Sévérité | 1 high, 1 moderate |
| Version installée | 5.2.0 → **5.4.1** |
| Avis | GHSA-pm4m-ph32-ghv5 (high, temps de parsing exponentiel sur les collections de flux ; corrigé en >=5.2.2), GHSA-724g-mxrg-4qvm (moderate, DoS quadratique via le tag `!!omap` de `YAML11_SCHEMA` ; corrigé en >=5.2.1) |

Chemin transitif (1) :

```
apps__api>@nestjs/swagger>js-yaml
```

**Atteignabilité : nulle (vérifié).** Les deux avis portent sur le **parsing** de YAML.
Or `@nestjs/swagger` n'utilise `js-yaml` que pour **sérialiser** : son unique appel est
`jsyaml.dump(documentToSerialize, ...)` dans `dist/swagger-module.js`, qui produit le document
OpenAPI en YAML. Aucun chemin de code ne passe de YAML non fiable à `load()`. De notre côté,
aucune occurrence de `js-yaml`, `yaml.load` ou `parseYaml` dans `apps/` et `packages/`.
À noter que Swagger est exposé publiquement en production (`SwaggerModule.setup("api", ...)`
est appelé sans condition dans `apps/api/src/main.ts`), mais cet endpoint **émet** du YAML,
il n'en consomme pas.

Correction : plancher relevé de `>=4.2.0` à `>=5.2.2` dans `pnpm-workspace.yaml`
(`@nestjs/swagger` épingle `js-yaml` à `4.1.1` exact ; l'override pré-existant forçait déjà
la majeure 5, le relèvement reste donc dans la même majeure).

### qs — 2 moderate — CORRIGÉ

| Champ | Valeur |
|-------|--------|
| Sévérité | 2 moderate |
| Version installée | 6.15.2 → **6.16.0** |
| Avis | GHSA-x5fp-wj9c-mxmx (contournement de `arrayLimit` via parsing de virgules dans les clés à crochets), GHSA-4mjr-xmp4-gh2g (DoS via `isBuffer` contrôlé par l'attaquant) |

Chemins transitifs (12), via `express` directement et via `express>body-parser`, eux-mêmes
atteints depuis `@nestjs/platform-express`, `@nestjs/core`, `@nestjs/swagger`,
`@nestjs/throttler`, `express` et `swagger-ui-express`. Forme représentative :

```
apps__api>@nestjs/platform-express>express>qs
apps__api>@nestjs/platform-express>express>body-parser>qs
```

**Atteignabilité : réelle.** `qs` parse la query string de **chaque requête HTTP** servie par
Express, et `body-parser` s'en sert pour les corps `urlencoded` (le body parser de NestJS est
actif : `main.ts` ne passe pas `bodyParser: false` à `NestFactory.create`). Aucune justification
d'acceptation possible : à corriger, ce qui est fait.

Correction : plancher relevé de `>=6.15.2` à `>=6.16.0`. La plage d'`express` (`qs: ^6.14.0`)
accepte nativement 6.16.0 ; l'override est conservé pour garder le plancher explicite, en
cohérence avec l'entrée existante.

### body-parser — 1 low — CORRIGÉ

| Champ | Valeur |
|-------|--------|
| Sévérité | low |
| Version installée | 2.2.1 → **2.3.0** |
| Avis | GHSA-v422-hmwv-36x6 — DoS : une valeur de `limit` invalide désactive silencieusement le contrôle de taille (corrigé en >=2.3.0) |

Chemins transitifs (6), tous via `express>body-parser`. Forme représentative :

```
apps__api>@nestjs/platform-express>express>body-parser
apps__api>swagger-ui-express>express>body-parser
```

**Atteignabilité : limitée.** L'avis suppose une valeur de `limit` invalide passée au body
parser ; nous n'en configurons aucune (body parser par défaut de NestJS), donc la limite par
défaut reste appliquée. Corrigé quand même : la plage d'`express` (`body-parser: ^2.2.1`)
couvre déjà 2.3.0, le correctif ne coûte qu'un rafraîchissement du lockfile.

Correction : `pnpm update -r body-parser` (pas d'override ajouté, la plage directe suffit).

### react-router — 1 high — CORRIGÉ

| Champ | Valeur |
|-------|--------|
| Sévérité | high |
| Version installée | 7.18.0 → **7.18.3** |
| Avis | GHSA-qwww-vcr4-c8h2 — contournement de la protection CSRF en **mode RSC** : l'action est exécutée avant la réponse 400 (corrigé en >=7.18.2) |

Chemin transitif (1) :

```
apps__ui>react-router-dom>react-router
```

**Atteignabilité : nulle (vérifié).** L'avis ne concerne que le **mode RSC** (React Server
Components), que l'UI n'utilise pas : c'est une SPA strictement client. `apps/ui/src/main.tsx`
monte un `BrowserRouter` et `App.tsx` déclare ses routes via `Routes`/`Route` ; les 26 imports
de `react-router-dom` du projet se limitent à `Link`, `useNavigate`, `useLocation` et
`useParams`. Aucune occurrence de `react-router/server`, `ServerRouter`, `createStaticHandler`,
`StaticRouter`, `renderToPipeableStream` ni d'une quelconque API `unstable_*`. Le bundle est
produit par Vite et servi en statique par NestJS (`app.useStaticAssets`, catch-all SPA renvoyant
`index.html`) : il n'existe aucun rendu serveur.

Correction : `pnpm update -r react-router react-router-dom` — la plage déclarée (`^7.18.0`)
couvrait déjà le correctif, seul le lockfile était en retard. Pas d'override ajouté.

---

## Audit du 2026-09-11 — outillage dev/build (hors `--prod`)

`pnpm audit` (devDependencies incluses) remonte **23 vulnérabilités** : 1 critical, 18 high,
4 moderate. Aucune n'est dans le périmètre runtime — elles sont **tracées ici avec un plan de
correction**, pas acceptées définitivement.

**Justification du différé, commune à toutes** : ces paquets appartiennent à la chaîne
d'outillage (`@nestjs/cli`, `@swc/cli`, `eslint`, `@typescript-eslint`, `eslint-plugin-react-hooks`,
`vitest`, `webpack`, `concurrently`). Scalingo les supprime au `Pruning devDependencies` : ils
ne sont donc **pas présents dans le conteneur de production**. Leur surface d'attaque se limite
aux postes de développement et aux runners CI, sur des entrées que nous contrôlons (nos propres
sources). Ce raisonnement est celui déjà retenu dans les commentaires de `pnpm-workspace.yaml`.

**Ce différé n'est pas un blanc-seing** : `@xhmikosr/decompress` est *critical* (extraction
d'archive pouvant créer des fichiers et liens hors du répertoire cible) et la CI exécute bien
`@swc/cli`. Le risque reste théorique tant qu'aucune archive non fiable n'est décompressée par
le build, mais il doit être levé.

| Paquet | Sévérité | Installé → cible | Chemin transitif (représentatif) |
|--------|----------|------------------|----------------------------------|
| `@xhmikosr/decompress` | **critical** | 11.1.1 → >=11.1.3 | `apps__api>@nestjs/cli>@swc/cli>@xhmikosr/bin-wrapper>@xhmikosr/downloader>@xhmikosr/decompress` |
| `brace-expansion` | 6 × high | 1.1.15 → >=1.1.18 ; 5.0.6 → >=5.0.9 | `.>@typescript-eslint/eslint-plugin>@typescript-eslint/parser>eslint>@eslint/config-array>minimatch>brace-expansion` |
| `fast-uri` | 6 × high | 3.1.2 → >=3.1.6 | `apps__api>@nestjs/cli>@angular-devkit/core>ajv>fast-uri` |
| `browserslist` | 2 × high | 4.28.2 → >=4.28.7 | `.>eslint-plugin-react-hooks>@babel/core>@babel/helper-compilation-targets>browserslist` |
| `nanoid` | 2 × high | 3.3.12 → >=3.3.18 | `apps__api>@nestjs/cli>fork-ts-checker-webpack-plugin>webpack>terser-webpack-plugin>postcss>nanoid` |
| `postcss` | 1 high + 1 moderate | 8.5.15 → >=8.5.23 | `apps__api>@nestjs/cli>fork-ts-checker-webpack-plugin>webpack>terser-webpack-plugin>postcss` |
| `shell-quote` | 1 × high | 1.8.4 → >=1.9.0 | `.>concurrently>shell-quote` |
| `vitest` / `@vitest/mocker` | 2 × moderate | 4.1.9 → >=4.1.11 | `apps__api>@vitest/ui>vitest>@vitest/mocker` |
| `baseline-browser-mapping` | 1 × moderate | 2.10.33 → >=2.11.0 | `.>eslint-plugin-react-hooks>@babel/core>@babel/helper-compilation-targets>browserslist>baseline-browser-mapping` |

**Plan de correction (à confirmer par l'équipe)** : traiter ce lot dans une itération dédiée à
l'outillage, séparée de toute feature métier, **au plus tard fin octobre 2026**. Deux planchers
d'override existants sont déjà obsolètes et seront relevés à cette occasion :
`fast-uri: ">=3.1.2"` → `>=3.1.6`, et les overrides `brace-expansion` scopés par version, qui
ne couvrent ni la majeure 1.x ni la 5.x remontées ici. Le lot demande une vigilance particulière
sur `eslint-plugin-react-hooks` et `browserslist` : un incident connu de ce dépôt a déjà vu un
bump de `eslint-plugin-react-hooks` casser `pnpm lint`. Chaque bump doit être validé par
`pnpm validate`.

---

## Procédure pour une nouvelle vulnérabilité

1. Lancer `pnpm audit --prod` puis `pnpm audit`, et isoler les nouveautés.
2. Déterminer le **chemin transitif exact** (`pnpm why <paquet> --prod -r`).
3. Vérifier si un bump de la **dépendance directe** corrige l'avis. Attention aux épinglages de
   version exacte (cas de `multer` dans `@nestjs/platform-express`) : un bump majeur n'y change
   rien, seul un override agit.
4. Si la plage semver directe couvre déjà le correctif → `pnpm update -r <paquet>`, sans override.
5. Sinon → relever le plancher dans `overrides` de `pnpm-workspace.yaml`, avec le GHSA et la
   justification en commentaire.
6. Si la correction est impossible ou différée → **créer une entrée ici** : sévérité, paquet,
   chemin transitif, et justification d'acceptation vérifiée dans le code **ou** version cible
   + échéance.
7. `pnpm validate`, puis re-lancer l'audit pour confirmer.

Note : `minimumReleaseAge: 1440` dans `pnpm-workspace.yaml` impose un délai de 24 h après
publication avant qu'une version soit installable. Une version patchée publiée le jour même
ne sera pas résolue — ce n'est pas une erreur de configuration.
