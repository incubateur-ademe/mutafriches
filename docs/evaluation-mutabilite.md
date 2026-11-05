# Documentation de l'Algorithme Mutafriches

> **Objectif** : évaluer la mutabilité des friches urbaines pour 7 usages potentiels.
> **Version de l'algorithme** : la version courante et l'historique sont exposés par
> `GET /evaluation/algorithme/versions` ; la [matrice de scoring](matrice-scoring.md), générée
> depuis le code, l'affiche en tête avec les scores de chaque réponse.

---

## Vue d'ensemble

### Qu'est-ce que Mutafriches ?

Mutafriches est un algorithme d'aide à la décision qui évalue le potentiel de reconversion d'une friche urbaine.

Il analyse **32 critères** pour déterminer le meilleur usage futur parmi **7 possibilités**, en produisant :

- Un **indice de mutabilité** (0-100%) pour chaque usage
- Un **classement** des usages par ordre de pertinence
- Un **indice de fiabilité** (0-10) basé sur la complétude des données

### Les 7 usages évalués

Les libellés sont ceux de l'interface (`USAGE_LABELS`, `packages/shared-types`), à reprendre tels
quels dans la doc et Metabase. La clé est l'identifiant technique de l'API et de l'export CNIG.

| Usage | Clé | Description | Exemples |
|-------|-----|-------------|----------|
| **Habitat & commerce de proximité** | `residentiel` | Logements et commerces de proximité | Logements sociaux, résidences, commerces en rez-de-chaussée |
| **Équipement public** | `equipements` | Services publics et collectifs | École, médiathèque, gymnase, mairie annexe |
| **Équipement culturel & touristique** | `culture` | Lieux culturels et d'hébergement | Musée, théâtre, hôtel, galerie d'art |
| **Locaux d'activité** | `tertiaire` | Bureaux, artisanat, services | Bureaux, ateliers artisanaux, cabinets et études, services |
| **Industrie** | `industrie` | Production et stockage | Usines, entrepôts, centres de distribution |
| **Espace renaturé** | `renaturation` | Espaces naturels | Parcs urbains, jardins partagés, zones humides |
| **Centrale photovoltaïque au sol** | `photovoltaique` | Production d'énergie solaire | Centrales photovoltaïques, fermes solaires |

---

## Fonctionnement de l'algorithme

### Architecture générale

```
┌─────────────────────────────────────────────────────────────────────┐
│                     VUE D'ENSEMBLE DU PROCESSUS                     │
└─────────────────────────────────────────────────────────────────────┘

    ÉTAPE 1                   ÉTAPE 2                    ÉTAPE 3
 ┌─────────────┐         ┌─────────────┐          ┌─────────────┐
 │  COLLECTE   │         │ CONSULTATION│          │   CALCUL    │
 │     DES     │  ────→  │   MATRICE   │  ────→   │     DES     │
 │  32 CRITÈRES│         │  DE SCORING │          │   POINTS    │
 └─────────────┘         └─────────────┘          └─────────────┘
  22 enrichis             32 critères ×            Score × Poids
  10 saisis               7 usages                 pour chaque
                                                   usage
       │                        │                        │
       └────────────────────────┼────────────────────────┘
                                ↓
                        ┌─────────────┐
                        │   ÉTAPE 4   │
                        │   CALCUL    │
                        │  INDICES %  │
                        └─────────────┘
                         Avantages /
                   (Avantages + Contraintes)
                                ↓
                   ┌────────────┴────────────┐
                   ↓                         ↓
           ┌─────────────┐           ┌─────────────┐
           │   ÉTAPE 5   │           │   ÉTAPE 5   │
           │  CLASSEMENT │           │  FIABILITÉ  │
           │ et EXCLUSION│           │    0-10     │
           └─────────────┘           └─────────────┘
             Tri par %                 Poids
             exclus en fin             renseignés / 34
```

### Étape 1 : Collecte des données

L'algorithme collecte **32 critères** répartis en **2 sources** :

- **22 critères enrichis automatiquement** via le module d'enrichissement (APIs externes et référentiels locaux, cf. [enrichissement.md](enrichissement.md))
- **10 critères complémentaires** saisis manuellement par l'utilisateur (dont `raccordementEau`, désormais dérivé automatiquement de `surfaceBati`)

#### Synthèse des critères et leurs poids

| Source | Nb critères | Poids total |
|--------|------------|-------------|
| Enrichissement automatique | 22 | 22.5 |
| Données complémentaires (saisie) | 10 | 11.5 |
| **TOTAL** | **32** | **34** |

