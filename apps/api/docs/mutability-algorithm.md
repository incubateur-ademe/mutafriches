# 📚 Documentation de l'Algorithme Mutafriches

> **Version** : 1.0  
> **Date** : Aout 2025  
> **Objectif** : Évaluer la mutabilité des friches urbaines pour 7 usages potentiels

---

## 🎯 Vue d'ensemble

### Qu'est-ce que Mutafriches ?

Mutafriches est un algorithme d'aide à la décision qui évalue le potentiel de reconversion d'une friche urbaine.

Il analyse **26 critères** pour déterminer le meilleur usage futur parmi **7 possibilités**, en produisant :

- ✅ Un **indice de mutabilité** (0-100%) pour chaque usage
- 🏆 Un **classement** des usages par ordre de pertinence
- 📊 Un **indice de fiabilité** (0-10) basé sur la complétude des données

### Les 7 usages évalués

| Usage | Description | Exemples |
|-------|-------------|----------|
| 🏘️ **Résidentiel ou mixte** | Habitat et commerces de proximité | Logements sociaux, résidences, commerces en RDC |
| 🏛️ **Équipements publics** | Services publics et collectifs | École, médiathèque, gymnase, mairie annexe |
| 🎭 **Culturel, touristique** | Lieux culturels et d'hébergement | Musée, théâtre, hôtel, galerie d'art |
| 🏢 **Tertiaire** | Bureaux et services | Sièges sociaux, espaces de coworking, services |
| 🏭 **Industriel, logistique** | Production et stockage | Usines, entrepôts, centres de distribution |
| 🌳 **Renaturation** | Espaces naturels | Parcs urbains, jardins partagés, zones humides |
| ☀️ **Photovoltaïque au sol** | Production d'énergie solaire | Centrales photovoltaïques, fermes solaires |

---

## 🔧 Fonctionnement de l'algorithme

### Architecture générale

```
┌─────────────────────────────────────────────────────────────────────┐
│                     VUE D'ENSEMBLE DU PROCESSUS                     │
└─────────────────────────────────────────────────────────────────────┘

    ÉTAPE 1                   ÉTAPE 2                    ÉTAPE 3
 ┌─────────────┐         ┌─────────────┐          ┌─────────────┐
 │  COLLECTE   │         │ CONSULTATION│          │   CALCUL    │
 │     DES     │  ────→  │   MATRICE   │  ────→   │     DES     │
 │  26 CRITÈRES│         │  DE SCORING │          │   POINTS    │
 └─────────────┘         └─────────────┘          └─────────────┘
  État friche             26 critères ×            Score × Poids
  Situation               7 usages =               Pour chaque
  Réglementation          182 valeurs              usage
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
             Tri par %                 Nb renseignés/26
```

### Étape 1 : Collecte des données

L'algorithme collecte **26 critères** répartis en **5 catégories** :

#### 📊 Synthèse des critères et leurs poids

| Catégorie | Nb critères | Poids total | % du total |
|-----------|------------|-------------|------------|
| État de la friche | 6 | 10 | 36% |
| Situation | 9 | 8 | 29% |
| Réglementation | 4 | 4 | 14% |
| Patrimoine | 2 | 2 | 7% |
| Écosystème | 5 | 5 | 18% |
| **TOTAL** | **26** | **27.5** | **100%** |

### Étape 2 : Matrice de scoring

L'algorithme utilise une **matrice de scoring unique** qui définit comment chaque valeur de critère impacte chaque usage.

Cette matrice contient 26 critères × 7 usages = 182 correspondances.

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

Indicateur de confiance basé sur la complétude des données :

```
Fiabilité = (Nombre_critères_renseignés / 26) × 10
```

#### Grille d'interprétation

| Fiabilité | Critères renseignés | Interprétation | Recommandation |
|-----------|-------------------|-----------------|----------------|
| **9-10/10** | 24-26 sur 26 | Excellente | Résultats fiables pour décision |
| **7-8/10** | 19-23 sur 26 | Bonne | Résultats exploitables |
| **5-6/10** | 13-18 sur 26 | Moyenne | Compléter les données si possible |
| **< 5/10** | < 13 sur 26 | Insuffisante | Données trop partielles, prudence |

