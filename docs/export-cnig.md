# Export CNIG Friches

> Export d'un inventaire complet de sites partenaires au standard national d'échange, depuis
> une page `/partenaires/:slug`.

## Le standard

- **Référence** : [Standard CNIG Friches v2023-12 rev. 2025-12](https://cnig.gouv.fr/IMG/pdf/251204_standard_cnig_friches_v2023-12_rev2025-12.pdf),
  rendu réglementaire par le décret n° 2023-1259.
- **Schéma de validation** : [`cnigfr/schema-friches` v1.0.6](https://schema.data.gouv.fr/cnigfr/schema-friches/),
  un TableSchema Frictionless de 51 colonnes, clé primaire `site_id`.
- **Vérification** : déposer le CSV produit sur [validata.fr](https://validata.fr) en
  sélectionnant le schéma « Standard CNIG Friches ». Un export sans les colonnes Mutafriches
  doit passer sans erreur.

## Utilisation

Sur une page partenaire, le bouton « Exporter tous les sites » ouvre une modale : format
(CSV ou GeoJSON) et, en option, les indices de mutabilité.

| Fichier | Contenu |
|---------|---------|
| `friches-cnig-<slug>-<AAAAMMJJ>.csv` | 51 colonnes du standard, conforme, validable |
| `friches-cnig-<slug>-<AAAAMMJJ>.geojson` | Mêmes attributs, emprises en géométries GeoJSON |
| `...-etendu.csv` / `...-etendu.geojson` | Plus 10 colonnes `mf_*`, hors standard |

En ligne de commande :

```bash
curl -X POST https://mutafriches.beta.gouv.fr/api/partenaires/cci-92/export \
  -H "Content-Type: application/json" \
  -d '{"format":"csv"}' -o friches.csv
```

## Ce que Mutafriches sait renseigner

25 attributs sur 51 au mieux. Les autres sortent à `inconnu` pour les listes — valeur
conventionnelle du standard (§3.3) — et vides pour les textes, dates et URL.

### Depuis l'enrichissement automatique et la base partenaires (16)

| Attribut CNIG | Source |
|---------------|--------|
| `site_id` | `<code INSEE>_<idtup>`, format imposé par le standard (§4.2) |
| `site_nom` | Nom du site en base (nom saisi, sinon rue la plus proche via la BAN) |
| `site_identif_date` | Date de création du site en base |
| `site_actu_date` | Date de l'export |
| `comm_nom` / `comm_insee` | Commune prédominante issue du cadastre |
| `bati_surface` | Surface bâtie BDNB |
| `unite_fonciere_surface` | Surface cadastrale du site |
| `unite_fonciere_refcad` | Identifiants des parcelles, séparés par des pipes |
| `urba_zone_type` | Zonage réglementaire (GPU) ramené aux codes du standard PLU |
| `urba_doc_type` | Déduit du zonage, pour la carte communale et le RNU seulement |
| `urba_zaer` | Zone d'accélération des énergies renouvelables |
| `desserte_commentaire` | Distances Mutafriches en clair (voie, transport, fret, électricité, chaleur) |
| `sol_pollution_commentaire` | Mention du référencement dans les bases ADEME, le cas échéant |
| `geompoint` | Centroïde du site, en WKT |
| `geomsurf` | Emprise du site (union des parcelles), en WKT |

### Depuis la connaissance terrain saisie par le partenaire (5)

| Attribut CNIG | Champ Mutafriches | Remarque |
|---------------|-------------------|----------|
| `bati_etat` | État du bâti et des infrastructures | « Pas de bâti » devient `sans objet` |
| `bati_patrimoine` | Valeur architecturale et historique | Seul « intérêt remarquable » vaut bâtiment d'intérêt |
| `bati_pollution` | Présence de pollution | Renseigné uniquement pour l'amiante |
| `sol_pollution_existe` | Présence de pollution | À défaut de saisie, un site référencé ADEME vaut `pollution supposée` |
| `proprio_personne` | Type de propriétaire | Seul un propriétaire public est à coup sûr une personne morale |

Ces cinq attributs ne sont renseignés que pour les sites qualifiés **dans le navigateur qui
lance l'export** : la saisie vit en `localStorage` (ADR-0021).

### Bloc source (4)

`source_nom` vaut `Mutafriches`, `source_producteur` le nom du partenaire, `source_url`
l'adresse de sa page, `source_contact` l'adresse de contact de l'équipe.

## Ce que Mutafriches ne renseigne pas

| Attribut | Pourquoi |
|----------|----------|
| `site_type` | La typologie de friche (industrielle, commerciale, etc.) n'est pas déduite des données. Attribut obligatoire : sort à `inconnu`, à reprendre pour un versement à Cartofriches |
| `site_statut`, `site_occupation`, `site_securite`, `site_reconv_*` | Connaissance de terrain hors périmètre de l'outil |
| `activite_*`, `bati_type`, `bati_nombre`, `bati_vacance`, `local_*_annee` | Non enrichis |
| `site_adresse` | Le nom de rue le plus proche n'est pas une adresse : mieux vaut vide qu'approximatif |
| `proprio_type` | Demande les codes catpro3 des fichiers fonciers |
| `proprio_nom` | Jamais exporté : donnée à caractère personnel (remarque RGPD du standard) |
| `urba_zone_type` pour une zone AU | L'enrichissement ne distingue pas AUc (ouverte) de AUs (bloquée) : sort à `inconnu` plutôt que d'affirmer une constructibilité non vérifiée |
| `desserte_distance` | Son format impose les trois distances routière, ferroviaire et fluviale ; le fluvial n'est pas enrichi. L'information disponible passe dans `desserte_commentaire` |

## Colonnes Mutafriches (hors standard)

Ajoutées seulement si l'option est cochée, en fin de fichier, et renseignées pour les seuls
sites évalués depuis ce navigateur : `mf_indice_<usage>` (7 usages), `mf_usage_prioritaire`,
`mf_fiabilite`, `mf_version_algorithme`. Le fichier n'est alors plus strictement conforme.

## Points d'attention

- **Ordre des coordonnées.** Le CSV écrit le WKT en `latitude longitude`, comme le fichier de
  référence du CNIG (`POINT(49.2527 3.9815)`) et donc à l'inverse de la convention WKT usuelle.
  Le GeoJSON, lui, est en `[longitude, latitude]` (RFC 7946). Aucune validation automatique ne
  couvre ce point : une inversion ne se voit qu'en ouvrant le fichier dans un SIG.
- **Sites écartés.** Le standard rend `comm_insee` et `geompoint` obligatoires : un site dont
  l'enrichissement n'a pas abouti est exclu du fichier et listé dans le rapport affiché après
  l'export. Ouvrir le site une fois dans la liste, puis relancer.
- **Export partiel.** L'export lit le cache d'enrichissement et ne réenrichit les manques que
  dans un budget de 20 secondes, pour rester sous le délai maximal d'une requête. Le pré-chauffe
  quotidien rend ce cas marginal.
- **Encodage.** CSV en UTF-8 avec BOM (sinon Excel casse les accents), séparateur virgule et
  fins de ligne CRLF, comme le fichier de référence du CNIG.
- **Analytics.** Les réenrichissements déclenchés par un export sont marqués `PREFETCH` : les
  compter comme des qualifications utilisateur fausserait les ratios d'usage (ADR-0041).

## Références techniques

- Modèle et correspondances : `packages/shared-types/src/cnig/`
- Endpoint et sérialiseurs : `apps/api/src/partenaires/export/`
- Interface : `apps/ui/src/features/partenaires/core/components/ExportSitesModal.tsx`
- Décision d'architecture : [ADR-0042](./adr/0042-export-cnig-sites-partenaires.md)