### Étape 2 : Matrice de scoring

L'algorithme utilise une **matrice de scoring unique** qui définit comment chaque valeur de critère impacte chaque usage.

Cette matrice contient 32 critères × 7 usages = 224 correspondances de base (davantage avec les valeurs multiples par critère). Sa version complète est [matrice-scoring.md](matrice-scoring.md).

#### Structure de la matrice

Pour chaque combinaison [Critère + Valeur] × [Usage], la matrice attribue un score qualitatif :

| Score qualitatif | Code | Valeur numérique | Signification |
|-----------------|------|------------------|---------------|
| **Très positif** | TP | +2 points | Critère très favorable, atout majeur pour l'usage |
| **Positif** | P | +1 point | Critère favorable, facilite l'usage |
| **Neutre** | N | 0.5 point, compté en avantages **et** en contraintes | Impact minimal, ni avantage ni contrainte |
| **Négatif** | NEG | -1 point | Critère défavorable, complique l'usage |
| **Très négatif** | TN | -2 points | Contrainte forte, complique fortement l'usage |
| **Ignoré** | - | 0 point | Donnée indisponible, sans résultat ou « Ne sait pas » (sauf distances, voir plus bas) |

#### Exemple de matrice pour le critère « Type de propriétaire »

| Valeur du critère | Habitat & commerce de proximité | Équipement public | Équipement culturel & touristique | Locaux d'activité | Industrie | Espace renaturé | Centrale photovoltaïque au sol |
|-------------------|-------------|---------------------|----------|-----------|------------|--------------|----------------|
| Public | TP (+2) | TP (+2) | P (+1) | N (0.5) | N (0.5) | P (+1) | P (+1) |
| Privé | N (0.5) | NEG (-1) | N (0.5) | N (0.5) | N (0.5) | TN (-2) | NEG (-1) |
| Mixte public et privé | N (0.5) | N (0.5) | N (0.5) | N (0.5) | N (0.5) | N (0.5) | N (0.5) |
| Copropriété / Indivision | NEG (-1) | NEG (-1) | NEG (-1) | NEG (-1) | NEG (-1) | TN (-2) | NEG (-1) |

### Étape 3 : Calcul des points pondérés

Pour chaque usage, l'algorithme transforme les scores qualitatifs en points numériques et applique les poids des critères.

#### Processus de calcul

**1. Conversion score → points**

Chaque score qualitatif de la matrice est converti en valeur numérique :

- **Très positif** → +2 points
- **Positif** → +1 point
- **Neutre** → 0.5 point
- **Négatif** → -1 point
- **Très négatif** → -2 points

**2. Application du poids**

Les points sont multipliés par le poids du critère (0.5, 1 ou 2) :

```
Points_pondérés = Points × Poids_critère
```

**3. Répartition entre avantages et contraintes**

- Score positif ou très positif → ajouté à la **somme des avantages**
- Score négatif ou très négatif → ajouté, en valeur absolue, à la **somme des contraintes**
- Score **neutre** → ajouté **aux deux sommes** à la fois

Le double comptage du neutre reproduit le fichier Excel d'origine : un critère neutre rapproche
l'indice de 50 % sans le faire basculer.

#### Exemple concret

| Critère | Valeur | Score pour Habitat & commerce de proximité | Points | Poids | Avantages | Contraintes |
|---------|--------|------------------------|--------|-------|-----------|-------------|
| Type de propriétaire | Public | Très positif | +2 | 1 | 2 | |
| Surface du site | 45 000 m² | Négatif | -1 | 2 | | 2 |
| En centre-ville | Oui | Très positif | +2 | 1 | 2 | |
| Présence de pollution | Non | Très positif | +2 | 2 | 4 | |
| Distance aux transports en commun | ≥ 500 m | Neutre | 0.5 | 1 | 0.5 | 0.5 |

**Résultat pour l'usage Habitat & commerce de proximité :**

- Somme des avantages = 2 + 2 + 4 + 0.5 = **8.5 points**
- Somme des contraintes = 2 + 0.5 = **2.5 points**

Ce calcul est répété pour chacun des 7 usages avec les scores correspondants de la matrice.

### Étape 4 : Calcul de l'indice de mutabilité

L'indice représente le **ratio entre avantages et contraintes** pour chaque usage, exprimé en pourcentage.

#### Formule de calcul

```
Indice = Somme_Avantages / (Somme_Avantages + Somme_Contraintes) × 100
```

