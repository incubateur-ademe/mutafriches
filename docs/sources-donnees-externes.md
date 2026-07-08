# Sources de données externes

> Document généré automatiquement par `pnpm docs:sources:gen` à partir de
> `SOURCES_DONNEES` (packages/shared-types). Ne pas éditer à la main : la page UI
> `/documentation-donnees` et l'export PDF partagent la même source de vérité.

Pour chaque source de données externe mobilisée par Mutafriches : les champs récupérés,
la façon dont ils sont traités dans l'algorithme de mutabilité, et les critères d'évaluation
qu'ils alimentent.

## Comment sont utilisées ces données

L'analyse de mutabilité repose sur 27 critères, notés pour 7 usages possibles d'une friche.
17 critères sont **enrichis automatiquement** à partir des sources ci-dessous ; 10 sont
**saisis manuellement** par l'utilisateur. Chaque critère porte un poids ; le poids total
est de 29,5. La part des critères effectivement renseignés détermine l'indice de fiabilité
de l'analyse.

## Sources enrichies automatiquement

### Cadastre

- **Type** : API externe
- **Opérateur** : IGN — API Carto
- **Documentation** : https://apicarto.ign.fr/api/doc/cadastre

**Champs récupérés**

- Identifiant parcellaire (idu)
- Contenance (surface en m²)
- Section et numéro
- Commune et code INSEE
- Géométrie de la parcelle (centroïde, contour)

**Traitement dans l'algorithme**

La contenance cadastrale initialise la surface du site, classée par seuils (< 5 000 m², < 10 000 m², < 50 000 m², au-delà). La géométrie et les coordonnées servent de socle à tous les autres appels géolocalisés.

**Critères d'évaluation alimentés**

| Critère d'évaluation alimenté | Poids |
| --- | --- |
| Surface du site | 2 |

### Base de Données Nationale du Bâtiment (BDNB)

- **Type** : API externe
- **Opérateur** : CSTB
- **Documentation** : https://api.bdnb.io/

**Champs récupérés**

- Surface d'emprise au sol des bâtiments de la parcelle

**Traitement dans l'algorithme**

La surface bâtie est agrégée sur la parcelle puis classée par seuils. Elle sert aussi à dériver automatiquement le critère « raccordement à l'eau » (> 20 m² bâti => raccordé, cf. ADR-0019).

**Critères d'évaluation alimentés**

| Critère d'évaluation alimenté | Poids |
| --- | --- |
| Surface bâtie | 2 |

### Réseau électrique (Enedis Open Data)

- **Type** : API externe
- **Opérateur** : Enedis
- **Documentation** : https://data.enedis.fr/

**Champs récupérés**

- Distance au poste électrique le plus proche (rayon 5 km)
- Distance au réseau basse tension (rayon 500 m)

**Traitement dans l'algorithme**

La distance au point de raccordement le plus proche est classée par seuils (proche, intermédiaire, éloigné) pour évaluer la facilité de raccordement électrique.

**Critères d'évaluation alimentés**

| Critère d'évaluation alimenté | Poids |
| --- | --- |
| Distance au raccordement électrique | 1 |

### Transport et accessibilité

- **Type** : API externe
- **Opérateur** : API Annuaire de l'administration, IGN Géoplateforme, data.gouv.fr
- **Documentation** : https://www.geoportail.gouv.fr/

**Champs récupérés**

- Coordonnées de la mairie (API Annuaire) pour situer le centre-ville
- Tronçons routiers de type autoroutier / voie à grande circulation (IGN WFS BD TOPO)
- Arrêts de transport en commun (référentiel GTFS local, base PostGIS)

**Traitement dans l'algorithme**

La proximité de la mairie détermine si le site est en centre-ville (booléen). La distance à la voie de grande circulation la plus proche et la distance à l'arrêt de transport le plus proche (seuil 500 m) sont classées par seuils.

**Critères d'évaluation alimentés**

| Critère d'évaluation alimenté | Poids |
| --- | --- |
| Site en centre-ville | 1 |
| Distance aux transports en commun | 1 |
| Distance à une voie de grande circulation | 0.5 |

### Commerces et services de proximité (BPE)

- **Type** : Référentiel local
- **Opérateur** : INSEE — Base Permanente des Équipements
- **Documentation** : https://www.insee.fr/fr/metadonnees/source/serie/s1161

**Champs récupérés**

- Équipements et commerces géolocalisés autour du site (base PostGIS `raw_bpe`)

**Traitement dans l'algorithme**

La présence d'au moins un commerce ou service dans le rayon de recherche produit un booléen de proximité commerces / services.

**Critères d'évaluation alimentés**

| Critère d'évaluation alimenté | Poids |
| --- | --- |
| Proximité commerces et services | 1 |

### Logements vacants (LOVAC)

- **Type** : Référentiel local
- **Opérateur** : Cerema / DGALN
- **Documentation** : https://www.data.gouv.fr/fr/datasets/logements-vacants-du-parc-prive-par-commune-lovac/

**Champs récupérés**

- Taux de logements vacants de la commune (référentiel annuel local `raw_lovac`)

**Traitement dans l'algorithme**

Le taux communal de logements vacants est classé par seuils : un taux élevé pénalise les usages résidentiels (marché détendu) et favorise d'autres vocations.

**Critères d'évaluation alimentés**

| Critère d'évaluation alimenté | Poids |
| --- | --- |
| Taux de logements vacants | 1 |

### Zonage réglementaire et patrimonial (Géoportail de l'urbanisme)

