# ADR-0050 : Import des référentiels au déploiement (`import-all`)

**Date** : 2026-10-07
**Statut** : Accepté

## Contexte

Douze référentiels locaux alimentent l'enrichissement (BPE, arrêts de transport, ADEME, ITE, LOVAC,
zonage ABC, réseaux de chaleur, ICU, QPV, zones de contrainte EnR, ZAE, découpage administratif).
Chacun a son script `db:xxx:import`, à lancer **à la main** une fois par environnement
(`scalingo run`). Le `postdeploy` ne jouait que les migrations.

Cela a un coût récurrent : chaque nouveau critère à référentiel ajoute une commande à jouer en
préprod puis en prod, et l'oubli est silencieux. Une table vide ne fait pas échouer le calcul : le
critère devient indisponible (ou, pour ceux qui l'avaient, faussement « Non »), ce qu'on ne voit
qu'en lisant `GET /donnees-externes/imports` ou les logs. Une review app, dont la base est clonée à
la création de la PR, peut aussi manquer d'un référentiel introduit depuis.

Constats de l'état du code au 2026-10-07 :

- Sept imports lisent un fichier commité (sans réseau) ; cinq téléchargent à l'exécution.
- Aucune dépendance entre imports : l'ordre n'importe pas.
- Tous vident puis réécrivent leur table. Seuls ZAE, zones EnR et réseaux de chaleur le font dans
  une transaction.
- Le registre `IMPORT_DATASETS` liste déjà tous les référentiels avec leur table, pour l'écran
  d'état des imports.

## Décision

> Un script `import-all`, lancé par le `postdeploy` après les migrations, parcourt le registre
> `IMPORT_DATASETS` et lance l'import de chaque référentiel dont la table est vide.

- **Source unique** : le registre gagne `script` (fichier compilé dans `dist/src/scripts`) et
  `source` (`fichier` ou `reseau`). Ajouter un référentiel = une entrée, déjà nécessaire pour
  l'écran d'état. `imports.registry.spec.ts` casse si un script `db:*:import` de `package.json`
  n'a pas d'entrée, ou l'inverse.
- **« Déjà présent, on passe »** : une table non vide n'est jamais touchée. Le script ne met donc
  pas à jour un référentiel périmé ; `--force=<clés>` réimporte à la demande (nouveau millésime,
  fichier commité modifié). `--only=<clés>` restreint l'exécution.
- **Un échec ne bloque pas le déploiement** : l'import en échec est loggué dans un récapitulatif
  final, les imports suivants continuent, et le code de sortie reste 0. Une panne de data.gouv.fr
  ne doit pas empêcher de livrer un correctif. `--strict` renvoie 1 pour les usages où l'on veut
  l'inverse.
- **Lancement** : `postdeploy: ... drizzle-kit migrate && node dist/src/scripts/import-all.js`
  (pas de `pnpm` au runtime) ; en local, `pnpm db:import:all` après `pnpm --filter api build:nest`.
- **Hors périmètre** : la pré-chauffe (`partenaires:prefetch`, appels externes coûteux) et le seed
  des partenaires restent manuels.

## Options envisagées

### Option A — `import-all` au `postdeploy`, saute les tables remplies (retenue)

- Avantages : zéro commande à jouer pour un nouveau référentiel ; une review app ou un
  environnement neuf se remplit seul ; réutilise le registre ; idempotent et rejouable.
- Inconvénients : ne rafraîchit pas un référentiel déjà présent ; le déploiement dépend un peu
  plus de la durée du `postdeploy` ; un import réseau en panne laisse une table vide sans bloquer.

### Option B — Détecter un fichier commité modifié (taille ou empreinte) et réimporter

- Avantages : un nouveau millésime commité s'applique tout seul.
- Inconvénients : réimporter au déploiement alors que l'ancienne version sert du trafic. Neuf des
  douze scripts font un `TRUNCATE` hors transaction : le critère serait indisponible pendant
  l'import. À reprendre après les avoir passés sous transaction ; `--force` couvre le besoin d'ici
  là.

### Option C — Statu quo, commandes manuelles documentées

- Avantages : aucun changement de déploiement, aucun risque pour le `postdeploy`.
- Inconvénients : l'oubli est la norme, et il a un coût d'exploitation à chaque critère.

### Option D — Une liste d'imports dans le script, distincte du registre

- Avantages : script autonome.
- Inconvénients : deuxième liste à tenir à jour en parallèle de l'écran d'état, qui divergera.

## Conséquences

### Positives

- Un nouveau critère à référentiel local n'impose plus de commande manuelle par environnement.
- L'oubli est détecté dès la CI : `imports.registry.spec.ts` bloque un import hors registre.
- Une base vide (review app, environnement neuf, restauration partielle) se reconstitue au
  déploiement.

### Négatives / Risques

- **Durée du `postdeploy`** : sur une base locale entièrement vide, les douze imports prennent
  environ 36 s (arrêts de transport 12 s et réseaux de chaleur 10 s en tête), puis un second
  passage ignore tout. La durée maximale d'un `postdeploy` Scalingo et les débits réseau de
  Scalingo n'ont pas été vérifiés : à mesurer en préprod sur une base vidée avant de s'y fier. Le script est incrémental : un déploiement interrompu reprend où
  il s'est arrêté.
- **Échec silencieux** : un import réseau en échec n'arrête rien. Il faut lire le récapitulatif de
  la release, `hasEmptyImport` ou l'alerte « référentiel VIDE » des repositories.
- **Référentiel périmé** : « déjà présent » ne distingue pas un millésime ancien d'un récent.
  `--force` reste manuel.
- **Un `postdeploy` plus lourd** : sur chaque déploiement, une lecture `COUNT(*)` par table
  (négligeable).

### Migration

1. Fusionner : le prochain déploiement exécute `import-all` ; les tables remplies sont ignorées.
2. Préprod d'abord : vérifier le récapitulatif dans les logs de la release.
3. Pour valider la reconstitution complète : vider une base locale (`pnpm db:reset`,
   `pnpm db:push`), `pnpm --filter api build:nest`, puis `pnpm db:import:all`.
4. Les ADR-0046 et ADR-0049 décrivent un import manuel par environnement : il n'est plus requis
   pour un nouvel environnement, mais reste le moyen de rafraîchir (`--force`).

## Liens

- Script : `apps/api/src/scripts/import-all.ts`, `apps/api/src/scripts/import-all/import-all.core.ts`
- Registre : `apps/api/src/donnees-externes/imports.registry.ts` et son test
  `imports.registry.spec.ts`
- Déploiement : `Procfile`, `docs/ops/scalingo.md`
- ADR liés : ADR-0046 (zones EnR, import manuel), ADR-0049 (ZAE), ADR-0032 (zonage ABC)