L'indice est arrondi à une décimale.

#### Interprétation de l'indice

- **100%** = Aucune contrainte, que des avantages
- **75%** = 3 fois plus d'avantages que de contraintes
- **50%** = Équilibre parfait entre avantages et contraintes
- **25%** = 3 fois plus de contraintes que d'avantages
- **0%** = Aucun avantage, que des contraintes

#### Niveaux de potentiel

| Indice | Potentiel |
|--------|-----------|
| ≥ 70 % | Excellent |
| ≥ 60 % | Très bon |
| ≥ 50 % | Bon |
| ≥ 40 % | Moyen |
| < 40 % | Faible |
| Usage exclu (étape 5b) | Exclu |

#### Cas particulier

Si aucun critère n'est scoré (tous indisponibles ou « Ne sait pas »), les deux sommes sont
nulles et l'indice vaut 0 %.

#### Exemple de calcul

Reprenons l'usage Habitat & commerce de proximité de l'étape 3 :

- Somme des avantages = 8.5 points
- Somme des contraintes = 2.5 points
- **Indice = 8.5 / (8.5 + 2.5) × 100 = 77.3%**, potentiel « Excellent »

### Étape 5 : Classement, exclusions et fiabilité

#### 5a. Classement des usages

Les 7 usages sont classés par ordre décroissant d'indice de mutabilité, les usages exclus (voir
5b) étant relégués en fin de classement, triés entre eux de la même façon. Le meilleur usage est
donc toujours celui de rang 1, sauf si tous les usages sont exclus.

#### 5b. Critères excluants (depuis v1.16)

Certaines caractéristiques rendent un usage impossible, quel que soit son indice. Elles sont évaluées **après** le calcul des indices, sous forme de règles binaires indépendantes de la matrice de scoring (ADR-0048) :

| Règle | Condition | Usages exclus |
|-------|-----------|---------------|
| Zone d'exclusion des EnR (loi APER) | `zoneAccelerationEnr` = Exclu des zones d'accélération ENR | Centrale photovoltaïque au sol |
| Zone humide et espèces protégées | `presenceZoneHumide` = Oui **et** `presenceEspecesProtegees` = Oui | Industrie, Locaux d'activité |

- Toutes les conditions d'une règle doivent être réunies. « Ne sait pas » ne déclenche jamais d'exclusion.
- Un usage exclu garde son indice calculé, exposé par l'API pour compatibilité, mais il est relégué en fin de classement, avec `exclu: true`, `potentiel: "Exclu"` et la liste `criteresExcluants`. L'interface n'affiche pas son pourcentage, l'écarte du podium et marque ces critères « Incompatible » dans le détail de l'usage.
- Les poids, la matrice et la fiabilité ne changent pas.

#### 5c. Indice de fiabilité

Indicateur de confiance basé sur la somme des poids des critères renseignés :

```
Fiabilité = (Poids_critères_renseignés / Poids_total) × 10, arrondie au 0.5 le plus proche
```

Le poids total est de **34** (somme de tous les poids des 32 critères). Chaque critère contribue proportionnellement à son poids :

- **Renseigné** : toute valeur, y compris `null` (la recherche a abouti sans résultat, par exemple aucun arrêt de transport dans le rayon)
- **Non renseigné** : `undefined` (donnée indisponible, erreur technique) et « Ne sait pas »

#### Niveaux de fiabilité

Libellés affichés dans l'interface (`NIVEAUX_FIABILITE`, `packages/shared-types`) :

| Note | Niveau | Signification |
|------|--------|---------------|
| ≥ 9 | Très fiable | Analyse complète avec toutes les données disponibles |
| ≥ 7 | Fiable | Données analysées avec un niveau de confiance élevé |
| ≥ 5 | Moyennement fiable | Analyse partielle, certaines données manquantes |
| ≥ 3 | Peu fiable | Données insuffisantes pour une analyse complète |
| < 3 | Très peu fiable | Données très incomplètes, résultats indicatifs uniquement |

#### Note importante

La fiabilité **ne modifie pas** le classement. C'est un indicateur séparé qui aide l'utilisateur à juger de la robustesse des résultats.

---

## Liste des 32 critères actifs

> Scores de chaque réponse et tranche pour les 7 usages : voir [matrice-scoring.md](matrice-scoring.md).

### Critères enrichis automatiquement (22)