- **Type** : API externe
- **Opérateur** : IGN — API Carto GPU
- **Documentation** : https://apicarto.ign.fr/api/doc/gpu

**Champs récupérés**

- Zone du PLU (libellé, type de zone : U, AU, A, N…)
- Secteurs de carte communale
- Servitudes d'utilité publique patrimoniales (AC1 monuments, AC2 sites, AC4 abords)

**Traitement dans l'algorithme**

La zone du PLU est normalisée en catégories réglementaires (urbaine habitat/activité/équipement, à urbaniser, agricole, naturelle…). Les servitudes patrimoniales déterminent le zonage patrimonial (site inscrit/classé, périmètre ABF).

**Critères d'évaluation alimentés**

| Critère d'évaluation alimenté | Poids |
| --- | --- |
| Zonage réglementaire | 2 |
| Zonage patrimonial | 1 |

### Zonage environnemental

- **Type** : API externe
- **Opérateur** : IGN — API Carto Nature
- **Documentation** : https://apicarto.ign.fr/api/doc/nature

**Champs récupérés**

- Natura 2000 (directives Habitats et Oiseaux)
- ZNIEFF de type 1 et 2
- Parcs naturels régionaux
- Réserves naturelles

**Traitement dans l'algorithme**

L'intersection ou la proximité avec un zonage de protection est normalisée en niveau (hors zone, proximité, ZNIEFF, Natura 2000, réserve naturelle), du plus favorable à l'aménagement au plus contraignant.

**Critères d'évaluation alimentés**

| Critère d'évaluation alimenté | Poids |
| --- | --- |
| Zonage environnemental | 1 |

### Zonage ABC (tension du marché du logement)

- **Type** : API externe
- **Opérateur** : DGALN — data.gouv.fr
- **Documentation** : https://www.data.gouv.fr/fr/datasets/zonage-abc/

**Champs récupérés**

- Zone ABC en vigueur de la commune (Abis, A, B1, B2, C)

**Traitement dans l'algorithme**

La zone ABC de la commune qualifie la tension du marché du logement et pondère la pertinence de l'usage résidentiel.

**Critères d'évaluation alimentés**

| Critère d'évaluation alimenté | Poids |
| --- | --- |
| Zonage ABC (logement) | 0.5 |

### GéoRisques — risques naturels

- **Type** : API externe
- **Opérateur** : BRGM / Ministère de la Transition écologique
- **Documentation** : https://www.georisques.gouv.fr/doc-api

**Champs récupérés**

- Aléa retrait-gonflement des argiles (niveau d'exposition)
- Cavités souterraines à proximité (rayon 1 km)
- Zones inondables : TRI, atlas des zones inondables (AZI), PAPI, PPR inondation

**Traitement dans l'algorithme**

L'aléa argiles est ramené à trois niveaux (aucun, faible/moyen, fort). La présence de cavités et l'exposition au risque d'inondation (agrégée sur plusieurs référentiels) sont ramenées à des booléens qui pénalisent le bâti et favorisent la renaturation.

**Critères d'évaluation alimentés**

| Critère d'évaluation alimenté | Poids |
| --- | --- |
| Retrait-gonflement des argiles | 0.5 |
| Cavités souterraines | 0.5 |
| Risque d'inondation | 1 |

### GéoRisques — risques technologiques et pollution

- **Type** : API externe
- **Opérateur** : BRGM / Ministère de la Transition écologique + ADEME
- **Documentation** : https://www.georisques.gouv.fr/doc-api

**Champs récupérés**

- Installations classées pour la protection de l'environnement (ICPE, statut Seveso)
- Secteurs d'information sur les sols (SIS)
- Sites et sols pollués (référentiel local ADEME, base PostGIS)

**Traitement dans l'algorithme**

La présence d'une ICPE ou d'un secteur SIS à proximité produit le booléen « risques technologiques » (favorable à l'industrie, défavorable au résidentiel). Les référentiels SIS et ADEME renseignent par ailleurs le caractère pollué du site.

**Critères d'évaluation alimentés**

| Critère d'évaluation alimenté | Poids |
| --- | --- |
| Présence de risques technologiques | 1 |

### Zones d'accélération des énergies renouvelables (ZAER)

- **Type** : API externe
- **Opérateur** : IGN Géoplateforme
- **Documentation** : https://data.geopf.fr/

**Champs récupérés**

- Appartenance à une zone d'accélération des EnR (nom, filière, détail de filière)

**Traitement dans l'algorithme**

L'appartenance à une zone d'accélération des EnR est ramenée à un niveau grossier (non, oui, ombrière) qui valorise l'usage photovoltaïque (cf. ADR-0013).

**Critères d'évaluation alimentés**

| Critère d'évaluation alimenté | Poids |
| --- | --- |
| Zone d'accélération des EnR | 1 |

## Critères saisis manuellement

Ces critères ne proviennent pas d'une source externe : ils sont renseignés par l'utilisateur
lors de la qualification du site. Le raccordement à l'eau est un cas particulier, dérivé
automatiquement de la surface bâtie (cf. ADR-0019).

| Critère d'évaluation alimenté | Poids |
| --- | --- |
| Type de propriétaire | 1 |
| Raccordement aux réseaux d'eau | 1 |
| Valeur patrimoniale des constructions | 1 |
| État du bâti | 2 |
| Présence de pollution | 2 |
| Qualité de la voie de desserte | 0.5 |
| Intérêt du paysage environnant | 1 |
| Trame verte et bleue | 1 |
| Présence d'espèces protégées | 1 |
| Présence d'une zone humide | 1 |
