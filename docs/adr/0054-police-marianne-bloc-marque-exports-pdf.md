# ADR-0054 : Police Marianne et bloc-marque dans les exports PDF

**Date** : 2026-11-05
**Statut** : Accepté
**Amende** : [ADR-0023](0023-export-pdf-react-pdf-renderer.md)

## Contexte

L'ADR-0023 a retenu la police Helvetica intégrée à react-pdf (« zéro config »). Le PDF des
résultats s'écarte donc de la maquette sur tout ce qui fait l'identité de l'État :

- la typographie n'est pas Marianne (`pdffonts` ne liste que Helvetica) ;
- l'en-tête n'a pas de bloc-marque, seulement le texte « RÉPUBLIQUE FRANÇAISE » ;
- react-pdf coupe les mots à l'anglaise (« dé-gradé »), et l'espace fine insécable de
  `toLocaleString("fr-FR")` sort en glyphe parasite (« 46ƒ193 m² ») ;
- l'export de la documentation des sources duplique le même en-tête.

Deux contraintes techniques empêchent la solution évidente :

- react-pdf ne parvient pas à décompresser les WOFF de `@gouvfr/dsfr` dans le navigateur
  (« Buffer is not defined », puis `RangeError: Offset is outside the bounds of the DataView`) ;
- le composant `Image` de react-pdf ne lit pas le SVG, seul format du logo dans le DSFR
  (fond de `fr-logo`, `component/logo/logo.main.css`).

## Décision

> Nous embarquons Marianne en TTF, convertis depuis les WOFF du DSFR, redessinons le
> bloc-marque en `Svg` react-pdf, et regroupons le gabarit des exports dans `apps/ui/src/shared/pdf/`.

- `polices/Marianne-{Regular,Medium,Bold}.ttf` : tables WOFF décompressées sans
  modification (conversion WOFF 1.0 vers sfnt), enregistrées par `enregistrerPolicesPdf()`
  avec une césure désactivée.
- `blocMarque.traces.ts` : tracés du profil de Marianne et de la devise repris du SVG de
  `fr-logo` ; `PdfBlocMarque` les pose sur le drapeau bleu et rouge.
- `PdfEnTete`, `PdfPiedDePage`, `PdfBadge`, `PdfTag`, primitives de tableau et teintes DSFR
  (`PDF_COULEURS`) : utilisés par l'export des résultats et celui des sources.

## Options envisagées

### Option A — TTF convertis et versionnés (retenue)

- Avantages : aucune dépendance ; rendu identique au site ; fichiers servis par nos assets
  et téléchargés au premier export seulement (import `?url`, hors bundle principal).
- Inconvénients : environ 720 Ko de binaires dans le dépôt, à régénérer si le DSFR publie une
  nouvelle version de Marianne.

### Option B — Polyfill `Buffer` pour lire le WOFF

- Avantages : réutilise directement les fichiers de `@gouvfr/dsfr`.
- Inconvénients : nouvelle dépendance et global injecté dans toute l'application pour un seul
  usage ; dépend d'un comportement interne de fontkit.

### Option C — Garder Helvetica

- Avantages : aucune maintenance.
- Inconvénients : non conforme à la maquette ni au DSFR, glyphes manquants (espace fine).

### Option D — Bloc-marque en PNG

- Avantages : une simple `Image`.
- Inconvénients : flou à l'impression et au zoom ; rasterisation à refaire à chaque évolution.

## Conséquences

### Positives

- Les deux exports PDF n'embarquent que Marianne et portent le bloc-marque vectoriel.
- Un seul gabarit (en-tête, pied de page, badges, tableaux) pour tous les PDF à venir.
- Les badges et tableaux reprennent les tokens du site (`TAG_COLORS`, `IMPACT_TAG_VARIANT`).

### Négatives / Risques

- L'interligne sans unité de react-pdf se calcule sur le corps du même style (18 par défaut)
  puis s'hérite en valeur absolue : tout style qui change de corps doit redéfinir l'interligne.
- react-pdf ne coupe les lignes qu'aux espaces : `PdfBadge` découpe les libellés aux tirets
  pour qu'une source longue tienne dans sa colonne.

### Migration

- Remplacer `fontFamily: "Helvetica…"` par `PDF_POLICE` et `fontWeight` dans tout nouveau PDF,
  et appeler `enregistrerPolicesPdf()` dans le module du document.

## Liens

- Module partagé : `apps/ui/src/shared/pdf/`
- Export des résultats : `apps/ui/src/features/resultats/export/MutabilitePdfDocument.tsx`
- Export des sources : `apps/ui/src/features/documentation-sources/export/SourcesPdfDocument.tsx`
- ADR amendé : [ADR-0023](0023-export-pdf-react-pdf-renderer.md)