| # | Critère | Poids | Valeurs | Champ DTO |
|---|---------|-------|---------|-----------|
| 1 | **Surface du site (m²)** | 2 | < 10 000 / 10 000-15 000 / 15 000-50 000 / > 50 000 | `surfaceSite` |
| 2 | **Emprise au sol du bâti (m²)** | 2 | < 5 000 ou pas de bâti / 5 000-10 000 / > 10 000 | `surfaceBati` |
| 3 | **En centre-ville ou centre-bourg** | 1 | Oui / Non | `siteEnCentreVille` |
| 4 | **Distance par la route à l'accès autoroutier (km ; DTO en m)** | 0.5 | < 1 / 1-2 / 2-5 / ≥ 5 (ou aucun à moins de 50 km) | `distanceAutoroute` |
| 5 | **Distance aux transports en commun (m)** | 1 | < 500 / ≥ 500 | `distanceTransportCommun` |
| 6 | **Commerces et services à proximité** | 1 | Oui / Non | `proximiteCommercesServices` |
| 7 | **Distance au raccordement électrique (km ; DTO en m)** | 1 | < 1 / 1-5 / ≥ 5 (ou aucune infrastructure trouvée) | `distanceRaccordementElectrique` |
| 8 | **Taux de logements vacants (%)** | 1 | ≤ 7 / 7-8 / 8-10 / > 10 | `tauxLogementsVacants` |
| 9 | **Risque retrait-gonflement des argiles** | 0.5 | Aucun / Faible ou moyen / Fort | `risqueRetraitGonflementArgile` |
| 10 | **Risque cavités souterraines** | 0.5 | Non / Oui | `risqueCavitesSouterraines` |
| 11 | **Risque inondation** | 1 | Non / Oui (TRI/AZI/PAPI/PPR) | `risqueInondation` |
| 12 | **Risques technologiques** | 1 | Oui / Non | `presenceRisquesTechnologiques` |
| 13 | **Zonage environnemental** | 1 | Hors zone / Natura 2000 / ZNIEFF type 1 / 2 / Réserve naturelle / À proximité d'une zone protégée | `zonageEnvironnemental` |
| 14 | **Zonage réglementaire (PLU)** | 2 | Zone urbaine (U) / Zone urbaine - habitat / Zone urbaine - équipement / Zone urbaine - activité / Zone à urbaniser (AU) / Zone à vocation d'activités / Secteur ouvert à la construction / Secteur non ouvert à la construction / Secteur avec règlement d'urbanisme / Zone agricole (A) / Zone naturelle (N) | `zonageReglementaire` |
| 15 | **Zonage patrimonial** | 1 | Non concerné / Site inscrit / classé / Périmètre ABF | `zonagePatrimonial` |
| 16 | **Zone d'accélération des EnR (ZAER)** | 1 | Non / Oui / Oui - PV ombrière / Exclu des zones d'accélération ENR | `zoneAccelerationEnr` |
| 17 | **Zonage ABC (tension du logement)** | 0.5 | A bis / A / B1 / B2 / C | `zonageAbcLogement` |
| 18 | **Distance à une ITE fret** | 0.5 | Moins d'1 km, en bon état / Moins d'1 km, en mauvais état / Plus d'1 km | `distanceIte` |
| 19 | **Distance au réseau de chaleur (m)** | 1 | < 500 / ≥ 500 (ou aucun réseau) | `distanceReseauChaleur` |
| 20 | **Quartier prioritaire de la ville (QPV)** | 1 | Oui / Non | `siteEnQpv` |
| 21 | **Saturation du réseau électrique pour les projets EnR** | 1 | Oui / Non (zone saturée selon la carte Enedis/RTE ; une zone en tension n'est pas saturée) | `saturationReseauEnr` |
| 22 | **Au sein d'une zone d'activité économique** | 1 | Oui / Non (centroïde du site dans un site d'activité Fusac de type « zone d'activité économique ») | `siteEnZae` |

> **Unité des distances** : `distanceAutoroute` et `distanceRaccordementElectrique` sont fournies en **mètres** par l'enrichissement (et stockées ainsi dans le DTO) puis converties en **km** à la frontière de l'algorithme (`metresVersKm` dans `extraireCriteres`, v1.10 / ADR-0027). Les seuils ci-dessus sont en km. `distanceTransportCommun` et `distanceReseauChaleur` restent en mètres des deux côtés.

> **Distances sans résultat** : quand la recherche aboutit sans résultat (`null`), trois distances sont scorées dans leur tranche la plus éloignée plutôt qu'ignorées, et comptent donc dans la fiabilité : accès autoroutier (aucune entrée à moins de 50 km, ADR-0047), raccordement électrique (aucune infrastructure Enedis trouvée) et réseau de chaleur (aucun réseau exploitable, ADR-0036).

> **Locaux d'activité** (v1.17) : l'usage `tertiaire` est rééquilibré vers l'artisanat et les petites activités, qui s'implantent aussi hors des centres et sur des parcelles modestes. **Centre-ville** : neutre (avant : positif), hors centre positif (avant : négatif). **Surface du site** : positif sous 1,5 ha (avant : neutre), neutre à partir de 1,5 ha (avant : négatif). **Commerces et services** : leur absence est neutre (avant : négatif) ; leur présence reste positive.

> **Zone d'activité économique** (v1.18, locaux d'activité très positifs en v1.19) : en zone, **Industrie** et **Locaux d'activité** très positifs (v1.18 : positif pour les locaux d'activité), **Habitat & commerce de proximité** négatif, les quatre autres usages neutres ; hors zone, neutre sur les sept usages. Donnée : base Fusac du Cerema, millésime 2025, sites d'activité de type « zone d'activité économique » en activité (hors outre-mer). Test sur le **centroïde** du site : un grand site à cheval sur une zone, centre dehors, est classé hors zone. Fusac n'est pas un zonage réglementaire : plus de la moitié des zones viennent d'OpenStreetMap, le reste de zones d'urbanisme à vocation économique (ADR-0049). Donnée indisponible (`undefined`) hors référentiel ou hors métropole : le critère est ignoré et ne compte pas dans la fiabilité.

