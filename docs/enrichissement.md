# Documentation Module Enrichissement - Mutafriches

## Vue d'ensemble

Le module d'enrichissement est le cœur de Mutafriches. Il enrichit automatiquement les données d'une parcelle cadastrale en interrogeant **24 sources de données externes** (APIs publiques françaises) et **3 bases locales PostGIS**.

**Endpoint** : `POST /enrichissement`
**Entrée** : Identifiant(s) cadastral(s) — mono-parcelle ou multi-parcelle (1 à 20 parcelles)
**Sortie** : Site enrichi avec ~25 critères de mutabilité

---

## Architecture Générale

### Flow d'exécution

```
1. Vérification cache (24h TTL)
   ↓ Cache miss
2. CADASTRE (OBLIGATOIRE) - Initialisation site
   ├─ Mono-parcelle : chargement direct
   └─ Multi-parcelle : chargement toutes parcelles,
      calcul centroïde, géométrie union, parcelle prédominante
   ↓
3. Enrichissement parallélisé de 9 domaines :
   ├─ ÉNERGIE (Enedis)
   ├─ TRANSPORT (Service Public + IGN + data.gouv)
   ├─ URBANISME (LOVAC + BPE)
   ├─ RISQUES NATURELS (RGA + Cavités + Inondation)
   ├─ RISQUES TECHNOLOGIQUES (SIS + ICPE)
   ├─ POLLUTION (ADEME + SIS + ICPE)
   ├─ ZONAGES (Environnemental + Patrimonial + Réglementaire)
   ├─ ENR / ZAER (Géoplateforme WFS)
   └─ GEORISQUES BRUT (13 APIs pour intégrateurs)
   ↓
4. Construction DTO + Logging
   ↓
5. Retour résultat + Mise en cache
```

### Gestion des erreurs

**Statuts d'enrichissement** :
- `SUCCES` : Aucune source échouée
- `PARTIEL` : Certaines sources échouées, mais données disponibles
- `ECHEC` : Aucune donnée disponible (cadastre introuvable)

**Métadonnées retournées** :
- `sourcesUtilisees` : Liste des sources ayant réussi
- `sourcesEchouees` : Liste des sources en échec
- `champsManquants` : Champs non renseignés

### Cache

- **TTL** : 24 heures
- **Critères de validité** : statut=SUCCESS, sources_echouees vide, date < TTL
- **Logging non-bloquant** : enregistrement en base pour analytics

---

## 1. Domaine CADASTRE

### Responsabilité
Récupérer les données cadastrales de base et initialiser l'objet Site (mono ou multi-parcelle).

### APIs utilisées

| API | Source | Données récupérées |
|-----|--------|-------------------|
| **IGN Cadastre** | `cadastre.data.gouv.fr` | Identifiant, commune, code INSEE, surface, géométrie, coordonnées (centroïde) |
| **BDNB** | `bdnb.io` | Surface bâtie |

### Règles de gestion

1. **Récupération cadastre** (OBLIGATOIRE)
   - Normalisation identifiant : padding de la section avec `padParcelleSection()`
   - Extraction du centroïde pour les coordonnées
   - Si échec → ERREUR `CADASTRE_INTROUVABLE`, arrêt de l'enrichissement

2. **Surface bâtie** (OPTIONNEL)
   - Interrogation BDNB via identifiant cadastral
   - Si échec → champ `surfaceBati` reste `undefined`, pas d'arrêt

### Mode multi-parcelle

Lorsque plusieurs identifiants sont fournis (2 à 20 parcelles), le service effectue des calculs supplémentaires :

1. **Chargement** : toutes les parcelles sont récupérées via l'API Cadastre
2. **Parcelle prédominante** : la parcelle avec la plus grande surface
3. **Commune prédominante** : la commune avec la plus grande surface cumulée (par code INSEE)
4. **Centroïde du site** : centre géométrique de l'union de toutes les parcelles
5. **Géométrie union** : polygone agrégé de l'ensemble des parcelles

Les enrichissements suivants utilisent des coordonnées différentes selon le domaine :
- **Énergie / Transport / Urbanisme / Risques techno / Pollution** : centroïde + géométrie union
- **Risques naturels (RGA / Cavités / Inondation)** : coordonnées de la parcelle prédominante
- **Zonages environnemental / patrimonial** : géométrie union
- **Zonage réglementaire** : parcelle prédominante
- **ENR / ZAER** : géométrie de la parcelle prédominante ou centroïde

### Champs enrichis

