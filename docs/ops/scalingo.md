# Scalingo — se connecter, lire les logs, diagnostiquer

Commandes de **lecture et de diagnostic** sur les environnements déployés.

> **Les commandes destructrices ne sont pas dans ce fichier, volontairement.** Pas de
> `DELETE`, pas de `DROP SCHEMA`, pas de `db:push:force`. Les laisser à côté de la commande
> de connexion prod, c'est prendre le risque d'un copier-coller dans le mauvais terminal.

## Les deux apps

| Environnement  | App                   | Région           | URL publique                               |
| -------------- | --------------------- | ---------------- | ------------------------------------------ |
| Staging        | `mutafriches-preprod` | `osc-fr1`        | https://mutafriches.incubateur.ademe.dev   |
| **Production** | `mutafriches`         | `osc-secnum-fr1` | https://mutafriches.beta.gouv.fr           |

L'environnement s'appelle staging (`NODE_ENV=staging`), mais l'**app** s'appelle preprod.
Les régions diffèrent : une commande avec la mauvaise région échoue (« The application was
not found on the region »), ce qui est un garde-fou plutôt qu'une gêne. Toujours préciser
la région.

Pour ne pas retaper l'app et la région, et surtout ne pas se tromper d'environnement :

```bash
alias sg-preprod='scalingo --app mutafriches-preprod --region osc-fr1'
alias sg-prod='scalingo --app mutafriches --region osc-secnum-fr1'
```

Les exemples ci-dessous sont écrits en clair pour rester copiables tels quels.

## Se connecter au conteneur

Ouvre un one-off (conteneur jetable, avec le code et les variables d'environnement de l'app) :

```bash
scalingo --app mutafriches-preprod --region osc-fr1 run bash
```

```bash
scalingo --app mutafriches --region osc-secnum-fr1 run bash
```

## Logs

```bash
# Suivre en direct
scalingo --app mutafriches-preprod --region osc-fr1 logs -f
```

```bash
# Les N dernières lignes, filtrées sur les erreurs
scalingo --app mutafriches --region osc-secnum-fr1 logs --lines 5000 \
  | grep -iE "error|erreur|failed|exception"
```

Quand la sortie est trop longue pour être lue d'un bloc, passer par un fichier temporaire :

```bash
scalingo --app mutafriches --region osc-secnum-fr1 logs --lines 5000 \
  | grep -iE "error|erreur|failed|exception" > /tmp/logs-erreurs.txt
wc -l /tmp/logs-erreurs.txt && tail -50 /tmp/logs-erreurs.txt
rm /tmp/logs-erreurs.txt
```

## Variables d'environnement

`scalingo env` affiche **toutes les valeurs, secrets compris**, dans le terminal (et dans son
historique de défilement). Pour vérifier qu'une variable existe, n'afficher que les noms ;
pour en lire une, la demander nommément :

```bash
scalingo --app mutafriches-preprod --region osc-fr1 env | cut -d= -f1
```

```bash
scalingo --app mutafriches-preprod --region osc-fr1 env-get ALLOWED_INTEGRATOR_ORIGINS
```

La modification (`env-set`) redémarre l'app : voir la procédure dédiée dans
[`docs/acces-api-integrateur.md`](../acces-api-integrateur.md).

## psql (lecture)

`pgsql-console` ouvre un one-off avec un `psql` à jour (17) et la connexion déjà configurée :

```bash
scalingo --app mutafriches-preprod --region osc-fr1 pgsql-console
```

```bash
scalingo --app mutafriches --region osc-secnum-fr1 pgsql-console
```

La voie manuelle (`run bash` puis `PAGER=cat psql $SCALINGO_POSTGRESQL_URL`) marche aussi,
mais n'embarque qu'un `psql` 14 face à un serveur 16.

La console se connecte avec l'utilisateur **propriétaire** de la base : rien n'empêche une
écriture. Pour une session de lecture, la déclarer comme telle dès l'ouverture, ce qui fait
échouer tout `INSERT`, `UPDATE` ou `DELETE` tapé par erreur :

```sql
SET default_transaction_read_only = on;
```

Repères une fois dans le prompt :

```sql
\pset pager off     -- pas de pager
\dt                 -- lister les tables
\d evaluations      -- structure d'une table
\x on               -- affichage vertical, pour les lignes larges
```

## Requêtes de lecture

Migrations appliquées (les plus récentes d'abord) :

```sql
SELECT id, hash, to_timestamp(created_at / 1000) AS appliquee_le
FROM drizzle.__drizzle_migrations ORDER BY created_at DESC LIMIT 5;
```

Dernier import de chaque référentiel (BPE, LOVAC, QPV…) :

```sql
SELECT DISTINCT ON (dataset_name) dataset_name, status, rows_imported, finished_at
FROM raw_imports_log ORDER BY dataset_name, started_at DESC;
```

Historique d'enrichissement d'une parcelle :

```sql
SELECT id, statut, date_enrichissement, source_utilisation, sources_echouees
FROM enrichissements WHERE identifiant_cadastral = '49020000AK0118'
ORDER BY date_enrichissement DESC LIMIT 5;
```

Usage des 7 derniers jours. `enrichissements` inclut la pré-chauffe des sites partenaires
(`PREFETCH`) et les cache hits : ne pas en faire un dénominateur (cf. Gotchas de
[`CLAUDE.md`](../../CLAUDE.md)). `evaluations` et `evenements_utilisateur` sont des signaux
propres.

```sql
SELECT coalesce(source_utilisation, '(null)') AS source, count(*)
FROM enrichissements WHERE date_enrichissement > now() - interval '7 days'
GROUP BY 1 ORDER BY 2 DESC;
```

```sql
SELECT coalesce(integrateur, '(aucun)') AS integrateur, count(*)
FROM evaluations WHERE date_calcul > now() - interval '7 days'
GROUP BY 1 ORDER BY 2 DESC;
```

```sql
SELECT type_evenement, count(*)
FROM evenements_utilisateur WHERE date_creation > now() - interval '7 days'
GROUP BY 1 ORDER BY 2 DESC;
```

Sites par partenaire :

```sql
SELECT partenaire_slug, count(*) AS sites FROM partenaire_sites GROUP BY 1 ORDER BY 1;
```

## Lancer un import de référentiel ou un script

Les imports (`db:*:import`) et scripts partenaires ne tournent pas au déploiement : ils se
lancent une fois par environnement, sur le `dist/` compilé (cf. Gotchas de
[`CLAUDE.md`](../../CLAUDE.md), `ts-node` n'existe pas au runtime). Ils sont idempotents :

```bash
scalingo --app mutafriches-preprod --region osc-fr1 run "pnpm db:qpv:import"
```

```bash
scalingo --app mutafriches-preprod --region osc-fr1 run "PARTENAIRE=<slug> pnpm partenaires:prefetch"
```

Toujours sur preprod d'abord, puis vérifier avec la requête « Dernier import » ci-dessus
avant de rejouer en prod.
