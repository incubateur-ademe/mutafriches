# ADR-0023 : Librairie d'export PDF des résultats — @react-pdf/renderer

**Date** : 2026-06-30
**Statut** : Accepté

## Contexte

La page résultats (`apps/ui/src/features/resultats/pages/ResultatsPage.tsx`) comporte un bouton « Exporter les résultats » jusqu'ici factice (modale « fonctionnalité à venir »). Nous ajoutons un véritable export, via une modale de choix de format (PDF / JSON).

L'export PDF doit produire un document multi-pages :

- Page 1 : récap de l'analyse (classement des 7 usages + podium)
- Page 2 : caractéristiques du site (récapitulatif des 27 critères)
- Pages 3-N : un usage par page (illustration, barre avantages/contraintes, tableau des critères)

Toutes les données sont déjà en mémoire sur la page (`MutabiliteOutputDto`, enrichissement, données complémentaires, données UI du site), et des fonctions pures réutilisables existent (`buildRecapitulatifSite`, `buildDetailUsage` dans `packages/shared-types/src/recapitulatif/`). Aucune librairie PDF n'était présente dans le projet.

## Décision

> Nous utilisons **@react-pdf/renderer** pour générer le PDF côté client, de façon programmatique (vecteur, texte sélectionnable), avec un **import dynamique (code-split)** afin de ne pas alourdir le bundle principal.

L'export JSON est ajouté en parallèle (objet auto-descriptif), sans nouvelle dépendance.

## Options envisagées

### Option A — @react-pdf/renderer (retenue)

- Avantages : modèle déclaratif React (`Document`/`Page`) qui épouse exactement la structure multi-pages demandée ; réutilise les builders purs comme source de données ; PDF vecteur léger et texte sélectionnable ; 100 % client (aucune donnée ne quitte le navigateur) ; sécurisé (pas de capture DOM, pas d'`eval`, pas de ressources externes) ; code-splitté via `import()` au clic.
- Inconvénients : bundle de la librairie (yoga layout) à charger à la demande ; mise en page à coder et à maintenir.

### Option B — html2canvas / html2pdf

- Avantages : capture directe du rendu existant.
- Inconvénients : lourd, image rasterisée (texte non sélectionnable), rendu DSFR fragile, risques de fuite de ressources. Rejetée.

### Option C — jsPDF (depuis le DOM)

- Avantages : populaire.
- Inconvénients : capture DOM, surface plus large, CVEs passées. Rejetée.

### Option D — pdf-lib

- Avantages : très minimal et sûr.
- Inconvénients : bas niveau, pas de tables ni de flux de texte, mise en page multi-pages pénible pour ce rapport. Rejetée pour ce besoin.

### Option E — pdfmake

- Avantages : déclaratif (document JSON), tables intégrées.
- Inconvénients : embarque ses polices (vfs), DX moins proche de notre structure React. Alternative viable mais moins adaptée.

## Conséquences

### Positives

- Export multi-pages fidèle à la structure demandée.
- PDF léger et accessible (texte vecteur, sélectionnable).
- Génération 100 % locale (respect de la vie privée).
- Bundle principal inchangé (chargement à la demande).
- Réutilisation des builders purs `buildRecapitulatifSite` / `buildDetailUsage`.

### Négatives / Risques

- Nouvelle dépendance front à maintenir (@react-pdf/renderer).
- La mise en page PDF est du code à maintenir si l'algorithme ou les usages évoluent.
- Léger délai au premier export (chargement de la librairie à la demande).

### Migration

- Ajouter `@react-pdf/renderer` dans `apps/ui`.
- Créer la modale de choix de format et les composants du document PDF (`apps/ui/src/features/resultats/`).
- Câbler le bouton existant ; conserver le tracking `INTERET_EXPORT_RESULTATS` en y ajoutant le format choisi (`pdf` / `json`).
- Détails : police Helvetica intégrée (accents OK, zéro config) ; illustrations d'usage (PNG du podium) via `Image` ; téléchargement `mutabilite-<commune>-<date>.pdf`.

## Liens

- Page résultats : `apps/ui/src/features/resultats/pages/ResultatsPage.tsx`
- Builders réutilisés : `packages/shared-types/src/recapitulatif/recapitulatif.builder.ts`, `packages/shared-types/src/recapitulatif/detail-usage.builder.ts`
- Labels / images / badges d'usage : `apps/ui/src/features/resultats/utils/usagesLabels.utils.ts`
- Modale DSFR : `apps/ui/src/shared/components/common/ModalInfo.tsx`
- Documentation : https://react-pdf.org/
- Issue : #XXX
- PR : #XXX
