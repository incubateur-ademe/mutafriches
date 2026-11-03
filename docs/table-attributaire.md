# Table attributaire

> Tous les sites déjà analysés dans une commune, avec leurs critères et leur mutabilité :
> une ligne par site, en JSON ou en GeoJSON. Décision d'architecture : [ADR-0053](./adr/0053-table-attributaire-sites-par-commune.md).

## Ce que contient la table

Table `attributaire_sites`, une ligne par **ensemble de parcelles** :

| Bloc | Colonnes | Origine |
|------|----------|---------|
| Identification | `cle_site`, `identifiants_cadastraux`, `nombre_parcelles`, `parcelle_predominante`, `code_insee`, `commune`, centroïde, `geometrie` | Enrichissement |
| Partenaire | `partenaire_slug`, `partenaire_idtup`, `nom` | `partenaire_sites`, si l'ensemble de parcelles est exactement celui d'un site partenaire |
| Critères automatiques | `criteres_automatiques` (JSON), `date_enrichissement` | Enrichissement (les critères `AUTOMATIQUE` de `CRITERES_METADATA`, plus `raccordementEau` dérivé de la surface bâtie) |
| Critères saisis | `criteres_saisis` (JSON, `NULL` si jamais qualifié), `date_saisie`, `nombre_evaluations` | Dernière évaluation du même ensemble de parcelles |
| Mutabilité | `mutabilite` (JSON : indices par usage, usage prioritaire, usages exclus, fiabilité), `fiabilite`, `usage_prioritaire`, `version_algorithme` | Recalculée par Mutafriches |

`evaluation_id` (dernière évaluation retenue) reste interne : `GET /evaluation/:id` est public
et renverrait toute l'évaluation.

## Règles

- **Périmètre** : les ensembles de parcelles évalués (hors démonstration : `integrateur`
  `demo` et `mutafriches`) et les sites d'inventaire partenaire. Une parcelle seulement
  enrichie, sans évaluation ni partenaire, n'y entre pas.
- **Un site = un ensemble de parcelles.** La clé `cle_site` regroupe les parcelles
  normalisées (section « 0B » ramenée à « B »), triées et jointes par des virgules. Deux
  ensembles qui se recoupent (AD0004+AD0005 et AD0004+AD0005+AD0212) sont deux lignes.
- **Commune** : la commune prédominante issue de l'enrichissement. Un site à cheval sur deux
  communes n'apparaît que dans l'une.
- **Mutabilité** : une seule, calculée avec la version courante de l'algorithme, sur les
  critères saisis s'ils existent, sinon avec « ne sait pas » pour les 9 critères manuels.
  Un site jamais qualifié a donc une fiabilité plus basse (5,5 sur 10 environ).
- **Critères saisis** : ceux de la **dernière** évaluation. Une saisie qui ne contient que
  « ne sait pas » compte comme aucune saisie. Les champs ajoutés après une ancienne
  évaluation valent « ne sait pas ».
- **Enrichissement retenu** : le plus récent des enrichissements complets, à défaut le plus
  récent des partiels, parmi le cache (`sites`, `enrichissements`, hors réutilisations du
  cache) et l'instantané de la dernière évaluation. Une panne de source (BDNB) ne remplace pas
  une donnée complète par une donnée dégradée.

## Alimentation

| Moment | Effet |
|--------|-------|
| `POST /evaluation/calculer` (calcul ou cache) | Met à jour la ligne du site avec la nouvelle saisie |
| Enrichissement réussi ou partiel (`POST /enrichissement`, pré-chauffe, export CNIG) | Met à jour la ligne si le site est évalué ou partenaire ; ignoré sinon |
| `postdeploy` | Remplit la table si elle est vide, sinon recalcule les lignes d'une ancienne version d'algorithme |
| `pnpm attributaire:peupler` | Recalcul complet à la main |

Les deux premières écritures ne bloquent pas l'appelant : une erreur est journalisée
(`Table attributaire non mise à jour pour [...]`) et rattrapée au prochain passage du script.
`POST /evaluation/comparer` et l'export CNIG ne calculent qu'à titre temporaire et n'écrivent
rien.

## Peuplement

```bash
pnpm --filter api build:nest              # le script tourne sur la version compilée
pnpm attributaire:peupler                 # tout le périmètre
pnpm attributaire:peupler --commune=77305 # une commune
pnpm attributaire:peupler --dry-run       # calcule sans écrire, affiche le bilan
pnpm attributaire:peupler --si-necessaire # mode postdeploy
```

