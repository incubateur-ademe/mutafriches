# Fonds de carte Metabase

Metabase n'accepte un fond de carte personnalisé (Admin → Paramètres → Cartes) que depuis une
URL publique, sans redirection, servie en `application/json`, `application/geo+json` ou
`text/plain`, et de moins de 5 Mo. Le stockage des contours Etalab renvoie un en-tête
`Content-Type` mal formé et se fait refuser (« content-type invalide ») : on en garde ici une
copie, que Metabase lit via `raw.githubusercontent.com`.

**Ne pas renommer, déplacer ni supprimer ces fichiers** : Metabase relit l'URL pour afficher
la carte, qui casserait aussitôt.

| Fichier        | Source                                                                                                                                         | Identifiant de région | Nom affiché | Questions |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | ----------- | --------- |
| `epci.geojson` | [Contours administratifs Etalab](https://www.data.gouv.fr/datasets/contours-administratifs) 2026, EPCI simplifiés à 1 000 m, métropole et Corse | `code` (SIREN)        | `nom`       | 247       |

Les EPCI d'outre-mer sont retirés : hors périmètre de Mutafriches, ils étiraient l'emprise de
la carte jusqu'à La Réunion et réduisaient la métropole à une vignette.

URL à saisir dans Metabase :
`https://raw.githubusercontent.com/incubateur-ademe/mutafriches/main/docs/ops/metabase/epci.geojson`

Nouveau millésime : la version 100 m dépasse 5 Mo, garder la 1 000 m.

```bash
curl -s https://contours-administratifs.s3.rbx.io.cloud.ovh.net/<année>/geojson/epci-1000m.geojson \
  | jq -c '.features |= map(select((.geometry.coordinates | flatten | .[0]) | . > -6 and . < 10))' \
  > docs/ops/metabase/epci.geojson
```

Puis vérifier que les SIREN du référentiel `epci` en base (`pnpm db:epci:import`) y figurent
tous, outre-mer excepté.
