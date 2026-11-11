# Arborescence des pages de documentation et d'information technique (UI)

## Principe

- Le **menu principal** porte les pages destinées à tous les publics : comprendre le calcul, choisir un mode d'intégration.
- La page **Intégrer Mutafriches** est l'entrée unique vers les modes d'intégration : chaque solution y a sa carte, et les solutions documentées (extension QGIS, API, iframe) ont chacune leur page de détail sous `/integrer-mutafriches/`.
- L'en-tête n'a plus de bouton **Documentation** : le menu principal suffit à atteindre « Intégrer Mutafriches ».
- Le **footer** porte les pages techniques : état des sources, détail des données, pages de tests, et un rappel vers « Intégrer Mutafriches ».

## Arborescence

```
Menu principal
├── Comprendre les analyses            /comprendre-les-analyses
│   ├── onglet Définitions et coef. des critères
│   └── onglet Sources des données
└── Intégrer Mutafriches               /integrer-mutafriches
    ├── Extension QGIS                 → tutoriel /integrer-mutafriches/extension-qgis
    ├── API Mutafriches                → prise de rendez-vous (ZCal), documentation /integrer-mutafriches/api
    ├── Iframe Mutafriches             → documentation /integrer-mutafriches/iframe
    ├── Page Mutafriches personnalisée → prise de rendez-vous (ZCal)
    ├── Nos services partenaires       → Bénéfriches (lien externe)
    └── Besoin d'aide pour choisir     → prise de rendez-vous (ZCal)

Footer
├── Intégrer Mutafriches (QGIS, API et iframe)  /integrer-mutafriches
├── Données utilisées                           /donnees-utilisees
│   ├── onglet APIs externes
│   ├── onglet Imports
│   └── lien vers Documentation des sources de données
├── Documentation des sources de données        /documentation-donnees
└── Pages de tests                              /tests

Adresse conservée
└── /documentation-integration         → redirigée vers /integrer-mutafriches/api
```

## Pages

| Page | Route | Entrée | Public | Contenu | Source des données |
| --- | --- | --- | --- | --- | --- |
| Comprendre les analyses | `/comprendre-les-analyses` | Menu | Tous | Critères, définitions, coefficients, score de chaque valeur par usage ; source, format et version de chaque critère | `MATRICE_SCORING_DOC` (généré par `pnpm docs:matrice:gen`), `DEFINITIONS_CRITERES`, `getSourceCritere` (`packages/shared-types/src/documentation/`) |
| Intégrer Mutafriches | `/integrer-mutafriches` | Menu, footer, page d'accueil | Collectivités, partenaires | Les cinq façons d'utiliser Mutafriches à l'échelle d'un territoire, avec un appel à l'action par solution | Contenu éditorial, dans la page |
| Utiliser l'extension QGIS | `/integrer-mutafriches/extension-qgis` | Carte « Extension QGIS » | Géomaticiens, collectivités | Tutoriel en neuf étapes illustrées : installation, inventaire CNIG, contrôle, analyse, carte, tables attributaires, sites à reprendre, réglages ; questions fréquentes en accordéons | `ETAPES_TUTORIEL_QGIS` (`features/integrer/data/tutoriel-qgis.ts`) ; captures `public/images/tutoriel-qgis/`, produites par `scripts/captures-tutoriel.sh` du dépôt `mutafriches-qgis` |
| Utiliser l'API Mutafriches | `/integrer-mutafriches/api` | Carte « API Mutafriches », ancienne adresse `/documentation-integration` | Développeurs intégrateurs | En bref, accès et limites, parcours en trois appels (enrichir, compléter, calculer), relecture d'une évaluation, sites d'une commune, erreurs courantes, référence des appels | Contenu éditorial dans la page ; exemples dans `features/integrer/data/exemples-integration.ts` |
| Intégrer l'iframe Mutafriches | `/integrer-mutafriches/iframe` | Carte « Iframe Mutafriches » | Développeurs intégrateurs | Exemple minimal, mise en place, identifiant d'intégrateur, paramètres, messages reçus, sécurité | Idem |
| Données utilisées | `/donnees-utilisees` | Footer, pages partenaires | Technique | État des APIs externes et des référentiels importés | API (`/api/donnees-externes/*`) |
| Documentation des sources de données | `/documentation-donnees` | Footer, page Données utilisées | Partenaires | Par source : champs récupérés, traitement, critères alimentés ; export PDF | `SOURCES_DONNEES` (`packages/shared-types`) |
| Pages de tests | `/tests` | Footer | Équipe | Outils de diagnostic internes | — |

## Fichiers

| Page | Composant |
| --- | --- |
| Comprendre les analyses | `features/comprendre-analyses/pages/ComprendreAnalysesPage.tsx` |
| Intégrer Mutafriches | `features/integrer/pages/IntegrerMutafrichesPage.tsx` |
| Utiliser l'extension QGIS | `features/integrer/pages/TutorielQgisPage.tsx` |
| Utiliser l'API Mutafriches | `features/integrer/pages/DocumentationApiPage.tsx` |
| Intégrer l'iframe Mutafriches | `features/integrer/pages/DocumentationIframePage.tsx` |
| Gabarit des pages de détail | `features/integrer/components/PageDocumentation.tsx` |
| Données utilisées | `features/donnees-utilisees/pages/DonneesUtiliseesPage.tsx` |
| Documentation des sources | `features/documentation-sources/pages/DocumentationSourcesPage.tsx` |

Chemins relatifs à `apps/ui/src/`.

## Notes

- `/documentation-integration` reste servie, redirigée vers `/integrer-mutafriches/api` : elle est citée dans les mails d'onboarding des intégrateurs (`docs/acces-api-integrateur.md`).
- Les pages de détail de « Intégrer Mutafriches » partagent un gabarit : fil d'Ariane (Accueil › Intégrer Mutafriches › page), sommaire en menu latéral collant. Chaque entrée du sommaire vise l'identifiant d'une section.
- Les tableaux de « Comprendre les analyses » ne se saisissent pas à la main : ils découlent de l'algorithme, et des tests cassent en cas de divergence.
- Un nouveau critère exige sa définition dans `DEFINITIONS_CRITERES` et, s'il est automatique, sa source dans `sources-criteres.data.ts`.

## A voir

- Visuels de la page « Intégrer Mutafriches » : seule la carte « Extension QGIS » a une vraie capture, les quatre autres ont une image provisoire.
- Carte « Iframe Mutafriches » : accroche, texte et étiquettes à valider.
- Mails d'onboarding : remplacer à terme `/documentation-integration` par `/integrer-mutafriches/api`.
- Deux pages décrivent les sources de données (« Comprendre les analyses », onglet Sources, et « Documentation des sources de données ») : à fusionner ou à différencier.
- Le fil d'Ariane de « Documentation des sources de données » passe par « Données utilisées », qui n'est plus dans le menu.
