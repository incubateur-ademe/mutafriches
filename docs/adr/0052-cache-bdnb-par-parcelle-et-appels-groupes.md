# ADR-0052 : Cache de la surface bâtie BDNB par parcelle et appels groupés

**Date** : 2026-10-15
**Statut** : Accepté

## Contexte

L'API BDNB plafonne à **10 000 appels par mois et par IP sortante** (en-têtes `x-quota-*`, réponse
429 « Quota exceeded » au-delà, remise à zéro à une date fixe). Le quota compte des **appels HTTP**,
pas des parcelles, et l'API ramène tout `limit` supérieur à 10 lignes : une parcelle de plus de 10
groupes de bâtiments coûte plusieurs appels.

Les mesures d'octobre 2026 sur la base de prod :

- la pré-chauffe des partenaires rejoue ~270 sites (~1 330 appels) tous les 2 à 3 jours, quand elle
  tombe juste après l'expiration du cache d'enrichissement de 24 h ;
- 19 077 appels en juillet, 24 510 en août, 12 784 en septembre pour la seule prod, soit un quota
  épuisé en ~13 jours par fenêtre mensuelle (pannes du 29/07 au 14/08 et du 27/08 au 14/09) ;
- staging (autre région Scalingo, autre IP) est lui aussi tombé à 0 en octobre ;
- sans surface bâtie, `raccordementEau` devient « ne sait pas » et la fiabilité baisse, et les pages
  partenaires (qui acceptent un enrichissement dégradé) gardent le résultat 24 h.

Les PR #247 (limiteur à 100 requêtes/minute, nouvelles tentatives, pagination) et #249 (échec
immédiat quand le quota est épuisé) rendent le client correct ; elles ne réduisent pas la
consommation. La surface bâtie change au rythme des millésimes BDNB, pas au jour le jour.

## Décision

> La surface bâtie est mise en cache **par parcelle pendant 30 jours** dans `cache_bdnb_parcelles`,
> et les parcelles manquantes sont interrogées **par appels groupés** (`parcelle_id=in.(…)`).

- **Table** `cache_bdnb_parcelles` : `parcelle_id` (clé), `surface_bati` (0 = non bâtie, réponse
  valide également mise en cache), `groupes` (détail `{id, surface}` par groupe de bâtiments),
  `date_recuperation`. Ce n'est pas un référentiel importé : pas de préfixe `raw_`, pas d'entrée dans
  `IMPORT_DATASETS`.
- **`SurfaceBatieService`** (`services/cadastre/`) orchestre : lecture groupée du cache, appels BDNB
  pour les parcelles absentes ou plus vieilles que 30 jours (par lots de 10 parcelles, 5 appels
  simultanés au plus), écriture en lot. Une parcelle déjà en cache ne consomme rien.
- **Valeur périmée conservée en cas d'erreur** : si la BDNB échoue (quota, panne) et qu'une entrée
  périmée existe, elle est servie plutôt que « surface manquante ». Un échec n'est jamais mis en
  cache.
- **`BdnbCacheRepository`** ne lève jamais : un cache illisible dégrade vers l'appel BDNB.
- **`BdnbService.getSurfacesBatiesParLot`** remplace `getSurfaceBatie`. Un identifiant contenant
  autre chose que `[0-9A-Z]` est refusé, car il est injecté dans un filtre PostgREST.
- Le cache d'enrichissement de 24 h est inchangé : il se situe au-dessus.

## Options envisagées

### Option A — Cache par parcelle de 30 jours + appels groupés (retenue)

- Avantages : une parcelle déjà vue ne coûte plus rien ; la pré-chauffe tombe d'environ 1 330 appels
  tous les 2 à 3 jours à presque zéro ; l'appel groupé divise le coût d'une parcelle neuve (le coût
  devient ~ nombre de groupes / 10 au lieu d'au moins 1 par parcelle) ; la valeur périmée survit à
  une panne ; `groupes` permettra de dédoublonner les groupes à cheval sur plusieurs parcelles sans
  nouvel appel.
- Inconvénients : une table et une migration ; une donnée jusqu'à 30 jours en retard sur la BDNB
  (acceptable : la BDNB publie quelques millésimes par an).

### Option B — Clé API BDNB

- Avantages : quota propre, aucun code.
- Inconvénients : dépend d'une démarche extérieure et du palier proposé par la BDNB ; ne réduit pas
  la consommation. Reste souhaitable en complément (voir Conséquences).

### Option C — Allonger le TTL de pré-chauffe (48 h)

- Avantages : trivial.
- Inconvénients : divise la consommation par ~2 seulement, et ne protège ni les utilisateurs ni les
  parcelles neuves.

### Option D — Importer la BDNB en local (`raw_*`)

- Avantages : plus aucun quota.
- Inconvénients : volumétrie à évaluer, import annuel à outiller ; disproportionné tant que le
  volume reste d'environ 1 300 parcelles distinctes par mois (septembre 2026).

## Conséquences

- Consommation attendue : ~1 800 appels par mois pour les 1 828 parcelles partenaires au premier
  passage, puis presque rien tant que les entrées ont moins de 30 jours, plus les parcelles neuves
  des utilisateurs.
- **Le cache ne protège pas d'un afflux de parcelles neuves** : le premier passage de chaque
  parcelle coûte un appel (plus de 10 000 parcelles neuves dans la même fenêtre épuiseraient encore
  le quota). L'appel groupé repousse cette limite de plusieurs fois ; une clé API ou un import local
  restent les recours si le volume change d'ordre de grandeur.
- La table démarre vide au déploiement : la première pré-chauffe refait ~1 828 appels par
  environnement. Elle ne peut pas aboutir tant que le quota est épuisé (staging jusqu'au 22/10).
- Pour forcer un recalcul (nouveau millésime BDNB, test), vieillir `date_recuperation` plutôt que
  supprimer les lignes, comme pour les autres caches.

## Liens

- PR #247 et #249 : limiteur, nouvelles tentatives, pagination, quota épuisé
- `docs/SUJETS-A-TRAITER.md` : double comptage des groupes à cheval sur plusieurs parcelles
- `apps/api/src/enrichissement/services/cadastre/surface-batie.service.ts`