#### Note importante

La fiabilité **ne modifie pas** le classement. C'est un indicateur séparé qui aide l'utilisateur à juger de la robustesse des résultats.

---

## 📋 Liste détaillée des 26 critères avec mapping DTO

### 1️⃣ État de la friche (6 critères)

| # | Critère | Poids | Valeurs possibles | Champ DTO | Interface |
|---|---------|-------|-------------------|-----------|-----------|
| 1 | **Propriétaire** | 1 | Public / Privé / Copropriété / Mixte | `typeProprietaire` | ParcelleManualData |
| 2 | **Surface de la parcelle (m²)** | 2 | < 10 000 / 10-15 000 / 15-50 000 / > 50 000 | `surfaceSite` | ParcelleAutoData |
| 3 | **Emprise au sol du bâti (m²)** | 2 | < 10 000 / ≥ 10 000 | `surfaceBati` | ParcelleAutoData |
| 4 | **État du bâti et infrastructure** | 2 | En ruine / Forte dégradation / État moyen / Bon état / État remarquable / Bâtiments hétérogènes / Pas de bâti | `etatBatiInfrastructure` | ParcelleManualData |
| 5 | **Présence de pollution** | 2 | Non / Déjà gérée / Oui-composés volatils / Oui-autres composés / Ne sait pas | `presencePollution` | ParcelleManualData |
| 6 | **Terrain en pente (>12%)** | 1 | Oui / Non / Ne sait pas | **⚠️ NON MAPPÉ** | - |

### 2️⃣ Situation (9 critères)

| # | Critère | Poids | Valeurs possibles | Champ DTO | Interface |
|---|---------|-------|-------------------|-----------|-----------|
| 7 | **En centre-ville ou centre-bourg** | 2 | Oui / Non / Ne sait pas | `siteEnCentreVille` | ParcelleAutoData |
| 8 | **Taux de logements vacants (%)** | 1 | ≤4 / 4-6 / 6-10 / 10-13 / >13 | `tauxLogementsVacants` | ParcelleAutoData |
| 9 | **Terrain viabilisé** | 1 | Oui / Non / Ne sait pas | `terrainViabilise` *(partiel)* | ParcelleManualData |
| 10 | **Qualité de la voie de desserte** | 0.5 | Accessible / Dégradée / Peu accessible / Ne sait pas | `qualiteVoieDesserte` | ParcelleManualData |
| 11 | **Distance d'une entrée d'autoroute (km)** | 0.5 | <1 / 1-2 / 2-5 / >5 / Ne sait pas | `distanceAutoroute` | ParcelleAutoData |
| 12 | **Distance gare/transport en commun (m)** | 0.5 | <500 / >500 / Ne sait pas | `distanceTransportCommun` | ParcelleAutoData |
| 13 | **Commerces/services à proximité** | 1 | Oui / Non / Ne sait pas | `proximiteCommercesServices` | ParcelleAutoData |
| 14 | **Voie d'eau à proximité** | 1 | Oui et navigable / Oui et non navigable / Non / Ne sait pas | **⚠️ NON MAPPÉ** | - |
| 15 | **Distance point raccordement BT/HT (km)** | 1 | <1 / 1-5 / >5 / Ne sait pas | `distanceRaccordementElectrique` | ParcelleAutoData |

### 3️⃣ Réglementation (4 critères)

| # | Critère | Poids | Valeurs possibles | Champ DTO | Interface |
|---|---------|-------|-------------------|-----------|-----------|
| 16 | **Zonage du PLU(I) ou carte communale** | 1 | Zone urbaine U / Zone à urbaniser AU / Zone activités / Zone naturelle / Zone agricole / Zone ENR / Zone mixte / Constructible / Non-constructible / Ne sait pas | `zonageReglementaire` | ParcelleAutoData |
| 17 | **Risque naturel (inondations/argiles)** | 1 | Fort / Moyen / Faible / Absent / Ne sait pas | `presenceRisquesNaturels` | ParcelleAutoData |
| 18 | **Risque technologique** | 1 | Oui / Non / Ne sait pas | `presenceRisquesTechnologiques` | ParcelleAutoData |
| 19 | **Monument historique** | 1 | Non concerné / Site inscrit-classé / Périmètre ABF / Ne sait pas | `zonagePatrimonial` | ParcelleAutoData |

