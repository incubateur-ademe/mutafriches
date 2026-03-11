# Documentation de l'Algorithme Mutafriches

> **Version** : 2.0
> **Date** : Mars 2026
> **Objectif** : Évaluer la mutabilité des friches urbaines pour 7 usages potentiels

---

## Vue d'ensemble

### Qu'est-ce que Mutafriches ?

Mutafriches est un algorithme d'aide à la décision qui évalue le potentiel de reconversion d'une friche urbaine.

Il analyse **24 critères** pour déterminer le meilleur usage futur parmi **7 possibilités**, en produisant :

- Un **indice de mutabilité** (0-100%) pour chaque usage
- Un **classement** des usages par ordre de pertinence
- Un **indice de fiabilité** (0-10) basé sur la complétude des données

### Les 7 usages évalués

| Usage | Code | Description | Exemples |
|-------|------|-------------|----------|
| **Résidentiel ou mixte** | `residentiel` | Habitat et commerces de proximité | Logements sociaux, résidences, commerces en RDC |
| **Équipements publics** | `equipements` | Services publics et collectifs | École, médiathèque, gymnase, mairie annexe |
| **Culturel, touristique** | `culture` | Lieux culturels et d'hébergement | Musée, théâtre, hôtel, galerie d'art |
| **Tertiaire** | `tertiaire` | Bureaux et services | Sièges sociaux, espaces de coworking, services |
| **Industriel, logistique** | `industrie` | Production et stockage | Usines, entrepôts, centres de distribution |
| **Renaturation** | `renaturation` | Espaces naturels | Parcs urbains, jardins partagés, zones humides |
| **Photovoltaïque au sol** | `photovoltaique` | Production d'énergie solaire | Centrales photovoltaïques, fermes solaires |

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
 │  24 CRITÈRES│         │  DE SCORING │          │   POINTS    │
 └─────────────┘         └─────────────┘          └─────────────┘
  État friche             24 critères ×            Score × Poids
  Situation               7 usages =               Pour chaque
  Réglementation          168 valeurs              usage
  Patrimoine              
  Écosystème              
       │                        │                        │
       └────────────────────────┼────────────────────────┘
                                ↓
                        ┌─────────────┐
                        │   ÉTAPE 4   │
                        │   CALCUL    │
                        │  INDICES %  │
                        └─────────────┘
                         Positif/(P+N)
                         pour 7 usages
                                ↓
                   ┌────────────┴────────────┐
                   ↓                         ↓
           ┌─────────────┐           ┌─────────────┐
           │   ÉTAPE 5   │           │   ÉTAPE 5   │
           │  CLASSEMENT │           │  FIABILITÉ  │
           │  1er → 7ème │           │    0-10     │
           └─────────────┘           └─────────────┘
             Tri par %                 Poids/25.5
