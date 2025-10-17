# API GeoRisques - Liste des Endpoints

## URL de base

```
https://www.georisques.gouv.fr/api/v1
```

## Les 9 APIs utilisées

### 1. RGA - Retrait-Gonflement Argiles

- **Endpoint** : `/rga`
- **Paramètres** : `latlon=longitude,latitude`
- **Utilité** : Niveau d'aléa retrait-gonflement des argiles

### 2. CATNAT - Catastrophes Naturelles

- **Endpoint** : `/gaspar/catnat`
- **Paramètres** : `latlon=longitude,latitude&rayon=1000&page_size=100`
- **Utilité** : Historique des arrêtés de catastrophe naturelle

### 3. TRI - Territoires à Risques d'Inondation

- **Endpoint** : `/tri_zonage`
- **Paramètres** : `latlon=longitude,latitude`
- **Utilité** : Zone à fort risque d'inondation

### 4. MVT - Mouvements de Terrain

- **Endpoint** : `/mvt`
- **Paramètres** : `latlon=longitude,latitude&rayon=1000&page_size=100`
- **Utilité** : Historique des mouvements de terrain

### 5. Zonage Sismique

- **Endpoint** : `/zonage_sismique`
- **Paramètres** : `latlon=longitude,latitude`
- **Utilité** : Niveau de sismicité réglementaire (zones 1 à 5)

### 6. Cavités Souterraines

- **Endpoint** : `/cavites`
- **Paramètres** : `latlon=longitude,latitude&rayon=1000&page_size=100`
- **Utilité** : Inventaire des cavités souterraines

### 7. OLD - Obligations Légales de Débroussaillement

- **Endpoint** : `/old`
- **Paramètres** : `latlon=longitude,latitude`
- **Utilité** : Obligation de débroussaillement (prévention incendies)

### 8. SIS - Secteurs d'Information sur les Sols

- **Endpoint** : `/ssp/conclusions_sis`
- **Paramètres** : `latlon=longitude,latitude&rayon=1000&page_size=100`
- **Utilité** : Secteurs avec pollution des sols connue

### 9. ICPE - Installations Classées

- **Endpoint** : `/installations_classees`
- **Paramètres** : `latlon=longitude,latitude&rayon=1000&page_size=100`
- **Utilité** : Inventaire des installations industrielles classées

## Format des coordonnées

```
latlon=longitude,latitude
```

Exemple : `latlon=-0.4722,47.4355` (Les Ponts-de-Cé)

## Documentation complète
<https://www.georisques.gouv.fr/api>