Sur Scalingo : `scalingo --app <app> run "pnpm attributaire:peupler"`.

Le script n'appelle **aucune API externe** : un site sans enrichissement en base est signalé
(« Aucun enrichissement en base »), pas enrichi. Sur la copie locale de la prod (octobre
2026), le remplissage complet traite 1 680 sites en une dizaine de secondes, dont 62 sans
enrichissement en base. En `--si-necessaire`, une erreur ne fait jamais échouer le
déploiement.

## Route publique

Référence complète pour les intégrateurs (champs, attributs GeoJSON, QGIS) :
[guide d'intégration](./integration/README.md#table-attributaire-dune-commune). La même
route est présentée sur la page « Documentation d'intégration » du site (`/documentation-integration`,
onglet API REST) et dans Swagger (`/api`, tag « Table attributaire »).

```bash
curl "https://mutafriches.beta.gouv.fr/api/attributaire/sites?codeInsee=77305"
curl "https://mutafriches.beta.gouv.fr/api/attributaire/sites?codeInsee=77305&format=geojson" -o sites.geojson
```

| Paramètre | Valeurs |
|-----------|---------|
| `codeInsee` | Obligatoire, 5 caractères (`2A`/`2B` pour la Corse) |
| `format` | `json` (défaut) ou `geojson` |

- **Accès** : ouvert, sans en-tête `Origin` ni clé. Limite globale de 100 requêtes par minute
  et par IP, `Cache-Control: public, max-age=300`.
- **JSON** : `{ codeInsee, commune, dateGeneration, avertissement, nombreSites, sites[] }`.
  Chaque site distingue un critère indisponible (absent) d'une recherche sans résultat (`null`).
- **GeoJSON** : une `FeatureCollection` dont chaque entité porte l'emprise du site (ou son
  centroïde à défaut) et des attributs à plat : un critère par colonne, `indice_<usage>` pour
  les 7 usages, `saisie_declarative`. Toutes les entités ont les mêmes colonnes ; un critère
  indisponible ou sans résultat vaut `null`.
- **Erreurs** : `400` pour un code INSEE absent ou mal formé, ou un format inconnu. Une
  commune sans site renvoie une liste vide.
- **CORS** : inchangé (nos origines seulement). La route s'appelle depuis curl, un SIG ou un
  serveur, pas depuis le JavaScript d'un site tiers.

## Saisie déclarative

Les critères saisis viennent des utilisateurs de Mutafriches (particuliers, collectivités,
partenaires) et ne sont pas vérifiés. Chaque site porte `saisieDeclarative` et la réponse un
`avertissement`. La saisie faite sur une page partenaire, qui reste dans le navigateur
(ADR-0021), n'arrive ici qu'au moment où le partenaire calcule la mutabilité du site.

## Points d'attention

- **`partenaire_sites.code_insee` est vide** pour tous les partenaires : `--commune` filtre
  les sites partenaires sur le préfixe des parcelles (les 5 premiers caractères de
  l'identifiant cadastral sont le code INSEE).
- **Valeurs de zonage non scorées** : `zonagePatrimonial` (`monument-historique`, `spr`,
  `zppaup`, `avap`) et `zonageEnvironnemental` (`parc-naturel-regional`) n'ont pas de score
  dans la matrice. Le calcul les ignore et journalise `Pas de score pour ...` : ces lignes
  apparaissent par centaines dans le premier remplissage. Ce comportement est celui de
  `POST /evaluation/calculer`, la table ne le change pas (cf. [sujets à traiter](./SUJETS-A-TRAITER.md)).
- **Purger pour tester** : la table se recalcule, on peut la vider en local
  (`TRUNCATE attributaire_sites`) puis relancer le script.

## Références techniques

- Table : `apps/api/src/shared/database/schemas/attributaire-sites.schema.ts`
- Calcul d'une ligne : `apps/api/src/attributaire/attributaire.builder.ts`
- Sélection des sources : `apps/api/src/attributaire/attributaire.service.ts`
- Route et sérialisation : `apps/api/src/attributaire/attributaire.controller.ts`, `attributaire.serializer.ts`
- Schéma Swagger : `apps/api/src/attributaire/dto/output/table-attributaire.dto.ts`
- Page de documentation du site : `apps/ui/src/features/documentation/components/DocumentationApi.tsx`
- Script : `apps/api/src/scripts/peupler-attributaire.ts`
- Contrat partagé : `packages/shared-types/src/attributaire/`