```typescript
{
  identifiantParcelle: string    // Ex: "25056000HZ0346" (mono) ou "ID1,ID2,ID3" (multi)
  codeInsee: string              // Ex: "25056" (commune prédominante en multi)
  commune: string                // Ex: "Besançon"
  surfaceSite: number            // Surface totale en m² (somme en multi)
  surfaceBati?: number           // Surface bâtie en m² (optionnel)
  coordonnees: {
    latitude: number             // WGS84 (centroïde en multi)
    longitude: number            // WGS84
  }
  geometrie: GeometrieParcelle   // GeoJSON complet

  // Champs spécifiques multi-parcelle
  identifiantsParcelles?: string[]      // Ex: ["25056000HZ0346", "25056000HZ0347"]
  nombreParcelles?: number              // Ex: 2
  parcellePredominante?: string         // Identifiant de la plus grande parcelle
  communePredominante?: string          // Nom de la commune prédominante
  geometrieSite?: GeometrieParcelle     // Géométrie union (polygone agrégé)
}
```

---

## 2. Domaine ÉNERGIE

### Responsabilité
Calculer la distance au point de raccordement électrique le plus proche.

### APIs utilisées

| API | Source | Données récupérées |
|-----|--------|-------------------|
| **Enedis** | `data.enedis.fr` | Distance raccordement électrique (postes HTA + lignes BT) |

### Règles de gestion

1. **Prérequis** : Coordonnées parcelle disponibles
   - Si manquantes → échec, champ `distanceRaccordementElectrique` non renseigné

2. **Calcul distance**
   - Recherche postes électriques (HTA) et lignes BT dans un rayon configuré
   - Calcul distance Haversine entre parcelle et infrastructure la plus proche
   - Retour : distance en mètres (arrondie)

### Champs enrichis

```typescript
{
  distanceRaccordementElectrique: number  // Distance en mètres
}
```

---

## 3. Domaine TRANSPORT

### Responsabilité
Déterminer l'accessibilité de la parcelle (centre-ville, autoroute, transports en commun).

### APIs utilisées

| API | Source | Données récupérées |
|-----|--------|-------------------|
| **API Service Public** | `service-public.fr` | Coordonnées mairie (centre-ville) |
| **IGN WFS** | `geoservices.ign.fr` | Voies de grande circulation (autoroutes) |
| **Transport data.gouv** | Base locale PostGIS | Arrêts de transport en commun (import data.gouv.fr) |

### Règles de gestion

#### 3.1 Centre-ville

**Algorithme** :
1. Récupérer coordonnées de la mairie via code INSEE
2. Calculer distance Haversine entre parcelle et mairie
3. `siteEnCentreVille = distance <= 1000m`

**Constantes** :
```typescript
SEUIL_CENTRE_VILLE_M = 1000  // 1 km
```

#### 3.2 Distance autoroute

**Algorithme** :
1. Recherche voies de grande circulation dans un rayon de 15 km via IGN WFS
2. Calcul distance à la voie la plus proche
3. Retour : distance brute en mètres

**Constantes** :
```typescript
RAYON_RECHERCHE_AUTOROUTE_M = 15000  // 15 km
```

#### 3.3 Distance transport en commun

**Algorithme** :
1. Recherche arrêts dans rayon de 2 km via requête PostGIS
2. Si aucun arrêt trouvé → `null` (= recherche OK, aucun résultat)
3. Si arrêt trouvé → distance en mètres
4. Si erreur technique → `undefined`

**Constantes** :
```typescript
RAYON_RECHERCHE_TRANSPORT_M = 2000  // 2 km
```

**Seuils de catégorisation** (pour algorithme mutabilité) :
- `< 500m` : très bien desservi
- `500m - 1km` : correctement desservi
- `> 1km` : mal desservi

### Champs enrichis

```typescript
{
  siteEnCentreVille: boolean              // true si distance mairie <= 1000m
  distanceAutoroute: number               // Distance en mètres
  distanceTransportCommun: number | null  // Distance en mètres ou null si aucun
}
```

---

## 4. Domaine URBANISME

### Responsabilité
Évaluer le dynamisme urbain de la zone (logements vacants, commerces/services).

### APIs utilisées

| API | Source | Données récupérées |
|-----|--------|-------------------|
| **LOVAC** | `data.gouv.fr` | Taux de logements vacants par commune |
| **BPE** | Base locale PostGIS | Commerces et services de proximité (Base Permanente des Équipements INSEE) |

### Règles de gestion

#### 4.1 Taux logements vacants (LOVAC)

