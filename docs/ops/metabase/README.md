# Fonds de carte Metabase

Metabase n'accepte un fond de carte personnalisé (Admin → Paramètres → Cartes) que depuis une
URL publique, sans redirection, servie en `application/json`, `application/geo+json` ou
`text/plain`, et de moins de 5 Mo. Le stockage des contours Etalab renvoie un en-tête
`Content-Type` mal formé et se fait refuser (« content-type invalide ») : on en garde ici une
copie, que Metabase lit via `raw.githubusercontent.com`.

**Ne pas renommer, déplacer ni supprimer ces fichiers** : Metabase relit l'URL pour afficher
la carte, qui casserait aussitôt.

| Fichier        | Source                                                                                                                                  | Identifiant de région | Nom affiché | Questions |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | ----------- | --------- |
| `epci.geojson` | [Contours administratifs Etalab](https://www.data.gouv.fr/datasets/contours-administratifs) 2026, EPCI simplifiés à 1 000 m, inchangés | `code` (SIREN)        | `nom`       | 247       |

URL à saisir dans Metabase :
`https://raw.githubusercontent.com/incubateur-ademe/mutafriches/main/docs/ops/metabase/epci.geojson`

Nouveau millésime : remplacer le fichier par
`https://contours-administratifs.s3.rbx.io.cloud.ovh.net/<année>/geojson/epci-1000m.geojson`
(la version 100 m dépasse 5 Mo), puis vérifier que les SIREN du référentiel `epci` en base
(`pnpm db:epci:import`) y figurent tous.
