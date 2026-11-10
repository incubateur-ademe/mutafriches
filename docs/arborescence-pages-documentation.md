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
    ├── API Mutafriches                → prise de rendez-vous (ZCal)
    ├── Extension QGIS                 → téléchargement (lien à venir)
    ├── Page Mutafriches personnalisée → prise de rendez-vous (ZCal)
    └── Nos services partenaires       → Bénéfriches (lien externe)

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
| Documentation technique (API et iframe) | `/documentation-integration` | Footer, bouton Documentation, page d'accueil | Développeurs intégrateurs | Guide d'intégration iframe et référence de l'API REST | Contenu éditorial (`DocumentationIframe.tsx`, `DocumentationApi.tsx`) |
| Données utilisées | `/donnees-utilisees` | Footer, pages partenaires | Technique | État des APIs externes et des référentiels importés | API (`/api/donnees-externes/*`) |
| Documentation des sources de données | `/documentation-donnees` | Footer, page Données utilisées | Partenaires | Par source : champs récupérés, traitement, critères alimentés ; export PDF | `SOURCES_DONNEES` (`packages/shared-types`) |
| Pages de tests | `/tests` | Footer | Équipe | Outils de diagnostic internes | — |

## Fichiers

| Page | Composant |
|---|---|
| Comprendre les analyses | `features/comprendre-analyses/pages/ComprendreAnalysesPage.tsx` |
| Intégrer Mutafriches | `features/integrer/pages/IntegrerMutafrichesPage.tsx` |
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
- Lien de téléchargement de l'extension QGIS : bouton désactivé en attendant.
- Deux pages décrivent les sources de données (« Comprendre les analyses », onglet Sources, et « Documentation des sources de données ») : à fusionner ou à différencier.