**Algorithme** :
1. Recherche données LOVAC par code INSEE ou nom commune
2. Vérification données exploitables (non secrétisées)
   - Données secrétisées si valeurs `-1` ou `0` pour logements vacants/total
3. Calcul : `tauxVacance = (nombreLogementsVacants / nombreLogementsTotal) * 100`
4. Arrondi à 1 décimale

**Catégorisation** (pour information) :
- `< 8%` : Faible vacance
- `8% - 10%` : Vacance moyenne
- `> 10%` : Forte vacance

#### 4.2 Proximité commerces/services (BPE)

**Algorithme** :
1. Recherche PostGIS dans rayon de 500m autour de la parcelle
2. Codes BPE recherchés :
   - **Alimentation** : B104-B207 (hypermarché, supermarché, épicerie, boulangerie, boucherie, poissonnerie)
   - **Services** : A203 (banque), A206-A208 (poste), D307 (pharmacie)
3. `proximiteCommercesServices = true` si au moins 1 établissement trouvé

**Constantes** :
```typescript
RAYON_RECHERCHE_COMMERCES_M = 500  // 500m (distance de marche standard)
```

### Champs enrichis

```typescript
{
  tauxLogementsVacants: number        // Taux en % (ex: 12.5)
  proximiteCommercesServices: boolean // true si commerce/service à moins de 500m
}
```

---

## 5. Domaine RISQUES NATURELS

### Responsabilité
Évaluer les risques naturels via 3 critères indépendants : RGA, Cavités souterraines et Inondation.

### APIs utilisées

| API | Source | Données récupérées |
|-----|--------|-------------------|
| **GeoRisques RGA** | `georisques.gouv.fr` | Retrait-Gonflement des Argiles |
| **GeoRisques Cavités** | `georisques.gouv.fr` | Cavités souterraines (nombre + distance) |
| **GeoRisques TRI** | `georisques.gouv.fr` | Territoires à Risque Important d'inondation |
| **GeoRisques AZI** | `georisques.gouv.fr` | Atlas des Zones Inondables |
| **GeoRisques PAPI** | `georisques.gouv.fr` | Programmes d'Actions de Prévention des Inondations |
| **GeoRisques PPR** | `georisques.gouv.fr` | Plans de Prévention des Risques |

Les 6 APIs sont appelées en parallèle via `Promise.allSettled()`.

### Règles de gestion

#### 5.1 Retrait-Gonflement Argiles (RGA)

**Algorithme** :
1. Interrogation API GeoRisques par coordonnées (point)
2. Transformation aléa GeoRisques → Niveau risque :
   - `"Fort"` → `RisqueRetraitGonflementArgile.FORT`
   - `"Moyen"` ou `"Faible"` → `RisqueRetraitGonflementArgile.FAIBLE_OU_MOYEN`
   - Autre / `"Nul"` → `RisqueRetraitGonflementArgile.AUCUN`

#### 5.2 Cavités souterraines

**Algorithme** :
1. Recherche cavités dans rayon de 1 km
2. Transformation basée sur distance la plus proche :
   - `distance <= 500m` → `RisqueCavitesSouterraines.OUI`
   - `distance > 500m` ou aucune cavité → `RisqueCavitesSouterraines.NON`

**Constantes** :
```typescript
GEORISQUES_RAYONS_DEFAUT.CAVITES = 1000  // 1 km
SEUIL_CAVITES_M = 500                    // 500m
```

#### 5.3 Risque Inondation

**Algorithme** :
1. Interrogation parallèle de 4 sources d'inondation :
   - **TRI** : Territoires à Risque Important d'inondation
   - **AZI** : Atlas des Zones Inondables
   - **PAPI** : Programmes d'Actions de Prévention des Inondations
   - **PPR** : Plans de Prévention des Risques
2. Combinaison avec opérateur OU :
   - Si au moins une source indique une exposition → `RisqueInondation.OUI`
   - Sinon → `RisqueInondation.NON`

### Champs enrichis

```typescript
{
  risqueRetraitGonflementArgile: "aucun" | "faible-ou-moyen" | "fort"
  risqueCavitesSouterraines: "non" | "oui"
  risqueInondation: "non" | "oui"
}
```

---

## 6. Domaine RISQUES TECHNOLOGIQUES

### Responsabilité
Détecter les risques technologiques (pollution industrielle, sols pollués).

### APIs utilisées

| API | Source | Données récupérées |
|-----|--------|-------------------|
| **GeoRisques SIS** | `georisques.gouv.fr` | Secteurs d'Information sur les Sols |
| **GeoRisques ICPE** | `georisques.gouv.fr` | Installations Classées pour la Protection de l'Environnement |

