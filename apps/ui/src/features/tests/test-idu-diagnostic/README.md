# Diagnostic IDU

Page outil (`/test/idu-diagnostic`) qui explique **pourquoi un identifiant cadastral (IDU) est
trouvé ou rejeté** par le cadastre IGN. Utile pour qualifier les rejets remontés par les
partenaires (AURA, CCI 92…) sans avoir à interroger l'API à la main.

## Fonctionnement

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

## Le cas typique « numéro introuvable »

Le cadastre ne contient que les **parcelles courantes**. Quand une parcelle est divisée ou
fusionnée, son numéro est retiré et de nouveaux numéros (souvent plus élevés) apparaissent. Un
**trou entre voisins** est la signature de ce redécoupage : la donnée du partenaire est simplement
antérieure à la mise à jour cadastrale. Il faut alors récupérer la/les parcelle(s) actuelle(s)
couvrant la même emprise (recherche par point sur la carte, ou via cadastre.gouv.fr).

## Fichiers

- `diagnostic.ts` — logique pure (`parseIdu`, `diagnostiquerIdu`) + verdicts
- `diagnostic.spec.ts` — tests unitaires
- `pages/TestIduDiagnostic.tsx` — UI (saisie + tableau de résultats)
- Cadastre : `shared/services/cadastre/api.cadastre.service.ts`
  (`fetchParcelByRef`, `fetchSectionParcels`)
