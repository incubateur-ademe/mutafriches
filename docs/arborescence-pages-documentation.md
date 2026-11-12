# Arborescence des pages de documentation et d'information technique (UI)

> État sur la branche `feat/pages-documentation`. Routes : `apps/ui/src/shared/config/routes.config.ts`. Points d'entrée : `Header.tsx` et `Footer.tsx` (`apps/ui/src/shared/components/layout/`).

## Principe

- Le **menu principal** porte les pages destinées à tous les publics : comprendre le calcul, choisir un mode d'intégration.
- Le **footer** porte les pages techniques : documentation développeur, état des sources, détail des données.
- Le bouton **Documentation** de l'en-tête mène directement à la documentation technique.

## Arborescence

```
Menu principal
├── Comprendre les analyses            /comprendre-les-analyses
│   ├── onglet Définitions et coef. des critères
│   └── onglet Sources des données
└── Intégrer Mutafriches               /integrer-mutafriches
    ├── Extension QGIS                 → tutoriel /integrer-mutafriches/extension-qgis
    ├── API Mutafriches                → prise de rendez-vous (ZCal), documentation technique
    ├── Page Mutafriches personnalisée → prise de rendez-vous (ZCal)
    ├── Nos services partenaires       → Bénéfriches (lien externe)
    └── Besoin d'aide pour choisir     → prise de rendez-vous (ZCal)

En-tête (boutons)
└── Documentation                      /documentation-integration

Footer
├── Documentation technique (API et iframe)   /documentation-integration
│   ├── mode Intégration iframe
│   └── mode API REST
├── Données utilisées                         /donnees-utilisees
│   ├── onglet APIs externes
│   ├── onglet Imports
│   └── lien vers Documentation des sources de données
├── Documentation des sources de données      /documentation-donnees
└── Pages de tests                            /tests
```

## Pages

| Page | Route | Entrée | Public | Contenu | Source des données |
|---|---|---|---|---|---|
| Comprendre les analyses | `/comprendre-les-analyses` | Menu | Tous | Critères, définitions, coefficients, score de chaque valeur par usage ; source, format et version de chaque critère | `MATRICE_SCORING_DOC` (généré par `pnpm docs:matrice:gen`), `DEFINITIONS_CRITERES`, `getSourceCritere` (`packages/shared-types/src/documentation/`) |
| Intégrer Mutafriches | `/integrer-mutafriches` | Menu | Collectivités, partenaires | Les quatre façons d'utiliser Mutafriches à l'échelle d'un territoire, avec un appel à l'action par solution | Contenu éditorial, dans la page |
| Utiliser l'extension QGIS | `/integrer-mutafriches/extension-qgis` | Carte « Extension QGIS » de la page Intégrer | Géomaticiens, collectivités | Tutoriel en neuf étapes illustrées : installation, inventaire CNIG, contrôle, analyse, carte, tables attributaires, sites à reprendre, réglages ; questions fréquentes | `ETAPES_TUTORIEL_QGIS` (`features/integrer/data/tutoriel-qgis.ts`) ; captures `public/images/tutoriel-qgis/`, produites par `scripts/captures-tutoriel.sh` du dépôt `mutafriches-qgis` |
| Documentation technique (API et iframe) | `/documentation-integration` | Footer, bouton Documentation, page d'accueil | Développeurs intégrateurs | Guide d'intégration iframe et référence de l'API REST | Contenu éditorial (`DocumentationIframe.tsx`, `DocumentationApi.tsx`) |
| Données utilisées | `/donnees-utilisees` | Footer, pages partenaires | Technique | État des APIs externes et des référentiels importés | API (`/api/donnees-externes/*`) |
| Documentation des sources de données | `/documentation-donnees` | Footer, page Données utilisées | Partenaires | Par source : champs récupérés, traitement, critères alimentés ; export PDF | `SOURCES_DONNEES` (`packages/shared-types`) |
| Pages de tests | `/tests` | Footer | Équipe | Outils de diagnostic internes | — |

## Fichiers

| Page | Composant |
|---|---|
| Comprendre les analyses | `features/comprendre-analyses/pages/ComprendreAnalysesPage.tsx` |
| Intégrer Mutafriches | `features/integrer/pages/IntegrerMutafrichesPage.tsx` |
| Utiliser l'extension QGIS | `features/integrer/pages/TutorielQgisPage.tsx` |
| Documentation technique | `features/documentation/pages/DocumentationIntegrationPage.tsx` |
| Données utilisées | `features/donnees-utilisees/pages/DonneesUtiliseesPage.tsx` |
| Documentation des sources | `features/documentation-sources/pages/DocumentationSourcesPage.tsx` |

Chemins relatifs à `apps/ui/src/`.

## Règles

- `/documentation-integration` ne change pas d'adresse : elle est citée dans les mails d'onboarding des intégrateurs (`docs/acces-api-integrateur.md`).
- Les tableaux de « Comprendre les analyses » ne se saisissent pas à la main : ils découlent de l'algorithme, et des tests cassent en cas de divergence.
- Un nouveau critère exige sa définition dans `DEFINITIONS_CRITERES` et, s'il est automatique, sa source dans `sources-criteres.data.ts`.

## Points ouverts

- Visuels de la page « Intégrer Mutafriches » : les quatre blocs affichent une image provisoire.
- Extension QGIS : le bouton de la carte mène au tutoriel. Le lien de téléchargement pointe sur la dernière release GitHub de `mutafriches-qgis`, à publier (cf. `SUJETS-A-TRAITER.md`).
- Deux pages décrivent les sources de données (« Comprendre les analyses », onglet Sources, et « Documentation des sources de données ») : à fusionner ou à différencier.
