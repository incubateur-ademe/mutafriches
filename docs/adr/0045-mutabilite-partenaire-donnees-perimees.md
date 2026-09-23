# ADR-0045 : Mutabilité partenaire face aux données enrichies qui changent

**Date** : 2026-09-23
**Statut** : Accepté

## Contexte

Sur les pages partenaires, la connaissance terrain et la mutabilité calculée sont stockées dans
le navigateur (ADR-0021). La mutabilité y est une copie figée. Le cron réenrichit chaque site
chaque nuit : la saisie est conservée, mais la mutabilité n'est jamais recalculée.

À la réouverture d'un site, la page affichait donc les données automatiques du jour à côté
d'indices calculés sur celles d'un autre jour, sans le signaler. L'export CNIG reprenait cette
copie en l'étiquetant avec la version courante de l'algorithme, et échouait même en 400 : l'UI
envoyait `v1.14` là où le DTO attendait `1.14`.

Ces changements sont fréquents. Sur 120 jours de la base (backup de prod), 20 % des
ré-enrichissements d'un même site modifient au moins un critère, et 292 des 466 sites
concernés ont changé au moins une fois. Il s'agit surtout de sources indisponibles par
intermittence (surface bâtie BDNB), mais aussi de vraies évolutions (Enedis, PLU, cadastre).

## Décision

> La mutabilité locale est enregistrée avec son contexte de calcul et comparée aux données du
> jour. L'export CNIG ne la reprend plus : il la recalcule côté serveur.

1. **Contexte de calcul** : `ContexteCalcul` enregistre les valeurs des 20 critères automatiques
   (`CRITERES_METADATA`), la version de l'algorithme et la date. Il est stocké à côté de la
   mutabilité dans le localStorage (`calcul-obsolete.ts`).
2. **Alerte** : à la réouverture, `ecartCalcul` compare ce contexte à l'enrichissement du jour.
   - Critère modifié, version changée, ou calcul antérieur au suivi : alerte avec un bouton
     « Recalculer ».
   - Critère devenu indisponible : simple information, sans conseil de recalcul, car recalculer
     pendant une panne dégraderait un résultat plus complet.
3. **Export** : le serveur recalcule la mutabilité avec `CalculService` (calcul pur, sans
   persistance), sur l'enrichissement du jour, la saisie transmise et la version courante. Le
   contrat n'accepte plus `mutabilite` ni `versionAlgorithme` venant du client.

## Options envisagées

### Option A — Détecter et signaler, recalculer à l'export (retenue)

- Avantages : petit changement, sans migration ; l'utilisateur garde la main sur ce qu'il voit ;
  l'export est toujours cohérent ; la sémantique `null` / indisponible est préservée.
- Inconvénients : l'écran peut rester périmé tant que l'utilisateur ne recalcule pas ; le
  fichier exporté peut différer de l'écran (l'alerte le signale).

### Option B — Recalcul automatique à l'ouverture du site

- Avantages : l'écran est toujours à jour.
- Inconvénients : un jour de panne de source, le résultat se dégraderait en silence ; les
  indices changent sous les yeux de l'utilisateur sans explication.

### Option C — Saisie terrain stockée en base, recalcul par le cron

- Avantages : saisie partagée entre les utilisateurs du partenaire ; tout reste à jour.
- Inconvénients : revient sur ADR-0021 (saisie restée locale) et pose une question de
  gouvernance des données ; chantier plus lourd.

## Conséquences

### Positives

- Plus de divergence silencieuse entre données du jour et indices affichés.
- L'export CNIG avec mutabilité fonctionne à nouveau et porte la bonne version.
- Les mutabilités calculées avant cette version, notamment sur les sites corrigés par
  l'ADR-0044, sont signalées (contexte inconnu).

### Négatives / Risques

- Les colonnes `mf_*` sont désormais renseignées pour tout site dont la saisie terrain est
  transmise, même si l'utilisateur n'a jamais cliqué sur « Calculer ».
- Un export recalcule autant de mutabilités qu'il y a de sites saisis (calcul pur, négligeable
  au regard de l'enrichissement).
- Les pannes de source restent mises en cache 24 h ; empêcher qu'un résultat dégradé remplace
  un résultat complet est un chantier distinct.

## Liens

- UI : `apps/ui/src/features/partenaires/core/calcul-obsolete.ts`,
  `apps/ui/src/features/partenaires/core/hooks/useSiteUserData.ts`
- API : `apps/api/src/partenaires/export/cnig-export.service.ts`
- ADR liés : ADR-0021 (saisie locale), ADR-0042 (export CNIG, précisé ici), ADR-0044
