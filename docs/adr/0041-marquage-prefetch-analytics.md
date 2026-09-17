# ADR-0041 : Marquer les appels de pré-chauffe du cache (`source_utilisation = PREFETCH`)

**Date** : 2026-09-16
**Statut** : Accepté

## Contexte

Le tableau de bord Metabase affichait un « ratio entre qualification et analyse de site » de
**13,3 %**, calculé ainsi :

```sql
SELECT 100.0 * (SELECT COUNT(*) FROM evaluations)
     / (SELECT COUNT(*) FROM enrichissements WHERE statut IN ('succes','partiel'));
```

Lu comme un taux de conversion, ce chiffre suggérait que 87 % des sites qualifiés étaient
abandonnés avant l'analyse. C'est faux : les deux tables ne comptent pas la même population.

La table `enrichissements` enregistre une ligne par appel à `POST /enrichissement`
mono-parcelle, sans distinguer l'humain du robot. Or le workflow
`.github/workflows/partenaires-prefetch.yml` appelle cet endpoint chaque jour pour **chaque
site partenaire**, afin de réchauffer le cache (TTL 24 h). Ces appels portent
`Origin: https://mutafriches.beta.gouv.fr` et sont donc détectés `SITE_STANDALONE`, exactement
comme une qualification utilisateur.

Mesures en production le 2026-09-16 :

| Indicateur | Valeur |
|---|---|
| Lignes au dénominateur | 12 319 |
| Parcelles distinctes | 1 324 (soit **9,3 passages par parcelle**) |
| Lignes sur des parcelles de `partenaire_sites` | 8 531 (69 %, sous-estimé) — proxy, pas une preuve d'origine robot |
| Lignes servies depuis le cache | 5 229 (42 %) |

La signature est sans ambiguïté : le nombre de lignes par parcelle égale le nombre de jours
écoulés depuis son entrée dans la liste partenaire (93 lignes pour 89 jours, 78 pour 76, 56
pour 55). Une exécution de pré-chauffe s'étale par ailleurs de 04:00 à ~11:00 UTC — un plateau
qui ressemble à du trafic de journée alors qu'il n'y a aucun humain derrière.

Mesuré sur `evenements_utilisateur`, qu'aucun robot n'alimente : **56,9 %** en cumulé depuis le
début du tracking, **69,1 %** sur les 90 derniers jours (130 sessions sur 188). Ces deux nombres
ne sont pas interchangeables : périodes et cohortes diffèrent, et il s'agit d'une cooccurrence
d'événements par session, pas d'un taux de conversion par site.

Trois filtres a posteriori ont été envisagés puis écartés :

- **`integrateur LIKE 'partenaire:%'`** — pollué par le backfill de juillet 2026, qui a
  rétro-tagué de l'historique de pré-chauffe. Le script le documentait déjà :
  « enrichissements / sites : signal BRUITÉ ».
- **Jointure sur `partenaire_sites`** — rate les identifiants normalisés par
  `normalizeParcelId` (section `0E` → `E`) quand le seed a conservé la forme brute.
- **Créneau horaire** — la pré-chauffe déborde sur les heures ouvrées et le trafic réel
  commence avant sa fin.

Aucun de ces filtres n'est stable dans le temps : le bruit doit être écarté à l'écriture.

## Décision

Un query param `prefetch=true` sur `POST /enrichissement` fait enregistrer
`source_utilisation = PREFETCH` au lieu de `SITE_STANDALONE`. Le script
`prefetch-partenaires.ts` le pose sur tous ses appels.

Le marqueur n'est honoré que si l'origine détectée est `SITE_STANDALONE` — même garde que le
canal partenaire (ADR-0021) — et l'iframe reste prioritaire. C'est une **classification
déclarative, pas une authentification** : l'origine n'est pas vérifiée cryptographiquement, et
un client serveur peut la déclarer comme le fait notre propre script.

Le marquage couvre les deux tables : mono-parcelle (`enrichissements`) et multi-parcelle
(`sites`) passent par la même détection d'origine.

## Alternatives écartées

- **En-tête secret vérifié** : il apporterait une réelle authentification du robot, ce que le
  query param ne fait pas. Écarté par proportionnalité, pas par équivalence : il s'agit de
  classer des appels pour des statistiques d'usage, pas de protéger un accès, et cela
  ajouterait un secret à gérer sur quatre environnements. Le risque accepté est qu'un tiers
  déclare ses propres appels comme robots — il se retire alors des statistiques. Il peut de
  toute façon déjà polluer les agrégats en appelant l'endpoint sans marqueur, ce que ce choix
  ne change ni en bien ni en mal.
- **Table dédiée aux appels robots** : dupliquerait le cache et la logique de TTL. Le
  pré-chauffe doit emprunter exactement le même chemin que l'utilisateur, sinon il ne chauffe
  pas le bon cache.
- **Ne rien marquer et filtrer dans Metabase** : c'est l'état initial, et il a produit une
  erreur d'interprétation d'un facteur 5.

## Conséquences

- Les requêtes d'usage sur `enrichissements` et `sites` doivent écarter la pré-chauffe avec
  `source_utilisation IS DISTINCT FROM 'PREFETCH'` : un `<> 'PREFETCH'` exclurait aussi les
  lignes à NULL, qu'il faut conserver et présenter comme origine inconnue.
- **L'historique antérieur au déploiement reste bruité** : le marquage ne vaut que pour les
  appels à venir. Pour toute période couvrant l'avant, mesurer l'usage sur
  `evenements_utilisateur`, qui n'a jamais contenu de robot.
- `SourceUtilisation.PREFETCH` n'apparaît jamais dans `evaluations` : la pré-chauffe n'appelle
  pas `/evaluation/calculer`. Cette table reste un signal propre.
- **`partenaire_sites` doit rester en forme canonique.** Le seed normalise désormais les
  parcelles à l'insertion (`normalizeParcelId`), comme `ajouterSite()` le faisait déjà : sans
  ça, les sections `0X` déclarées par un partenaire (CCI92 notamment) ne correspondent jamais à
  ce que l'API enregistre, et toute jointure entre les deux tables sous-estime la part
  partenaire. L'`idtup` n'est pas dérivé des parcelles pour les sites du seed (clé fournie par
  le partenaire), donc normaliser l'existant ne casse ni la contrainte d'unicité ni les données
  localStorage des utilisateurs, qui sont clées par `idtup` (ADR-0021).
- Le pré-chauffe dédoublonne les sites partageant le même ensemble de parcelles : même clé de
  cache, donc second appel sans valeur.
- Les lignes à `source_utilisation` NULL subsistent (~500), d'origines non départagées :
  `PartenairesService.ajouterSite()` (effet de bord d'une action utilisateur, qui écrit dans
  `sites` même en mono-parcelle puisqu'il appelle `enrichirSite()` directement), historique
  antérieur au tracking, et appels internes sans origine. Les traiter comme « origine
  inconnue », jamais comme des qualifications.
