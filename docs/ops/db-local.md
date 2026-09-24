# Base de données locale — reset, migrations, restauration

Tout ce qui touche à la base **locale** (Docker). Rien ici ne s'applique à un environnement
déployé.

Le conteneur s'appelle `mutafriches-postgres`, la base `mutafriches`, l'utilisateur
`mutafriches_user` (cf. [`apps/api/docker-compose.yml`](../../apps/api/docker-compose.yml),
qui lit `apps/api/.env`). Le port n'est publié que sur `127.0.0.1`.

## Démarrer, réinitialiser

```bash
pnpm db:start        # démarre PostgreSQL + PostGIS (Docker)
pnpm db:stop         # arrête
pnpm db:studio       # Drizzle Studio (GUI)
```

```bash
# Repartir d'une base vide : détruit le volume, recrée le conteneur, applique le schéma
pnpm db:reset && pnpm db:push
```

`db:reset` fait un `docker-compose down -v` : **le volume est supprimé**, toutes les données
locales sont perdues, sans confirmation. Les référentiels (`pnpm db:*:import`, cf.
[`README`](../../README.md#base-de-données)) sont à réimporter ensuite.

## Migrations

```bash
pnpm db:generate     # génère la migration après modification d'un schéma Drizzle
pnpm db:migrate      # l'applique en local
```

Les migrations sont versionnées dans `apps/api/src/shared/database/migrations/`. En
preprod et en prod, elles s'appliquent **au déploiement**, via le `postdeploy` du
[`Procfile`](../../Procfile) : rien à lancer à la main. Pour valider une migration contre la
volumétrie réelle avant un merge, la rejouer sur un dump restauré (ci-dessous) : la base
d'une review app est un clone daté, pas un reflet de la prod.

## Restaurer un dump dans la base locale

Un dump PostgreSQL Scalingo (`.tar.gz` contenant un `.pgsql`) se charge dans la base locale
en une commande. Indiquer une fois le dossier des dumps dans `apps/api/.env` :

```
DB_BACKUP_DIR=~/chemin/vers/mes/dumps
```

Puis :

```bash
pnpm db:restore
```

Sans argument, la commande liste les dumps du dossier, du plus récent au plus ancien ;
`Entrée` prend le plus récent. Si [`fzf`](https://github.com/junegunn/fzf) est installé, la
liste se filtre en tapant quelques lettres. On peut aussi nommer le fichier directement :
`pnpm db:restore mon-dump.tar.gz`.

Une **confirmation** est demandée avant de toucher à la base, qui est supprimée puis
recréée : toute autre réponse que `o` abandonne sans rien modifier. Le script extrait
ensuite le `.pgsql` de l'archive, le copie dans le conteneur, déconnecte les clients,
recrée la base vide, restaure, puis supprime les fichiers temporaires. Options :

| Option         | Effet                                                            |
| -------------- | ---------------------------------------------------------------- |
| `-d <dossier>` | Dossier des dumps, prioritaire sur tout le reste                 |
| `-k`           | Garde les fichiers temporaires après restauration                |
| `-y`           | Pas de confirmation : pour un appel scripté, jamais par habitude |
| `-h`           | Aide, avec le dossier effectivement retenu                       |

Ordre de résolution du dossier : `-d`, puis la variable d'environnement `DB_BACKUP_DIR`,
puis `DB_BACKUP_DIR` dans `apps/api/.env`, et enfin `~/mutafriches-backups`.

Le dossier doit être **hors du dépôt**, et c'est voulu : le script y décompresse le dump,
donc une copie en clair de la base. Dans le dépôt, un `git add -A` la publierait, et un
agent de code pourrait la lire. Le `.gitignore` bloque aussi `/backups/`, `*.pgsql`,
`*.dump` et `*.tar.gz`, en filet de sécurité si un dump y est déposé quand même.

Vérifier que la restauration a abouti :

```bash
docker exec mutafriches-postgres \
  psql -U mutafriches_user -d mutafriches -c "SELECT COUNT(*) FROM evaluations;"
```

### Récupérer un dump

Depuis le dashboard Scalingo (addon PostgreSQL → Backups), ou en ligne de commande. Toujours
passer `--output` vers le dossier des dumps : sans, le fichier atterrit dans le répertoire
courant, souvent le dépôt.

```bash
# Identifiant de l'addon PostgreSQL
scalingo --app mutafriches --region osc-secnum-fr1 addons
```

```bash
# Dernière sauvegarde réussie
scalingo --app mutafriches --region osc-secnum-fr1 --addon <addon_id> \
  backups-download --output ~/chemin/vers/mes/dumps/$(date +%Y%m%d)_mutafriches.tar.gz
```

> **Un dump de prod est une donnée de prod.** Il contient les évaluations (dont les
> commentaires libres) et les événements utilisateur (user agent, identifiants de
> session). Ne le télécharger que pour un besoin précis, et le supprimer une fois le
> diagnostic terminé — dump, volume Docker (`pnpm db:reset`) et sauvegardes du poste.

## Purger les caches applicatifs

Pour un test E2E sur une parcelle déjà analysée, les caches de 24 h (`enrichissements`,
`sites`, `evaluations`) renvoient l'ancien résultat. Les vieillir plutôt que les vider :
`evaluations` alimente les KPI publics, et les trois se purgent ensemble (`evaluations`
embarque un instantané de l'enrichissement).

```bash
docker exec -i mutafriches-postgres psql -U mutafriches_user -d mutafriches <<'SQL'
BEGIN;
UPDATE enrichissements SET date_enrichissement = date_enrichissement - INTERVAL '48 hours';
UPDATE sites           SET date_enrichissement = date_enrichissement - INTERVAL '48 hours';
UPDATE evaluations     SET date_calcul         = date_calcul         - INTERVAL '48 hours';
COMMIT;
SQL
```

## Port 3000 déjà pris

Symptôme : `pnpm dev:api` compile (« Found 0 errors ») puis n'affiche plus rien, et l'UI
répond avec un code ancien. Un `nest start --watch` d'une session précédente tient encore
le port, parfois depuis des jours.

```bash
# Qui écoute, et depuis quand
for p in $(lsof -tiTCP:3000 -sTCP:LISTEN); do ps -o pid,ppid,lstart,command -p "$p"; done
```

Si c'est un `node … apps/api/dist/src/main` démarré avant la session en cours, arrêter son
parent (le watcher, `PPID`) puis lui-même, et relancer :

```bash
kill <ppid> <pid>
```

Vérifier d'abord la ligne `command` : le port 3000 est aussi celui par défaut d'autres
projets (Next.js par exemple), à ne pas tuer à l'aveugle avec `kill -9`.