### 4️⃣ Patrimoine (2 critères)

| # | Critère | Poids | Valeurs possibles | Champ DTO | Interface |
|---|---------|-------|-------------------|-----------|-----------|
| 20 | **Paysage** | 1 | Dégradé / Banal-infra-ordinaire / Quotidien-ordinaire / Intéressant / Remarquable / Ne sait pas | `qualitePaysage` | ParcelleManualData |
| 21 | **Valeur architecturale et/ou histoire sociale** | 1 | Sans intérêt / Banal-infra-ordinaire / Ordinaire / Intérêt fort / Exceptionnel / Ne sait pas | `valeurArchitecturaleHistorique` | ParcelleManualData |

### 5️⃣ Écosystème (5 critères)

| # | Critère | Poids | Valeurs possibles | Champ DTO | Interface |
|---|---------|-------|-------------------|-----------|-----------|
| 22 | **Couvert végétal** | 1 | Imperméabilisé / Sol nu ou faiblement herbacé / Végétation arbustive faible / Végétation arbustive prédominante / Ne sait pas | **⚠️ NON MAPPÉ** | - |
| 23 | **Présence d'une espèce protégée** | 1 | Oui / Non / Ne sait pas | **⚠️ NON MAPPÉ** | - |
| 24 | **Zonage environnemental** | 1 | Hors zone / Réserve naturelle / Zone Natura 2000 / ZNIEFF 1 ou 2 / Proximité zone (<5km) / Ne sait pas | `zonageEnvironnemental` | ParcelleAutoData |
| 25 | **Trame verte et bleue** | 1 | Hors trame / Réservoir biodiversité / Corridor à préserver / Corridor à restaurer / Ne sait pas | `trameVerteEtBleue` | ParcelleAutoData |
| 26 | **Zone humide** | 1 | Présence avérée / Présence potentielle / Absence / Ne sait pas | **⚠️ NON MAPPÉ** | - |

---

## ⚠️ État du mapping DTO

### Résumé du mapping

| Statut | Nombre | Pourcentage | Détails |
|--------|--------|-------------|---------|
| ✅ **Mappés correctement** | 21 | 81% | Champs existants dans les DTOs |
| ⚠️ **Non mappés** | 5 | 19% | À ajouter aux interfaces |

### Critères non mappés à implémenter

| Critère | Catégorie | Poids | Source probable | Interface suggérée |
|---------|-----------|-------|-----------------|-------------------|
| **Terrain en pente >12%** | État de la friche | 1 | Visite terrain ou données topographiques | ParcelleManualData ou ParcelleAutoData |
| **Voie d'eau à proximité** | Situation | 1 | Données géographiques | ParcelleAutoData |
| **Couvert végétal** | Écosystème | 1 | Imagerie satellite ou visite terrain | ParcelleAutoData ou ParcelleManualData |
| **Présence espèce protégée** | Écosystème | 1 | Expertise écologique | ParcelleManualData |
| **Zone humide** | Écosystème | 1 | Données environnementales | ParcelleAutoData |

### Notes importantes

1. **Terrain viabilisé** : Le critère Excel est partiellement mappé sur `terrainViabilise`, mais la viabilisation complète inclut aussi l'électricité (`connectionReseauElectricite` existe séparément), l'assainissement et la voirie.

2. **Types de données** :
   - **ParcelleAutoData** : Données récupérables automatiquement via APIs (Cadastre, INSEE, Géorisques, etc.)
   - **ParcelleManualData** : Données nécessitant une saisie manuelle (visite terrain, expertise)

---

> 📅 **Dernière mise à jour** : Aout 2025  
> 📧 **Contact** : <samir.benfares@beta.gouv.fr>  
> 🔗 **Repository** : [https://github.com/incubateur-ademe/mutafriches](https://github.com/incubateur-ademe/mutafriches)
