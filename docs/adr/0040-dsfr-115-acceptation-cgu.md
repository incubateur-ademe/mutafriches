# ADR-0040 : Acceptation des CGU du DSFR via un `.dsfr.yml` versionné

**Date** : 2026-09-16
**Statut** : Accepté

## Contexte

Le DSFR 1.15 ajoute au paquet `@gouvfr/dsfr` un script `preinstall`
(`scripts/preinstall.js`) qui refuse l'installation tant que les modalités d'utilisation du
Système de design de l'État n'ont pas été explicitement acceptées. Le script compare la version
acceptée par le projet à la `cguVersion` du frontmatter de `doc/legal/cgu.md` embarqué dans le
paquet — **1.0.1**, datée du 20 juillet 2026 — et sort en code 1 dès que les deux divergent ou
que l'acceptation est absente.

Ce n'est pas un avertissement : `pnpm install` échoue. C'est la cause réelle de l'échec CI de la
PR #184 (bump groupé Dependabot), diagnostiqué à tort comme un problème de lockfile :

```
[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: @gouvfr/dsfr@1.15.2
```

Le message de pnpm masque le sujet. Depuis pnpm 11, tout paquet portant un script de cycle de vie
doit être catégorisé dans `allowBuilds` (cf. `pnpm-workspace.yaml`), et le DSFR n'y figurait pas :
l'installation s'arrêtait donc **avant même** d'exécuter le contrôle de licence. Catégoriser le
paquet ne fait que déplacer l'échec — c'est alors le `preinstall` lui-même qui refuse.

Deux mécanismes d'acceptation sont acceptés par le script :

| Mécanisme | Lecture |
|---|---|
| `.dsfr.yml` à la racine du projet | `accept-license: "<version>"`, comparé à la `cguVersion` du paquet |
| `DSFR_ACCEPT_LICENSE=1` | Court-circuite le contrôle, sans comparaison de version |

Le chemin de recherche du `.dsfr.yml` est `INIT_CWD`, c'est-à-dire le répertoire depuis lequel la
commande d'installation a été lancée — pas la racine du workspace.

## Décision

> **1.** Nous acceptons les modalités d'utilisation du DSFR (CGU 1.0.1) via un fichier
> `.dsfr.yml` **versionné à la racine du dépôt**, et nous passons `@gouvfr/dsfr` à `true` dans
> `allowBuilds` pour que le contrôle s'exécute réellement.
>
> **2.** Nous n'utilisons **pas** `DSFR_ACCEPT_LICENSE=1`.
>
> **3.** Toute installation se fait depuis la racine du monorepo.

## Options envisagées

### Option A — `.dsfr.yml` versionné + `allowBuilds: true` (retenue)

- Avantages : l'acceptation est un fait du dépôt, visible en revue et daté par l'historique git ;
  identique en local, en CI et sur Scalingo, sans configuration d'environnement à répliquer ;
  surtout, le contrôle de version continue de fonctionner — une future révision des CGU
  **cassera l'installation**, ce qui force une relecture explicite au lieu d'une acceptation
  tacite et perpétuelle.
- Inconvénients : une étape de plus à chaque révision des CGU ; le script du paquet s'exécute
  à l'installation.

### Option B — `DSFR_ACCEPT_LICENSE=1` en variable d'environnement

- Avantages : aucun fichier à versionner ; un réglage unique par environnement.
- Inconvénients : à répliquer sur chaque environnement (CI, Scalingo, chaque poste de dev) et
  invisible pour qui lit le dépôt ; surtout, la variable **désactive la comparaison de version** :
  toute révision future des CGU serait acceptée silencieusement, ce qui est exactement ce que le
  mécanisme cherche à empêcher.

### Option C — `allowBuilds: "@gouvfr/dsfr": false`

- Avantages : une ligne, l'installation passe immédiatement.
- Inconvénients : neutralise un contrôle de licence au lieu d'y répondre. L'installation
  réussirait sans que le projet ait accepté quoi que ce soit — inacceptable sur un produit de
  l'État qui embarque le design system de l'État.

### Option D — rester en DSFR 1.14.4

- Avantages : aucun changement.
- Inconvénients : gèle le design system sur une version qui ne recevra plus de correctifs
  d'accessibilité, et laisse une PR Dependabot rouge en permanence.

## Conséquences

### Positives

- La CI et le build Scalingo passent sans variable d'environnement supplémentaire.
- L'acceptation des CGU est tracée dans l'historique git, avec la version acceptée.
- Une révision des CGU par la DINUM fera échouer l'installation avec un message explicite
  (`[UPDATE-1.0.1->X.Y.Z]`) : le projet devra relire et relever la version dans `.dsfr.yml`.

### Négatives / Risques

- **L'installation doit être lancée depuis la racine du monorepo.** Le script résout `.dsfr.yml`
  depuis `INIT_CWD` : un `cd apps/ui && pnpm install` échoue avec `[NO_YML]`, alors qu'il
  fonctionnait auparavant. Les commandes du projet (`pnpm setup`, `pnpm install`, la CI,
  `scalingo-postbuild`) partent toutes de la racine ; un second `.dsfr.yml` dans `apps/ui`
  dupliquerait la version des CGU en deux endroits et a donc été écarté.
- `@gouvfr/dsfr` passe en `allowBuilds: true` : son `preinstall` s'exécute à chaque installation
  sur un store vierge. Le script est court, ne fait que lire deux fichiers et ne touche pas au
  réseau — mais c'est bien une exception à la règle `ignore-scripts=true` du `.npmrc`, à
  reconsidérer si un futur DSFR lui donnait d'autres responsabilités.

### Migration

1. `.dsfr.yml` à la racine avec `accept-license: "1.0.1"`.
2. `"@gouvfr/dsfr": true` dans `allowBuilds` (`pnpm-workspace.yaml`).
3. `pnpm install` — le `preinstall` doit afficher `Done`.

Rien à faire côté environnements : ni Scalingo ni GitHub Actions n'ont de variable à déclarer.

## Liens

- PR : #191
- Modalités d'utilisation : `node_modules/@gouvfr/dsfr/doc/legal/cgu.md` (frontmatter `cguVersion`)
- Documentation DSFR : <https://www.systeme-de-design.gouv.fr/>
- Fichiers :
  - `.dsfr.yml`
  - `pnpm-workspace.yaml` (section `allowBuilds`)
  - `apps/ui/package.json`
