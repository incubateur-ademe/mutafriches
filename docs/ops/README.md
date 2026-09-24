# Ops — commandes et requêtes du quotidien

Aide-mémoire opérationnel : se connecter à un environnement, lire des logs, interroger la
base en lecture, restaurer une base en local. Des commandes à copier-coller, pas un guide
d'architecture (pour le déploiement lui-même, voir la section Scalingo du
[`README`](../../README.md#-déploiement-sur-scalingo)).

## J'ai besoin de…

| Besoin                                                       | Fichier                        |
| ------------------------------------------------------------ | ------------------------------ |
| Me connecter à preprod/prod, lire les logs, ouvrir `psql`    | [`scalingo.md`](./scalingo.md) |
| Diagnostiquer une parcelle, compter l'usage, suivre un import | [`scalingo.md`](./scalingo.md#requêtes-de-lecture) |
| Restaurer un dump en local, purger les caches, migrer        | [`db-local.md`](./db-local.md) |
| Libérer le port 3000                                         | [`db-local.md`](./db-local.md#port-3000-déjà-pris) |

## Deux règles pour tout ce dossier

**Aucun secret ici.** Les commandes utilisent des variables (`$SCALINGO_POSTGRESQL_URL`,
`$DB_BACKUP_DIR`) et chaque fichier dit où récupérer la valeur. Un secret collé dans un
fichier du dépôt est un secret à révoquer : le dépôt est public (cf.
[`.claude/context/security-rules.md`](../../.claude/context/security-rules.md)).

**Aucune écriture en base déployée à la main.** Ce dossier ne contient que de la
**lecture** sur preprod et prod. Toute correction de données passe par une migration
Drizzle ou un script de `apps/api/src/scripts/`, relu en PR, idempotent et rejouable. Un
`UPDATE` tapé dans un `psql` de prod n'est ni relu, ni testé, ni réversible.
