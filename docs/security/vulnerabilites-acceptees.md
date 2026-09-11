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

**État initial** : 23 vulnérabilités (1 critical, 18 high, 4 moderate), toutes hors périmètre
runtime. **État final** : `pnpm audit` (devDependencies incluses) → `No known vulnerabilities found`.

Les 23 ont été **corrigées**, aucune n'a été acceptée. Le détail est conservé comme trace
d'analyse, notamment parce que le levier efficace n'était pas celui attendu.

| Paquet | Sévérité | Installé → résolu | Levier |
|--------|----------|-------------------|--------|
| `@xhmikosr/decompress` | **critical** | 11.1.1 → 11.1.4 | re-résolution (plage parent permissive) |
| `brace-expansion` | 6 × high | 1.1.15 → 1.1.18 ; 5.0.6 → 5.0.9 | re-résolution |
| `fast-uri` | 6 × high | 3.1.2 → 3.1.7 | plancher d'override relevé |
| `browserslist` | 2 × high | 4.28.2 → 4.28.9 | override ajouté (webpack retenait 4.28.2) |
| `nanoid` | 2 × high | 3.3.12 → 3.3.18 | suit `postcss` |
| `postcss` | 1 high + 1 moderate | 8.5.15 → 8.5.28 | bump de `@tailwindcss/postcss` et `vite` |
| `shell-quote` | 1 × high | 1.8.4 → 1.9.0 | bump de `concurrently` |
| `vitest` / `@vitest/mocker` | 2 × moderate | 4.1.9 → 4.1.11 | bump direct |
| `baseline-browser-mapping` | 1 × moderate | 2.10.33 → 2.11.21 | suit `browserslist` |

**Ce qui bloquait réellement.** Six de ces paquets ne bougeaient pas malgré un
`pnpm update -r` direct, parce que le blocage venait d'un **parent** et non d'eux :
`@tailwindcss/postcss@4.3.1` épingle `postcss` à `8.5.15` **exact** (ce qui verrouillait aussi
`nanoid` en dessous), `concurrently@10.0.3` épingle `shell-quote` à `1.8.4`, et `webpack`
retenait `browserslist@4.28.2` (donc `baseline-browser-mapping`). Le levier correct était de
bumper ces parents, tous dans leur plage déclarée, plutôt que d'empiler des overrides sur les
enfants. Seuls deux overrides ont été nécessaires au total.

**Bornes hautes sur les overrides.** Un plancher nu (`>=x.y.z`) laisse pnpm franchir une
majeure : en relevant `fast-uri` à `>=3.1.6`, la résolution est partie en **4.1.4**, sous un
`ajv` qui déclare `^3.0.1`. Les deux entrées touchées sont donc bornées (`>=3.1.6 <4`,
`>=4.28.7 <5`). Deux planchers **préexistants** ont le même défaut et sont aujourd'hui
plusieurs majeures au-dessus de leur intention : `piscina: ">=4.9.3"` résout en **5.2.0** et
`diff: ">=4.0.4"` en **9.0.0**. Ils ne sont pas corrigés ici : ils tournent ainsi depuis juin
2026 sans incident, et les rétrograder serait plus risqué que les laisser. À borner lors d'une
prochaine intervention sur ces paquets.

**Pourquoi ces 23 n'étaient pas une urgence de production** (et le restent pour l'avenir) : ces
paquets appartiennent à la chaîne d'outillage (`@nestjs/cli`, `@swc/cli`, `eslint`,
`@typescript-eslint`, `eslint-plugin-react-hooks`, `vitest`, `webpack`, `concurrently`).
Scalingo les supprime au `Pruning devDependencies` : ils ne sont **pas présents dans le
conteneur de production**. Leur surface d'attaque se limite aux postes de développement et aux
runners CI, sur des entrées que nous contrôlons. Cela justifiait la priorisation après le
périmètre runtime, pas une acceptation.

**Validation** : `pnpm validate` vert (807 tests API, 213 UI, 145 shared-types), `pnpm build`
et `pnpm --filter ui build` verts. Cette dernière vérification n'est pas optionnelle ici :
`vite` est passé de 8.0.16 à 8.3.0 et `pnpm validate` ne construit pas le bundle de production.

---

## Procédure pour une nouvelle vulnérabilité

1. Lancer `pnpm audit --prod` puis `pnpm audit`, et isoler les nouveautés.
2. Déterminer le **chemin transitif exact** (`pnpm why <paquet> --prod -r`).
3. Vérifier si un bump de la **dépendance directe** corrige l'avis. Attention aux épinglages de
   version exacte (cas de `multer` dans `@nestjs/platform-express`) : un bump majeur n'y change
   rien, seul un override agit.
4. Si la plage semver directe couvre déjà le correctif → `pnpm update -r <paquet>`, sans override.
5. **Si le paquet refuse de bouger, remonter au parent avant d'ajouter un override.** Un
   `pnpm update -r <enfant>` reste sans effet quand c'est un parent qui épingle (cas de
   `@tailwindcss/postcss` sur `postcss`, de `concurrently` sur `shell-quote`) : identifier le
   parent avec `pnpm why <paquet> -r`, vérifier sa propre plage déclarée, et le bumper lui.
   C'est presque toujours préférable à un override sur l'enfant.
6. Sinon → relever le plancher dans `overrides` de `pnpm-workspace.yaml`, avec le GHSA et la
   justification en commentaire, et **borner la majeure** (`">=3.1.6 <4"`) : un plancher nu
   laisse pnpm franchir une majeure que le parent ne déclare pas. Contrôler ensuite la version
   réellement résolue, pas seulement le fait que l'audit passe.
7. Si la correction est impossible ou différée → **créer une entrée ici** : sévérité, paquet,
   chemin transitif, et justification d'acceptation vérifiée dans le code **ou** version cible
   + échéance.
8. `pnpm validate`, puis re-lancer l'audit pour confirmer. Si le bump touche la chaîne de build
   de l'UI (`vite`, `postcss`, `tailwindcss`), ajouter `pnpm --filter ui build` : `pnpm validate`
   ne construit pas le bundle de production.

Note : `minimumReleaseAge: 1440` dans `pnpm-workspace.yaml` impose un délai de 24 h après
publication avant qu'une version soit installable. Une version patchée publiée le jour même
ne sera pas résolue — ce n'est pas une erreur de configuration.
