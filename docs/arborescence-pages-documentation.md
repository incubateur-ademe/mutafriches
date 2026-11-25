# Arborescence des pages de documentation et d'information technique (UI)

## Principe

- Le **menu principal** porte les pages destinées à tous les publics : comprendre le calcul, choisir un mode d'intégration.
- La page **Intégrer Mutafriches** est l'entrée unique vers les modes d'intégration : quatre solutions y ont leur carte (extension QGIS, API, page personnalisée, services partenaires). L'extension QGIS, l'API et l'iframe ont chacune leur page de détail sous `/utiliser-mutafriches/` ; l'iframe n'a pas de carte, sa page s'atteint depuis la documentation de l'API.
- L'en-tête n'a plus de bouton **Documentation** : le menu principal suffit à atteindre « Intégrer Mutafriches », par l'entrée « Utiliser Mutafriches » (la page garde son titre).
- Le **footer** porte les pages techniques : état des sources, détail des données, pages de tests, et un rappel vers « Intégrer Mutafriches ».

## Arborescence

```
Menu principal
├── Comprendre les analyses            /comprendre-les-analyses
│   ├── onglet Définitions et coef. des critères
│   └── onglet Sources des données
└── Utiliser Mutafriches               /utiliser-mutafriches (page « Intégrer Mutafriches »)
    ├── Extension QGIS                 → tutoriel /utiliser-mutafriches/extension-qgis
    ├── API Mutafriches                → déclaration du domaine (formulaire en modale), documentation /utiliser-mutafriches/api
    │   └── lien vers l'iframe         → documentation /utiliser-mutafriches/iframe
    ├── Page Mutafriches personnalisée → demande par formulaire (modale), puis rendez-vous (ZCal) au choix
    ├── Nos services partenaires       → Bénéfriches et UrbanVitaliz (liens externes)
    └── Besoin d'aide pour choisir     → prise de rendez-vous (ZCal)

Footer
├── Intégrer Mutafriches (QGIS, API et iframe)  /utiliser-mutafriches
├── Données utilisées                           /donnees-utilisees
│   ├── onglet APIs externes
│   ├── onglet Imports
│   └── lien vers Documentation des sources de données
├── Documentation des sources de données        /documentation-donnees
└── Pages de tests                              /tests

Adresse conservée
└── /documentation-integration         → redirigée vers /utiliser-mutafriches/api
```

## Pages

| Page | Route | Entrée | Public | Contenu | Source des données |
| --- | --- | --- | --- | --- | --- |
| Comprendre les analyses | `/comprendre-les-analyses` | Menu | Tous | Critères, définitions, coefficients, score de chaque valeur par usage ; source, format et version de chaque critère, dont les référentiels qui pré-remplissent un critère saisi (pollution : ADEME, SIS, ICPE) ; sources des données restituées hors calcul (îlots de chaleur) | `MATRICE_SCORING_DOC` (généré par `pnpm docs:matrice:gen`), `DEFINITIONS_CRITERES`, `getSourceCritere`, `getSourcesPreRemplissage`, `SOURCES_HORS_CALCUL` (`packages/shared-types/src/documentation/`) |
| Intégrer Mutafriches | `/utiliser-mutafriches` | Menu, footer, page d'accueil | Collectivités, partenaires | Les quatre façons d'utiliser Mutafriches à l'échelle d'un territoire, avec un appel à l'action par solution | Contenu éditorial, dans la page |
| Utiliser l'extension QGIS | `/utiliser-mutafriches/extension-qgis` | Carte « Extension QGIS » | Géomaticiens, collectivités | Tutoriel en huit étapes illustrées : installation, réglages, inventaire CNIG, contrôle, analyse, carte, tables attributaires et fiabilité ; questions fréquentes en accordéons | `ETAPES_TUTORIEL_QGIS` (`features/integrer/data/tutoriel-qgis.ts`) ; captures `public/images/tutoriel-qgis/`, produites par `scripts/captures-tutoriel.sh` du dépôt `mutafriches-qgis` |
| Utiliser l'API Mutafriches | `/utiliser-mutafriches/api` | Carte « API Mutafriches », ancienne adresse `/documentation-integration` | Développeurs intégrateurs | Schéma du parcours et choix de la solution, déclaration du domaine (bouton ouvrant le formulaire en modale, accès immédiat) et tableau des réponses de l'API selon la situation du domaine, première analyse en trois étapes (envoi et réception côte à côte), lecture du résultat, exemple complet à copier (JavaScript, curl) ; en accordéons : relecture d'une évaluation, sites d'une commune, inventaires, erreurs, référence des appels | Contenu éditorial dans la page ; exemples dans `features/integrer/data/exemples-integration.ts` ; critères de terrain et valeurs admises tirés de `@mutafriches/shared-types` (`features/integrer/data/criteres-terrain.ts`) |
| Intégrer l'iframe Mutafriches | `/utiliser-mutafriches/iframe` | Page « Utiliser l'API Mutafriches » (section finale) | Développeurs intégrateurs | Exemple minimal, mise en place, identifiant d'intégrateur et formulaire de demande, paramètres, messages reçus, sécurité | Idem |
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

- `/documentation-integration` reste servie, redirigée vers `/utiliser-mutafriches/api` : elle est citée dans les mails d'onboarding des intégrateurs (`docs/acces-api-integrateur.md`).
- Les pages de détail de « Intégrer Mutafriches » partagent un gabarit : fil d'Ariane (Accueil › Intégrer Mutafriches › page), sommaire en menu latéral collant. Chaque entrée du sommaire vise l'identifiant d'une section.
- Les tableaux de « Comprendre les analyses » ne se saisissent pas à la main : ils découlent de l'algorithme, et des tests cassent en cas de divergence.
- Un nouveau critère exige sa définition dans `DEFINITIONS_CRITERES` et, s'il est automatique, sa source dans `sources-criteres.data.ts`.
- Une source de `SOURCES_DONNEES` qui n'alimente aucun critère doit figurer dans `SOURCES_HORS_CALCUL` (`sources-criteres.data.ts`), sinon `comprendre-analyses.data.spec.ts` casse.
- Un référentiel qui pré-remplit la réponse d'un critère saisi se déclare dans `SOURCES_PRE_REMPLISSAGE` (`sources-criteres.data.ts`) : il apparaît alors sur la ligne du critère, en « Manuel, pré-rempli ». Seule la pollution est concernée (ADEME, SIS, ICPE, cf. `pollution-detection.service.ts`).

## A voir

- L'iframe n'a plus de carte sur « Intégrer Mutafriches » (maquette de novembre 2026) : sa page n'est liée que depuis la documentation de l'API.
- Mails d'onboarding : remplacer à terme `/documentation-integration` par `/utiliser-mutafriches/api`.
- Deux pages décrivent les sources de données (« Comprendre les analyses », onglet Sources, et « Documentation des sources de données ») : à fusionner ou à différencier.
- Le fil d'Ariane de « Documentation des sources de données » passe par « Données utilisées », qui n'est plus dans le menu.
