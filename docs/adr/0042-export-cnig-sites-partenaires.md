# ADR-0042 : Export CNIG des sites partenaires généré côté serveur

**Date** : 2026-09-17
**Statut** : Accepté

## Contexte

Les pages partenaires (`/partenaires/:slug`) n'offraient qu'un export site par site, au format
JSON propre à Mutafriches. Les partenaires ont demandé un export unique regroupant tous leurs
sites, au standard CNIG Friches — la structure d'échange que le décret n° 2023-1259 impose aux
inventaires de friches, et que consomme Cartofriches.

Trois contraintes cadrent l'implémentation :

1. **Volumétrie.** La DDT des Vosges compte 316 sites. Un export piloté par le navigateur
   enverrait une requête d'enrichissement par site, contre une limite de 100 requêtes par
   minute et par IP (`ThrottlerGuard`, `app.module.ts`).
2. **Localisation des données.** La connaissance terrain saisie par l'utilisateur et la
   mutabilité calculée vivent en `localStorage`, jamais côté serveur (ADR-0021). Or quatre
   attributs CNIG en dépendent : `bati_etat`, `bati_patrimoine`, `bati_pollution` et
   `sol_pollution_existe`.
3. **Couverture du standard.** Mutafriches ne renseigne que 16 des 51 attributs du standard
   (plus 4 issus de la saisie). Il ne connaît notamment pas la typologie de friche
   (`site_type`), pourtant obligatoire.

## Décision

> Nous générons l'export côté serveur, à partir du cache d'enrichissement, et la connaissance
> terrain transite dans le corps de la requête sans être persistée.

Concrètement, `POST /api/partenaires/:slug/export` :

- lit le cache d'enrichissement en lecture seule (`EnrichissementService.lireCacheSite`), sans
  journaliser d'appel ; le pré-chauffe quotidien le maintient chaud pour tous les sites en base ;
- réenrichit les manques dans un budget de 20 secondes, en marquant ces appels `PREFETCH` ;
- reçoit `connaissanceTerrain` et `mutabilite` par `idtup`, pour les seuls sites qualifiés dans
  le navigateur appelant ;
- écarte les sites sans commune ni centroïde, et les liste dans un rapport renvoyé en en-tête.

Les attributs inconnus sortent à `inconnu`, valeur conventionnelle du standard (§3.3), et jamais
à une valeur devinée. Les indices de mutabilité, absents du standard, ne sont ajoutés (colonnes
`mf_*`) que sur demande explicite : le fichier par défaut reste validable sur validata.fr.

## Options envisagées

### Option A — Export serveur, connaissance terrain transmise (retenue)

- Avantages : un seul appel HTTP ; s'appuie sur un cache déjà pré-chauffé ; le fichier porte la
  saisie du partenaire, donc les attributs CNIG qui en dépendent ; réutilisable hors UI.
- Inconvénients : la saisie locale transite par le serveur, ce qui nuance l'ADR-0021 ; l'export
  dépend de l'état du cache.

### Option B — Export serveur sans la saisie

- Avantages : aucune donnée locale ne quitte le navigateur ; contrat d'API plus simple (GET).
- Inconvénients : `bati_etat`, `bati_patrimoine`, `bati_pollution` et `sol_pollution_existe`
  sortiraient à `inconnu` même pour un site entièrement qualifié — l'export perdrait le travail
  d'inventaire du partenaire, qui est précisément ce qu'il veut partager.

### Option C — Export construit dans le navigateur

- Avantages : tout reste local ; aucune évolution d'API.
- Inconvénients : 316 requêtes contre une limite de 100 par minute ; plusieurs minutes d'attente
  et échecs partiels ; logique de sérialisation non réutilisable par un script ou un intégrateur.

## Conséquences

### Positives

- Un fichier unique conforme, validable automatiquement contre le TableSchema officiel
  `cnigfr/schema-friches` v1.0.6 : la conformité se vérifie sans relecture humaine.
- Les correspondances Mutafriches vers CNIG vivent dans `packages/shared-types/src/cnig/`,
  testées unitairement et partagées entre API et UI.
- Le rapport d'export nomme les sites écartés et leur motif : pas de fichier silencieusement
  incomplet.

### Négatives / Risques

- **Nuance à l'ADR-0021** : la connaissance terrain traverse le serveur le temps d'une requête.
  Elle n'est ni stockée ni journalisée, et ne contient aucune donnée nominative.
- **Export partiel possible** : cache froid et budget dépassé produisent un fichier incomplet.
  Le pré-chauffe quotidien rend ce cas marginal, mais il reste visible dans le rapport.
- **Appels marqués `PREFETCH`** : les réenrichissements déclenchés par un export sont comptés
  comme du pré-chauffe. C'est volontaire — les compter comme des qualifications utilisateur
  fausserait les ratios d'usage exactement comme le décrit l'ADR-0041 — mais un lecteur de la
  table `enrichissements` ne distingue pas un export d'un robot. Le canal reste lisible via
  `integrateur = 'partenaire:<slug>'`.
- **Ordre des coordonnées** : le CSV suit le fichier de référence CNIG, en `latitude longitude`,
  à l'inverse de la convention WKT usuelle ; le GeoJSON reste en `[longitude, latitude]`
  (RFC 7946). Aucune validation automatique ne couvre ce point : une inversion se voit
  uniquement en ouvrant le fichier dans un SIG.
- **`site_type` toujours à `inconnu`** : Mutafriches n'établit pas la typologie de friche, alors
  que le standard rend l'attribut obligatoire. Une reprise manuelle reste nécessaire pour un
  versement à Cartofriches.
- **Zone à urbaniser non qualifiée** : l'enrichissement ne distingue pas AUc (ouverte) de AUs
  (bloquée). `urba_zone_type` sort à `inconnu` plutôt que d'affirmer une constructibilité non
  vérifiée.

## Liens

- Standard : [CNIG Friches v2023-12 rev. 2025-12](https://cnig.gouv.fr/IMG/pdf/251204_standard_cnig_friches_v2023-12_rev2025-12.pdf)
- Schéma de validation : [cnigfr/schema-friches](https://schema.data.gouv.fr/cnigfr/schema-friches/)
- Modèle et correspondances : `packages/shared-types/src/cnig/`
- Endpoint et sérialiseurs : `apps/api/src/partenaires/export/`
- Interface : `apps/ui/src/features/partenaires/core/components/ExportSitesModal.tsx`
- ADR liés : ADR-0021 (données terrain locales), ADR-0041 (marquage du pré-chauffe)