> **Accès autoroutier** : `distanceAutoroute` est la distance **par la route** jusqu'à l'entrée d'autoroute ou de voie express la plus proche (ADR-0047).

### Critères complémentaires saisis (10)

| # | Critère | Poids | Valeurs | Champ DTO |
|---|---------|-------|---------|-----------|
| 23 | **Type de propriétaire** | 1 | Public / Privé / Mixte public et privé / Copropriété / Indivision / Ne sait pas | `typeProprietaire` |
| 24 | **Raccordement à l'eau** | 1 | Oui / Non — dérivé automatiquement de `surfaceBati` (ADR-0019), plus saisi | `raccordementEau` |
| 25 | **État du bâti et des infrastructures** | 2 | Bâti intact / Bâti faiblement dégradé (scores identiques à intact, cf. ADR-0025) / Bâti moyennement dégradé / Bâti dégradé de manière hétérogène / Bâti très dégradé / Pas de bâti / Ne sait pas | `etatBatiInfrastructure` |
| 26 | **Présence de pollution** | 2 | Non / Déjà gérée / Oui - composés volatils / Oui - amiante / Oui - autres composés / Ne sait pas | `presencePollution` |
| 27 | **Valeur architecturale et historique** | 1 | Bâti sans qualité patrimoniale particulière / Bâti courant, mais cohérent avec le site / Bâti à valeur patrimoniale remarquable / Pas de bâti / Ne sait pas | `valeurArchitecturaleHistorique` |
| 28 | **Qualité du paysage** | 1 | Paysage dégradé ou sans qualité notable / Paysage courant / Paysage remarquable / Ne sait pas | `qualitePaysage` |
| 29 | **Qualité de la voie de desserte** | 0.5 | Accessible / Accessibilité limitée / Accessibilité dégradée / Ne sait pas | `qualiteVoieDesserte` |
| 30 | **Trame verte et bleue** | 1 | Hors trame / Réservoir de biodiversité / Corridor à préserver / Corridor à restaurer / Ne sait pas | `trameVerteEtBleue` |
| 31 | **Présence d'espèces protégées** | 1 | Oui / Non / Ne sait pas | `presenceEspecesProtegees` |
| 32 | **Présence de zone humide** | 1 | Oui / Non / Ne sait pas | `presenceZoneHumide` |

## Résultats publiés par commune

Chaque calcul alimente la [table attributaire](./table-attributaire.md), lisible par
`GET /api/attributaire/sites?codeInsee=` : une ligne par site, indices recalculés avec la
version courante de l'algorithme, sur la saisie de la dernière évaluation, ou avec « ne sait
pas » pour les 9 critères manuels si le site n'a jamais été qualifié. Ces indices peuvent donc
différer de ceux affichés lors d'une évaluation faite avec une version antérieure.

---

> **Contact** : <contact@mutafriches.beta.gouv.fr>
> **Repository** : [https://github.com/incubateur-ademe/mutafriches](https://github.com/incubateur-ademe/mutafriches)