```

### Étape 1 : Collecte des données

L'algorithme collecte **24 critères** répartis en **2 sources** :

- **17 critères enrichis automatiquement** via le module d'enrichissement (APIs externes)
- **7 critères complémentaires** saisis manuellement par l'utilisateur

#### Synthèse des critères et leurs poids

| Source | Nb critères | Poids total |
|--------|------------|-------------|
| Enrichissement automatique | 17 | 17.5 |
| Données complémentaires (saisie) | 7 | 8 |
| **TOTAL** | **24** | **25.5** |

### Étape 2 : Matrice de scoring

L'algorithme utilise une **matrice de scoring unique** qui définit comment chaque valeur de critère impacte chaque usage.

Cette matrice contient 24 critères × 7 usages = 168 correspondances de base (davantage avec les valeurs multiples par critère).

#### Structure de la matrice

Pour chaque combinaison [Critère + Valeur] × [Usage], la matrice attribue un score qualitatif :

| Score qualitatif | Code | Valeur numérique | Signification |
|-----------------|------|------------------|---------------|
| **Très positif** | TP | +2 points | Critère très favorable, atout majeur pour l'usage |
| **Positif** | P | +1 point | Critère favorable, facilite l'usage |
| **Neutre** | N | +0.5 point | Impact minimal, ni avantage ni contrainte |
| **Négatif** | NEG | -1 point | Critère défavorable, complique l'usage |
| **Très négatif** | TN | -2 points | Contrainte forte, peut bloquer l'usage |
| **Non applicable** | - | 0 point | Donnée manquante ou "Ne sait pas" (ignoré) |

#### Exemple de matrice pour le critère "Propriétaire"

| Valeur du critère | Résidentiel | Équipements publics | Culturel | Tertiaire | Industriel | Renaturation | Photovoltaïque |
|-------------------|-------------|---------------------|----------|-----------|------------|--------------|----------------|
| Public | TP (+2) | TP (+2) | P (+1) | N (+0.5) | N (+0.5) | P (+1) | P (+1) |
| Privé | N (+0.5) | NEG (-1) | N (+0.5) | N (+0.5) | N (+0.5) | TN (-2) | NEG (-1) |
| Copropriété | NEG (-1) | NEG (-1) | NEG (-1) | NEG (-1) | NEG (-1) | TN (-2) | NEG (-1) |

La matrice complète est stockée dans un fichier de configuration et consultée pour chaque critère renseigné.

### Étape 3 : Calcul des points pondérés

Pour chaque usage, l'algorithme transforme les scores qualitatifs en points numériques et applique les poids des critères.

#### Processus de calcul

**1. Conversion score → points**

Chaque score qualitatif de la matrice est converti en valeur numérique :

- **Très positif** → +2 points
- **Positif** → +1 point
- **Neutre** → +0.5 point
- **Négatif** → -1 point
- **Très négatif** → -2 points

**2. Application du poids**

Les points sont multipliés par le poids du critère (0.5, 1 ou 2) :

```
Points_pondérés = Points × Poids_critère
```

**3. Séparation pour le calcul d'indice**

Pour préparer le calcul de l'indice (étape 4), on sépare les points pondérés en deux groupes :

- **Somme des avantages** : addition de tous les points pondérés ≥ 0
- **Somme des contraintes** : addition de tous les points pondérés < 0 (convertis en valeur absolue)

Cette séparation permet de calculer le ratio avantages/contraintes plutôt qu'une simple différence.

#### Exemple concret

| Critère | Valeur | Score pour Résidentiel | Points | Poids | Points pondérés |
|---------|--------|------------------------|--------|-------|-----------------|
| Propriétaire | Public | Très positif | +2 | 1 | **+2** |
| Surface | 45 000 m² | Négatif | -1 | 2 | **-2** |
| Centre-ville | Oui | Très positif | +2 | 2 | **+4** |
| Pollution | Non | Très positif | +2 | 2 | **+4** |

**Résultat pour usage Résidentiel :**

- Somme des avantages = 2 + 4 + 4 = **10 points**
- Somme des contraintes = |−2| = **2 points**

Ce calcul est répété pour chacun des 7 usages avec les scores correspondants de la matrice. Ces sommes seront utilisées à l'étape 4 pour calculer l'indice de mutabilité.

### Étape 4 : Calcul de l'indice de mutabilité

L'indice représente le **ratio entre avantages et contraintes** pour chaque usage, exprimé en pourcentage.

#### Formule de calcul

```
Indice = Somme_Avantages / (Somme_Avantages + Somme_Contraintes) × 100
```

#### Interprétation de l'indice

- **100%** = Aucune contrainte, que des avantages
- **75%** = 3 fois plus d'avantages que de contraintes
- **50%** = Équilibre parfait entre avantages et contraintes
- **25%** = 3 fois plus de contraintes que d'avantages
- **0%** = Aucun avantage, que des contraintes

#### Cas particuliers

- Si aucun critère n'est renseigné ou tous sont "Ne sait pas" → Indice = 0%
- Si somme totale = 0 (cas très rare) → Indice = 0%

#### Exemple de calcul

Reprenons l'usage Résidentiel de l'étape 3 :

- Somme des avantages = 10 points
- Somme des contraintes = 2 points
- **Indice = 10 / (10 + 2) × 100 = 83.3%**

Interprétation : Cet usage présente beaucoup plus d'avantages que de contraintes.

### Étape 5 : Classement et fiabilité

#### 5a. Classement des usages

Les 7 usages sont classés par ordre décroissant d'indice de mutabilité :

| Rang | Usage | Indice | Signification |
|------|-------|--------|---------------|
| 1 | Usage avec le meilleur ratio | Ex: 83% | Prioritaire |
| 2-3 | Usages alternatifs viables | Ex: 65-75% | À considérer |
| 4-5 | Usages possibles mais contraints | Ex: 40-50% | Difficiles |
| 6-7 | Usages peu adaptés | Ex: <30% | Déconseillés |

#### 5b. Indice de fiabilité

Indicateur de confiance basé sur la somme des poids des critères renseignés :

```
Fiabilité = (Poids_critères_renseignés / Poids_total) × 10
```

Le poids total est de **25.5** (somme de tous les poids des 24 critères). Chaque critère contribue proportionnellement à son poids.

#### Grille d'interprétation

| Fiabilité | Interprétation | Recommandation |
|-----------|-----------------|----------------|
| **9-10/10** | Excellente | Résultats fiables pour décision |
| **7-8/10** | Bonne | Résultats exploitables |
| **5-6/10** | Moyenne | Compléter les données si possible |
| **< 5/10** | Insuffisante | Données trop partielles, prudence |

#### Note importante

La fiabilité **ne modifie pas** le classement. C'est un indicateur séparé qui aide l'utilisateur à juger de la robustesse des résultats.

---

## Liste des 24 critères actifs

### Critères enrichis automatiquement (17)

| # | Critère | Poids | Valeurs | Champ DTO |
|---|---------|-------|---------|-----------|
| 1 | **Surface du site (m²)** | 2 | < 10 000 / 10-15 000 / 15-50 000 / > 50 000 | `surfaceSite` |
| 2 | **Surface bâtie (m²)** | 2 | < 5 000 / 5-10 000 / > 10 000 | `surfaceBati` |
| 3 | **En centre-ville** | 1 | Oui / Non | `siteEnCentreVille` |
| 4 | **Distance autoroute (km)** | 0.5 | < 1 / 1-2 / 2-5 / > 5 | `distanceAutoroute` |
| 5 | **Distance transport en commun (m)** | 1 | < 500 / >= 500 | `distanceTransportCommun` |
| 6 | **Commerces/services à proximité** | 1 | Oui / Non | `proximiteCommercesServices` |
| 7 | **Distance raccordement électrique (km)** | 1 | < 1 / 1-5 / > 5 | `distanceRaccordementElectrique` |
| 8 | **Taux logements vacants (%)** | 1 | <= 7 / 7-8 / 8-10 / > 10 | `tauxLogementsVacants` |
| 9 | **Risque RGA** | 0.5 | Aucun / Faible ou moyen / Fort | `risqueRetraitGonflementArgile` |
| 10 | **Risque cavités souterraines** | 0.5 | Non / Oui | `risqueCavitesSouterraines` |
| 11 | **Risque inondation** | 1 | Non / Oui (TRI/AZI/PAPI/PPR) | `risqueInondation` |
| 12 | **Risque technologique** | 1 | Oui / Non | `presenceRisquesTechnologiques` |
| 13 | **Zonage environnemental** | 1 | Hors zone / Réserve naturelle / Natura 2000 / ZNIEFF / Proximité zone | `zonageEnvironnemental` |
| 14 | **Zonage réglementaire (PLU)** | 2 | Zone U (habitat/équipement/activité) / AU / Activités / CC constructible / CC non-constructible / Agricole / Naturelle / Ne sait pas | `zonageReglementaire` |
| 15 | **Zonage patrimonial** | 1 | Non concerné / Site inscrit-classé / Périmètre ABF | `zonagePatrimonial` |
| 16 | **Trame verte et bleue** | 1 | Hors trame / Réservoir biodiversité / Corridor à préserver / Corridor à restaurer / Ne sait pas | `trameVerteEtBleue` |
| 17 | **Zone ZAER (ENR)** | 1 | Non / Oui / Oui avec PV ombrière | `zoneAccelerationEnr` |

### Critères complémentaires saisis (7)

| # | Critère | Poids | Valeurs | Champ DTO |
|---|---------|-------|---------|-----------|
| 18 | **Type de propriétaire** | 1 | Public / Privé / Copropriété-indivision / Mixte / Ne sait pas | `typeProprietaire` |
| 19 | **Raccordement eau** | 1 | Oui / Non / Ne sait pas | `raccordementEau` |
| 20 | **État du bâti et infrastructure** | 2 | Dégradation inexistante / Très importante / Moyenne / Hétérogène / Pas de bâti / Ne sait pas | `etatBatiInfrastructure` |
| 21 | **Présence de pollution** | 2 | Non / Déjà gérée / Oui-composés volatils / Oui-autres composés / Oui-amiante / Ne sait pas | `presencePollution` |
| 22 | **Valeur architecturale et historique** | 1 | Sans intérêt / Ordinaire / Intérêt remarquable / Pas de bâti / Ne sait pas | `valeurArchitecturaleHistorique` |
| 23 | **Qualité du paysage** | 1 | Sans intérêt / Ordinaire / Intérêt remarquable / Ne sait pas | `qualitePaysage` |
| 24 | **Qualité voie de desserte** | 0.5 | Accessible / Dégradée / Peu accessible / Ne sait pas | `qualiteVoieDesserte` |

---

> **Dernière mise à jour** : Mars 2026
> **Contact** : <samir.benfares@beta.gouv.fr>
> **Repository** : [https://github.com/incubateur-ademe/mutafriches](https://github.com/incubateur-ademe/mutafriches)