### Règles de gestion

#### 6.1 Secteurs d'Information sur les Sols (SIS)

**Algorithme** :
1. Recherche SIS dans rayon de 1 km
2. Retour : `presenceSis = true/false`

**Constantes** :
```typescript
GEORISQUES_RAYONS_DEFAUT.SIS = 1000  // 1 km
```

#### 6.2 Installations Classées (ICPE)

**Algorithme** :
1. Recherche ICPE dans rayon de 1 km
2. Calcul distance ICPE la plus proche
3. Retour : `distanceIcpePlusProche` en mètres

**Constantes** :
```typescript
GEORISQUES_RAYONS_DEFAUT.ICPE = 1000  // 1 km
```

#### 6.3 Évaluation risque final

**Algorithme de combinaison** :
```
presenceRisquesTechnologiques = true SI :
  - presenceSis = true OU
  - distanceIcpePlusProche <= 500m

Sinon : false
```

**Constantes** :
```typescript
SEUIL_DISTANCE_ICPE = 500  // 500m
```

### Champs enrichis

```typescript
{
  presenceRisquesTechnologiques: boolean  // true si SIS présent OU ICPE < 500m
}
```

---

## 7. Domaine POLLUTION

### Responsabilité
Détecter si le site est référencé comme pollué (3 sources combinées).

### Sources utilisées

| Source | Type | Données récupérées |
|--------|------|-------------------|
| **ADEME Sites Pollués** | Base locale PostGIS | Sites pollués géolocalisés (BASOL) |
| **GeoRisques SIS** | API | Secteurs d'Information sur les Sols |
| **GeoRisques ICPE** | API | Installations Classées proximité |

### Règles de gestion

**Algorithme de détection multicritère** :

```
siteReferencePollue = true SI AU MOINS UNE condition vraie :

1. ADEME : Parcelle dans rayon de recherche d'un site ADEME pollué
2. SIS : Présence SIS (rayon 1 km)
3. ICPE : ICPE à moins de 500m

Opérateur logique : OU (inclusif)
```

**Constantes** :
```typescript
ICPE_DISTANCE_SEUIL_METRES = 500  // Seuil pollution ICPE
```

**Détail par source** :
- `pollutionAdeme` : boolean
- `pollutionSis` : boolean
- `pollutionIcpe` : boolean (si distance <= 500m)
- `distanceIcpePlusProche` : number (si applicable)

### Champs enrichis

```typescript
{
  siteReferencePollue: boolean  // true si AU MOINS 1 source détecte pollution
}
```

---

## 8. Domaine ZONAGES

### Responsabilité
Identifier les zonages réglementaires, environnementaux et patrimoniaux.

### Sous-domaines

#### 8.1 Zonage Environnemental

**API** : API Carto Nature

**Sources interrogées** :
- Natura 2000 (Habitats + Oiseaux)
- ZNIEFF (Type 1 + Type 2)
- Parcs Naturels Régionaux
- Réserves Naturelles

**Algorithme de priorité** :
```
1. Si Réserve Naturelle → "RESERVE_NATURELLE"
2. Si Parc Naturel → "PARC_NATUREL"
3. Si Natura 2000 → "NATURA_2000"
4. Si ZNIEFF Type 1 → "ZNIEFF_1"
5. Si ZNIEFF Type 2 → "ZNIEFF_2"
6. Sinon → "AUCUN"
```

**Note** : La priorité décroît (Réserve > Parc > Natura > ZNIEFF1 > ZNIEFF2)

#### 8.2 Zonage Patrimonial

