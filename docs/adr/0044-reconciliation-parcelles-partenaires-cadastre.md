# ADR-0044 : Réconciliation des parcelles partenaires avec le cadastre courant

**Date** : 2026-09-23
**Statut** : Accepté

## Contexte

Les listes de parcelles des partenaires viennent des fichiers fonciers, d'un millésime plus
ancien que le plan cadastral interrogé par l'enrichissement (apicarto, PCI). Entre les deux,
des parcelles ont été divisées et renumérotées. Exemple : le site `uf920360030903` de la CCI 92
(Gennevilliers) compte 8 parcelles, dont 7 ont disparu du cadastre entre les millésimes Etalab
de septembre et décembre 2025.

L'enrichissement écarte en silence une parcelle introuvable
(`CadastreEnrichissementService.enrichirMulti`, simple entrée `Cadastre:<id>` dans
`sourcesEchouees`). Le site est alors réduit aux parcelles restantes : la carte n'en montre
qu'une partie, et surtout la surface du site et la surface bâtie (poids 2 chacune) sont
sous-estimées, ce qui fausse les indices de mutabilité.

Au 2026-09-23 : 151 parcelles disparues sur 57 sites, dont 47 sites sur 316 à la DDT des Vosges
(132 parcelles, remembrements compris), 6 sites sur 16 à la CCI 92, 3 à la SCET et 1 chez AURA.
Aucun pour le PETR Sologne ni la CCPEIDF.

## Décision

> Nous signalons les parcelles introuvables dans l'UI, et nous corrigeons les données
> partenaires en remplaçant chaque parcelle disparue par ses successeurs, retrouvés par
> recouvrement géométrique dans les archives du cadastre Etalab.

1. **Signalement** : la page partenaire compare les parcelles du site à
   `identifiantsParcelles` renvoyé par l'enrichissement et affiche une alerte listant les
   absentes. Aucun changement d'API n'est nécessaire.
2. **Contours** : l'enrichissement multi-parcelle expose `geometriesParcelles` (géométrie de
   chaque parcelle trouvée). La carte trace les limites internes que l'union efface.
3. **Réconciliation** : le script one-shot `partenaires:reconcilier-cadastre` :
   - repère les parcelles absentes du dernier millésime Etalab, absence confirmée sur apicarto ;
   - récupère leur géométrie au dernier millésime où elles existaient ;
   - retient les parcelles actuelles qui les recouvrent et dont au moins 50 % de la surface
     tombe dans l'emprise historique du site (au-delà, une fusion avec une parcelle tierce
     ferait entrer du voisinage dans le site) ;
   - confirme chaque successeur sur apicarto et écrit un rapport, relu à la main.
4. **Données** : les listes statiques (UI et backend) sont mises à jour, et une migration de
   données réécrit `partenaire_sites.parcelles` des sites seedés concernés. L'`idtup` ne
   change pas : la saisie terrain (localStorage) et le nom du site restent rattachés.

## Options envisagées

### Option A — Réconciliation géométrique via les archives Etalab (retenue)

- Avantages : source ouverte, trimestrielle depuis 2017 ; le recouvrement reproduit
  l'emprise d'origine ; le seuil d'inclusion écarte les fusions avec le voisinage.
- Inconvénients : dépend de la disponibilité des archives ; un décalage d'un trimestre avec
  apicarto est possible (d'où la double confirmation).

### Option B — Filiation DGFiP des parcelles (parcelle mère vers parcelles filles)

- Avantages : lien officiel, sans calcul géométrique.
- Inconvénients : pas diffusée en open data exploitable ; accès restreint aux fichiers
  fonciers du Cerema.

### Option C — Remplacement automatique à l'enrichissement

- Avantages : corrige aussi les sites saisis par les utilisateurs, sans intervention.
- Inconvénients : réécrit silencieusement la demande ; coûteux à chaque appel (téléchargement
  d'archives) ; un faux successeur fausserait l'évaluation sans que personne ne le voie.

### Option D — Alerte seule

- Avantages : minimal, aucun risque sur les données.
- Inconvénients : la carte et les indices restent faux pour les sites concernés.

## Conséquences

### Positives

- Les sites concernés retrouvent leur emprise, leur surface et des indices justes.
- Une renumérotation future se voit immédiatement dans l'UI au lieu de passer inaperçue.
- Le script se relance à chaque nouveau partenaire ou nouveau millésime.

### Négatives / Risques

- Les listes de parcelles s'allongent (une parcelle divisée donne plusieurs successeurs).
- `geometriesParcelles` alourdit la réponse d'enrichissement et le cache.
- Le rapport doit être relu : une couverture inférieure à 100 % ou une parcelle écartée
  demandent un arbitrage manuel. Au premier passage, 7 sites des Vosges (remembrements)
  ont une couverture de 81 à 99 %, avec des successeurs situés à 72 % ou plus dans l'emprise.
  Retenus tels quels.
- Les fichiers générés par `partenaires:resolve-idu` (SCET) sont corrigés à la main : une
  régénération depuis l'inventaire ne retrouverait plus les parcelles disparues et devra être
  suivie d'une nouvelle réconciliation.

### Migration

- Migration de données `0035_partenaires_parcelles_renumerotees.sql`, jouée par le
  `postdeploy` ; sans effet sur une base où les sites ne sont pas seedés.
- Les sites corrigés changent de liste de parcelles, donc de clé de cache site :
  premier enrichissement complet, puis pré-chauffe habituelle.

## Liens

- Script : `apps/api/src/scripts/reconcilier-cadastre-partenaire.ts`,
  `apps/api/src/scripts/cadastre-successeurs/`
- Rapports : `apps/api/src/scripts/cadastre-successeurs/data/<slug>.rapport.json`
- UI : `apps/ui/src/features/partenaires/core/parcelles-introuvables.ts`,
  `apps/ui/src/features/partenaires/core/components/SiteMap.tsx`
- Archives : https://cadastre.data.gouv.fr/data/etalab-cadastre/
- ADR liés : ADR-0021 (partenaires en base), ADR-0029 (résolveur d'IDU)
