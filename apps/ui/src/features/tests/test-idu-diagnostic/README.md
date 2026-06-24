# Diagnostic parcelle

Page outil (`/test/diagnostic-parcelle`) à deux onglets (`DsfrTabs`) :

- **Diagnostic IDU** : explique **pourquoi un IDU est trouvé ou rejeté** par le cadastre IGN
  (qualifier les rejets remontés par les partenaires sans interroger l'API à la main).
- **Infos parcelle** : carte Leaflet cliquable + recherche d'adresse pour **retrouver l'IDU** et
  les informations d'une parcelle. Réutilise `useLeafletMap` (clic → IDU), `AddressSearchBar`,
  `MapLayerSelector` et `searchParcelWithFallback`. Le panneau affiche l'IDU (avec bouton copier),
  commune/section/numéro/surface, et un lien Géoportail centré. La carte étant montée cachée dans
  l'onglet, un `IntersectionObserver` appelle `invalidateSize()` quand l'onglet devient visible.

## Onglet « Diagnostic IDU »

On colle un ou plusieurs IDU ; pour chacun :

1. **Validation de format** (`isValidParcelId` de `@mutafriches/shared-types`).
2. **Découpe** de l'IDU (`parseIdu`) en `{ codeInsee, prefixe, section, numero }`
   (gère métropole, DOM 97x, Corse 2A/2B).
3. **Nom de commune** via `geo.api.gouv.fr`.
4. **Existence de la parcelle** via l'API Carto IGN
   (`fetchParcelByRef` = `code_insee` + `section` + `numero`).
5. Si absente, **inspection de la section** (`fetchSectionParcels`) pour distinguer les cas et,
   le cas échéant, lister les **numéros voisins présents**.

> Source : API Carto IGN (`apicarto.ign.fr`, cadastre **actuel**) — la même que la carte de
> sélection. Le résultat reflète ce que verra notre enrichissement : il échoue si et seulement si
> le cadastre ne connaît pas la parcelle.

## Verdicts

| Statut | Signification |
|---|---|
| **Trouvée** | La parcelle existe dans le cadastre actuel. |
| **Format invalide** | L'IDU ne respecte pas le format attendu. |
| **Commune inconnue** | Le code INSEE n'est pas reconnu par le cadastre. |
| **Section absente** | La commune existe mais la section n'a aucune parcelle. |
| **Numéro introuvable** | La section existe mais le numéro est absent. Si des **voisins** sont présents (ex. 0265 et 0267 mais pas 0266), la parcelle a très probablement été **redécoupée / fusionnée / renumérotée** depuis l'export du partenaire. |
| **Erreur API** | API Carto ou geo.api indisponible. |

## Confirmation par une 2ᵉ source (géocodeur IGN)

Chaque IDU est aussi interrogé sur le **géocodeur IGN** (`data.geopf.fr/geocodage`, index
`parcel`), **indépendant d'apicarto**. La colonne « Vérif. 2ᵉ source » affiche :

- **Absente** : le géocodeur ne trouve pas non plus la parcelle → un KO confirmé par deux
  services IGN distincts (preuve solide que ce n'est pas un souci de notre API).
- **Présente** : le géocodeur trouve la parcelle.

## Localisation et adresse

- **Parcelle trouvée** : centroïde de sa géométrie → adresse BAN + lien Géoportail centré dessus.
- **Parcelle KO** : la parcelle n'a plus de géométrie ; on situe la zone via le **voisin réel le
  plus proche en numéro** (centroïde réel d'apicarto) → adresse du secteur + lien Géoportail.
  Attention : les numéros voisins ne sont pas forcément contigus dans l'espace, le lien donne le
  secteur de la section, pas l'emplacement exact de la parcelle disparue.

## Liens vers le cadastre

- Un lien général **Consulter le cadastre (Géoportail IGN)** est affiché en tête de page.
- Pour chaque ligne **KO** (parcelle non trouvée), un lien ouvre le Géoportail **centré sur la
  commune** (couche parcellaire activée) pour retrouver visuellement la parcelle actuelle. Le
  centre de la commune provient de `geo.api.gouv.fr` (champ `centre`).

## Le cas typique « numéro introuvable »

Le cadastre ne contient que les **parcelles courantes**. Quand une parcelle est divisée ou
fusionnée, son numéro est retiré et de nouveaux numéros (souvent plus élevés) apparaissent. Un
**trou entre voisins** est la signature de ce redécoupage : la donnée du partenaire est simplement
antérieure à la mise à jour cadastrale. Il faut alors récupérer la/les parcelle(s) actuelle(s)
couvrant la même emprise (recherche par point sur la carte, ou via cadastre.gouv.fr).

## Fichiers

- `diagnostic.ts` — logique pure (`parseIdu`, `diagnostiquerIdu`) + verdicts
- `diagnostic.spec.ts` — tests unitaires
- `geoportail.ts` — liens cadastre IGN partagés
- `pages/DiagnosticParcellePage.tsx` — coquille + onglets (`DsfrTabs`)
- `components/DiagnosticIduTab.tsx` — onglet Diagnostic IDU (saisie + tableau)
- `components/InfosParcelleTab.tsx` — onglet Infos parcelle (carte + recherche d'adresse)
- `components/ParcelleInfoPanel.tsx` — panneau d'infos (IDU, copier, lien cadastre)
- Cadastre : `shared/services/cadastre/api.cadastre.service.ts`
  (`fetchParcelByRef`, `fetchSectionParcels`, `searchParcelWithFallback`)