**API** : API Carto GPU (Géoportail de l'Urbanisme)

**Sources interrogées** :
- Monuments Historiques
- Sites Classés
- Sites Inscrits
- Zones de Protection du Patrimoine (ZPPAUP/AVAP/SPR)

**Algorithme de priorité** :
```
1. Si Monument Historique → "MONUMENT_HISTORIQUE"
2. Si Site Classé → "SITE_CLASSE"
3. Si Site Inscrit → "SITE_INSCRIT"
4. Si Zone Protection Patrimoine → "ZONE_PROTECTION"
5. Sinon → "AUCUN"
```

#### 8.3 Zonage Réglementaire

**API** : API Carto GPU (Géoportail de l'Urbanisme) — PLU/PLUi et Cartes Communales

**Sources interrogées** :
- Zonages PLU/PLUi (U, AU, A, N)
- Secteurs de Cartes Communales
- RNU (Règlement National d'Urbanisme)

**Algorithme** :
1. Recherche zonage PLU par code INSEE + géométrie (priorité haute)
2. Si pas de PLU → recherche secteur Carte Communale
3. Si pas de CC → vérification RNU

**Classification PLU** (avec sous-catégories pour zones U) :
- Zone **U** générique → `"zone-urbaine-u"`
- Zone **U Habitat** (UA, UB, UC, UD ou libellé contenant "habitat", "mixte", "pavillonnaire", "centre") → `"zone-urbaine-u-habitat"`
- Zone **U Équipement** (UE ou libellé contenant "équipement") → `"zone-urbaine-u-equipement"`
- Zone **U Activité** (UX, UY, UZ, UI ou libellé contenant "activité", "industrie", "artisanale") → `"zone-urbaine-u-activite"`
- Zone à vocation d'activités (destdomi="02" ou contenant "activit") → `"zone-vocation-activites"`
- Zone **AU** (À Urbaniser) → `"zone-a-urbaniser-au"`
- Zone **A** (Agricole) → `"zone-agricole-a"`
- Zone **N** (Naturelle) → `"zone-naturelle-n"`

**Classification Carte Communale** :
- Secteur constructible → `"secteur-ouvert-a-la-construction"`
- Secteur non constructible → `"secteur-non-ouvert-a-la-construction"`

**RNU ou indéterminé** → `"ne-sait-pas"`

**Orchestration** :
- Les 3 zonages sont appelés **en parallèle** via `ZonageOrchestratorService`
- Consolidation des sources utilisées/échouées

### Champs enrichis

```typescript
{
  zonageEnvironnemental?: "hors-zone" | "reserve-naturelle" | "parc-naturel-regional"
    | "parc-naturel-national" | "natura-2000" | "znieff-type-1-2" | "proximite-zone"
  zonagePatrimonial?: "non-concerne" | "monument-historique" | "site-inscrit-classe"
    | "perimetre-abf" | "zppaup" | "avap" | "spr"
  zonageReglementaire?: "zone-urbaine-u" | "zone-urbaine-u-habitat" | "zone-urbaine-u-equipement"
    | "zone-urbaine-u-activite" | "zone-vocation-activites" | "zone-a-urbaniser-au"
    | "secteur-ouvert-a-la-construction" | "secteur-non-ouvert-a-la-construction"
    | "secteur-reglement-urbanisme" | "zone-agricole-a" | "zone-naturelle-n" | "ne-sait-pas"
}
```

---

## 9. Domaine GEORISQUES BRUT

### Responsabilité
Fournir les données brutes GeoRisques pour intégrateurs avancés (ex: Benefriches).

### APIs utilisées (13 APIs en parallèle)

| API | Source | Description |
|-----|--------|-------------|
| **RGA** | GeoRisques | Retrait-Gonflement Argiles |
| **CATNAT** | GeoRisques | Catastrophes Naturelles |
| **Cavités** | GeoRisques | Cavités souterraines |
| **ICPE** | GeoRisques | Installations Classées |
| **SIS** | GeoRisques | Secteurs Info Sols |
| **MVT** | GeoRisques | Mouvements de Terrain |
| **OLD** | GeoRisques | Obligations Légales Débroussaillement |
| **PAPI** | GeoRisques | Programmes Action Prévention Inondations |
| **PPR** | GeoRisques | Plans de Prévention Risques |
| **TRI** | GeoRisques | Territoires à Risque Important d'inondation |
| **TRI Zonage** | GeoRisques | TRI avec zonage détaillé |
| **AZI** | GeoRisques | Atlas des Zones Inondables |
| **Zonage Sismique** | GeoRisques | Zonage Sismique France |

### Règles de gestion

- **Parallélisation** : Appel simultané des 13 APIs via `Promise.allSettled`
- **Résilience** : Échec d'une API n'affecte pas les autres
- **Retour** : Objet JSON brut agrégé avec données par API
- **Rayons** : Définis dans `GEORISQUES_RAYONS_DEFAUT` (0m à 1000m selon API)

### Champs enrichis

```typescript
{
  risquesGeorisques?: {
    rga?: any
    catnat?: any
    cavites?: any
    icpe?: any
    sis?: any
    mvt?: any
    old?: any
    papi?: any
    ppr?: any
    tri?: any
    triZonage?: any
    azi?: any
    zonageSismique?: any
  }
}
```

---

## 10. Domaine ENR / ZAER

### Responsabilité
Détecter si le site se trouve dans une Zone d'Accélération des Énergies Renouvelables (ZAER) et calculer le critère algorithmique correspondant.

### API utilisée

| API | Source | Données récupérées |
|-----|--------|-------------------|
| **ZAER WFS** | `data.geopf.fr/wfs` (Géoplateforme) | Zones ZAER intersectant le site (filière, détail filière, nom) |

### Règles de gestion

**Requête WFS** :
- Service WFS 2.0.0, typename `zaer:zaer`
- Filtre CQL : `INTERSECTS(geom, <géométrie_site>)` (polygone ou point)
- Propriétés récupérées : `nom`, `filiere`, `detail_filiere`
- Déduplication par clé composite `filiere|detail_filiere|nom`

**Stratégie de géolocalisation** :
1. Si géométrie disponible → intersection par polygone (plus précis)
2. Sinon → intersection par point (coordonnées centroïde)

**Calcul du critère algorithmique** (`ZoneAccelerationEnr`) :
1. Si aucune zone ZAER → `NON`
2. Si zone ZAER avec `detailFiliere` contenant "OMBRIERE" (insensible à la casse) → `OUI_SOLAIRE_PV_OMBRIERE`
3. Sinon → `OUI`

### Champs enrichis

```typescript
{
  zaer?: {
    enZoneZaer: boolean        // true si au moins une zone ZAER intersecte le site
    nombreZones: number        // Nombre de zones ZAER intersectées
    filieres: string[]         // Filières ENR uniques (ex: ["SOLAIRE_PV", "EOLIEN"])
    zones: Array<{
      nom: string | null       // Nom de la zone
      filiere: string          // Filière ENR
      detailFiliere: string | null  // Détail (ex: "SOLAIRE_PV_OMBRIERE")
    }>
  }
}
```

Le critère `zoneAccelerationEnr` (`"non"` | `"oui"` | `"oui-solaire-pv-ombriere"`) est calculé à partir de ces données lors de l'évaluation de mutabilité.

---

## Constantes Globales

### Cache
```typescript
ENRICHISSEMENT_CACHE_TTL_HOURS = 24  // 24 heures
```

### Transport
```typescript
SEUIL_CENTRE_VILLE_M = 1000              // 1 km (mairie)
RAYON_RECHERCHE_AUTOROUTE_M = 15000      // 15 km
RAYON_RECHERCHE_TRANSPORT_M = 2000       // 2 km
SEUILS_TRANSPORT_COMMUN = {
  PROCHE: 500,   // < 500m : très bien desservi
  MOYEN: 1000    // 500m-1km : correctement desservi
}
```

### Urbanisme
```typescript
RAYON_RECHERCHE_COMMERCES_M = 500  // 500m (distance de marche)
```

### Pollution
```typescript
ICPE_DISTANCE_SEUIL_METRES = 500  // Seuil pollution ICPE
```

### GeoRisques
```typescript
GEORISQUES_RAYONS_DEFAUT = {
  RGA: 0,              // Recherche par point
  CATNAT: 1000,        // 1 km
  TRI_ZONAGE: 0,       // Recherche par point
  MVT: 1000,           // 1 km
  ZONAGE_SISMIQUE: 0,  // Recherche par point
  CAVITES: 1000,       // 1 km
  OLD: 0,              // Recherche par point
  SIS: 1000,           // 1 km (max 10 km autorisé API)
  ICPE: 1000,          // 1 km (max 10 km autorisé API)
  AZI: 1000,           // 1 km (max 10 km autorisé API)
  PAPI: 1000,          // 1 km (max 10 km autorisé API)
  PPR: 1000            // 1 km (max 10 km autorisé API)
}
```

---

## Résumé des Sources de Données

### Sources Externes (24)

| Domaine | API | Sources |
|---------|-----|---------|
| Cadastre | IGN Cadastre, BDNB (3 sources : bâtiment, surface bâtie, risques) | 4 |
| Énergie | Enedis | 1 |
| Transport | Service Public, IGN WFS | 2 |
| Urbanisme | data.gouv LOVAC | 1 |
| Zonages | API Carto Nature, API Carto GPU | 2 |
| ENR | ZAER WFS Géoplateforme | 1 |
| GeoRisques | 13 APIs GeoRisques | 13 |
| **TOTAL** | | **24** |

### Bases Locales PostGIS (3)

| Domaine | Source | Données |
|---------|--------|---------|
| Transport | transport_stops | Arrêts de transport (data.gouv) |
| Urbanisme | bpe | Base Permanente Équipements INSEE |
| Pollution | ademe_sites_pollues | Sites pollués ADEME (BASOL) |
| **TOTAL** | | **3** |

---

## Performance

### Temps de réponse

- **Cache hit** : < 50ms (lecture PostgreSQL)
- **Cache miss** : 2-5 secondes (dépend des APIs externes)
- **Parallélisation** : 9 domaines + 13 APIs GeoRisques en simultané

### Stratégie de résilience

1. **Promise.allSettled** : Échec d'une source n'affecte pas les autres
2. **Statut PARTIEL** : Résultats retournés même si certaines sources échouent
3. **Logging non-bloquant** : Sauvegarde en base asynchrone (fire-and-forget)
4. **Traçabilité complète** : `sourcesUtilisees`, `sourcesEchouees`, `champsManquants`

---

## DTO de sortie

```typescript
{
  // === CADASTRE ===
  identifiantParcelle: string
  codeInsee: string
  commune: string
  surfaceSite: number
  surfaceBati?: number
  coordonnees?: { latitude: number, longitude: number }
  geometrie?: GeometrieParcelle

  // === CADASTRE — Multi-parcelle ===
  identifiantsParcelles?: string[]      // Présent si multi-parcelle
  nombreParcelles?: number              // Présent si multi-parcelle
  parcellePredominante?: string         // Parcelle avec la plus grande surface
  communePredominante?: string          // Commune prédominante
  geometrieSite?: GeometrieParcelle     // Géométrie union

  // === ÉNERGIE ===
  distanceRaccordementElectrique: number

  // === TRANSPORT ===
  siteEnCentreVille: boolean
  distanceAutoroute: number
  distanceTransportCommun: number | null

  // === URBANISME ===
  tauxLogementsVacants: number
  proximiteCommercesServices: boolean

  // === RISQUES NATURELS (3 critères indépendants) ===
  risqueRetraitGonflementArgile?: "aucun" | "faible-ou-moyen" | "fort"
  risqueCavitesSouterraines?: "non" | "oui"
  risqueInondation?: "non" | "oui"

  // === RISQUES TECHNOLOGIQUES ===
  presenceRisquesTechnologiques: boolean

  // === POLLUTION ===
  siteReferencePollue: boolean

  // === ZONAGES ===
  zonageEnvironnemental?: string
  zonagePatrimonial?: string
  zonageReglementaire?: string
  trameVerteEtBleue?: string

  // === ENR / ZAER ===
  zaer?: ZaerEnrichissement             // Données ZAER détaillées

  // === GEORISQUES BRUT (deprecated) ===
  risquesGeorisques?: any               // Données brutes pour intégrateurs avancés

  // === MÉTADONNÉES ===
  sourcesUtilisees: string[]
  champsManquants: string[]
  sourcesEchouees: string[]
  fiabilite: number                     // Indice 0-10
}
```

---

## Notes Techniques

### Coordonnées

- **Système de référence** : WGS84 (latitude/longitude)
- **Format interne France** : Lambert 93 (EPSG:2154) pour calculs PostGIS
- **Conversion automatique** : Gérée par PostGIS `ST_Transform`

### Calcul de distances

- **Méthode** : Formule de Haversine (distance à vol d'oiseau)
- **Précision** : ~10m pour distances < 100km
- **Unité** : Mètres (arrondis)

### Identifiants cadastraux

- **Format standard** : 14 caractères (ex: `25056000HZ0346`)
- **Padding section** : Section paddée avec `0` si < 2 caractères
- **Support DOM-TOM** : Formats spécifiques Corse, DOM-TOM gérés

### Gestion secrets

- **Données secrétisées INSEE** : Détectées via valeurs `-1` ou `0` incohérentes
- **Stratégie** : Marquage champ manquant, pas d'estimation

---

## Annexe : Correspondance Excel → API

| Critère Excel | Domaine | Champ API | APIs utilisées |
|---------------|---------|-----------|----------------|
| Surface du site | Cadastre | `surfaceSite` | IGN Cadastre |
| Surface bâtie | Cadastre | `surfaceBati` | BDNB |
| Localisation centre-ville | Transport | `siteEnCentreVille` | Service Public |
| Distance autoroute | Transport | `distanceAutoroute` | IGN WFS |
| Distance transport commun | Transport | `distanceTransportCommun` | data.gouv transport |
| Distance raccordement élec | Énergie | `distanceRaccordementElectrique` | Enedis |
| Commerces/services proximité | Urbanisme | `proximiteCommercesServices` | BPE (local) |
| Taux logements vacants | Urbanisme | `tauxLogementsVacants` | LOVAC data.gouv |
| Risque RGA | Risques Naturels | `risqueRetraitGonflementArgile` | GeoRisques RGA |
| Risque cavités | Risques Naturels | `risqueCavitesSouterraines` | GeoRisques Cavités |
| Risque inondation | Risques Naturels | `risqueInondation` | GeoRisques TRI + AZI + PAPI + PPR |
| Risques technologiques | Risques Techno | `presenceRisquesTechnologiques` | GeoRisques SIS + ICPE |
| Site pollué | Pollution | `siteReferencePollue` | ADEME + SIS + ICPE |
| Zonage environnemental | Zonages | `zonageEnvironnemental` | API Carto Nature |
| Zonage patrimonial | Zonages | `zonagePatrimonial` | API Carto GPU |
| Zonage PLU | Zonages | `zonageReglementaire` | API Carto GPU |
| Zone ZAER | ENR | `zaer` / `zoneAccelerationEnr` | ZAER WFS Géoplateforme |

---

## Annexe : Référence Rapide des APIs Externes

> **Note** : Pour les détails d'implémentation spécifiques à Mutafriches, consulter les README dans `apps/api/src/enrichissement/adapters/[nom-api]/`

### IGN Cadastre
- **URL** : `https://apicarto.ign.fr/api/cadastre`
- **Utilisation** : Géométrie, surface, commune
- **Documentation** : https://apicarto.ign.fr/api/doc/cadastre
- **Adapter** : `apps/api/src/enrichissement/adapters/cadastre/`

### BDNB (Base Données Nationale Bâtiment)
- **URL** : `https://api.bdnb.io/v1/bdnb`
- **Utilisation** : Surface bâtie
- **Documentation** : https://api-portail.bdnb.io/
- **Adapter** : `apps/api/src/enrichissement/adapters/bdnb/`

### Enedis Open Data
- **URL** : `https://data.enedis.fr/api`
- **Utilisation** : Distance raccordement électrique (postes HTA, lignes BT)
- **Documentation** : https://data.enedis.fr/
- **Adapter** : `apps/api/src/enrichissement/adapters/enedis/`

### GeoRisques (13 APIs)
- **URL** : `https://georisques.gouv.fr/api`
- **Utilisation** : Risques naturels/technologiques (RGA, SIS, ICPE, Cavités, CATNAT, MVT, OLD, PAPI, PPR, TRI, AZI, Zonage Sismique)
- **Documentation** : https://georisques.gouv.fr/doc-api
- **Adapter** : `apps/api/src/enrichissement/adapters/georisques/`

### API Carto (Nature, GPU)
- **URL** : `https://apicarto.ign.fr/api`
- **Utilisation** : Zonages environnementaux (Natura 2000, ZNIEFF, Parcs) et patrimoniaux (Monuments Historiques, Sites Classés)
- **Documentation** : https://apicarto.ign.fr/api/doc
- **Adapters** :
  - `apps/api/src/enrichissement/adapters/api-carto-nature/`
  - `apps/api/src/enrichissement/adapters/api-carto-gpu/`

### data.gouv.fr (LOVAC, Transport)
- **URL** : `https://www.data.gouv.fr/api`
- **Utilisation** : Logements vacants (LOVAC), arrêts de transport
- **Documentation** : https://www.data.gouv.fr/fr/doc/api
- **Adapters** :
  - `apps/api/src/enrichissement/adapters/datagouv-lovac/`
  - `apps/api/src/enrichissement/repositories/transport-stops.repository.ts` (données locales)

### API Service Public
- **URL** : `https://api-lannuaire.service-public.fr/api`
- **Utilisation** : Coordonnées des mairies (centre-ville)
- **Documentation** : https://api-lannuaire.service-public.fr/explore
- **Adapter** : `apps/api/src/enrichissement/adapters/service-public/`

### IGN WFS (Voies de circulation)
- **URL** : `https://data.geopf.fr/wfs`
- **Utilisation** : Voies de grande circulation (autoroutes)
- **Documentation** : https://geoservices.ign.fr/documentation/services/api-et-services-ogc/wfs
- **Adapter** : `apps/api/src/enrichissement/adapters/ign-wfs/`

### ZAER WFS (Zones d'Accélération des Énergies Renouvelables)
- **URL** : `https://data.geopf.fr/wfs` (typename `zaer:zaer`)
- **Utilisation** : Détection des zones ZAER par intersection géométrique
- **Protocole** : WFS 2.0.0 avec filtre CQL `INTERSECTS`
- **Adapter** : `apps/api/src/enrichissement/adapters/zaer-wfs/`

---

**Version** : 2.0
**Dernière mise à jour** : 2026-03-11
**Projet** : Mutafriches - Beta.gouv / ADEME
