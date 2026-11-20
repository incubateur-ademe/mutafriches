# Accès API d'un intégrateur — suivi et exploitation

Un tiers qui veut appeler directement l'API REST (`POST /enrichissement`,
`POST /evaluation/calculer`), depuis son site web **ou** depuis un traitement serveur à serveur,
**déclare lui-même son domaine** : l'accès est ouvert à l'envoi du formulaire, sans intervention
de l'équipe (ADR-0055). Ce document décrit ce qui reste à notre charge : suivre, accompagner,
révoquer.

Le document a deux parties :

1. **[Suivi d'une déclaration](#1-suivi-dune-déclaration)** : où la voir, quoi vérifier, le mail
   d'accueil.
2. **[Référence](#2-référence)** : le fonctionnement, les pièges, les limites, la révocation.

Côté intégrateur, le mode d'emploi est sur la page
[Utiliser l'API](https://mutafriches.beta.gouv.fr/integrer-mutafriches/api) et dans le
[guide d'intégration](./integration/README.md#intégration-api-directe-partenaires).

> À ne pas confondre avec [Ajouter un partenaire](./ajout-partenaire.md), qui publie une page
> `/partenaires/<slug>` dans notre UI. Les deux sont indépendants : un intégrateur API n'a pas
> besoin de page partenaire, et inversement.

---

## 1. Suivi d'une déclaration

### Où la voir

Chaque déclaration crée une ligne dans la table `integrateurs` (canal `api`, statut `actif`) :

```bash
scalingo --app mutafriches --region osc-secnum-fr1 run "pnpm integrateurs:lister"
```

Le prénom, le nom et l'adresse e-mail du déclarant ne sont **pas** dans cette table : ils sont
dans la liste Brevo de l'environnement, avec l'attribut `USAGE_API` coché et la structure et le
domaine en attributs. La colonne `contact_enregistre` vaut
`false` quand Brevo n'a pas reçu le contact (panne, clé absente) : ce déclarant n'est pas
joignable.

### Checklist

- [ ] La structure et le domaine déclarés sont plausibles (sinon :
      [révoquer](#révoquer)).
- [ ] Premiers appels visibles en base ([requête de suivi](#requête-de-suivi)).
- [ ] Volumétrie compatible avec les [limites](#limites-à-annoncer) (100 req/min par IP,
      60 parcelles par site, quota BDNB). Sinon, écrire au contact Brevo.
- [ ] Mail d'accueil envoyé depuis Brevo si l'intégrateur n'a pas pris rendez-vous.
- [ ] Relance à J+7 pour un déclarant sans aucun appel.

### Mail d'accueil

> **Objet :** Bienvenue sur l'API Mutafriches
>
> Bonjour,
>
> Vous avez déclaré le domaine **`{{ORIGINE}}`** pour utiliser l'API Mutafriches : votre accès
> est ouvert, en production (`https://mutafriches.beta.gouv.fr`).
>
> **Authentification.** Chaque `POST` doit porter le header `Origin: {{ORIGINE}}`. Un
> navigateur le pose tout seul ; depuis un serveur ou un script, ajoutez-le vous-même, sans
> quoi l'API répond `403 Origin required`. Les lectures (`GET`) sont ouvertes.
>
> **Parcours complet en trois appels** (`jq` requis) :
>
> ```bash
> BASE=https://mutafriches.incubateur.ademe.dev
> ORIGINE={{ORIGINE}}
>
> # 1. Enrichir un site (1 à 60 parcelles)
> curl -sS -X POST "$BASE/enrichissement" \
>   -H "Content-Type: application/json" -H "Origin: $ORIGINE" \
>   -d '{"identifiants":["49020000AK0118"]}' > enrichissement.json
>
> # 2. Calculer la mutabilité : réponse de l'étape 1 renvoyée intégralement + 9 champs
> jq -n --slurpfile e enrichissement.json '{
>   donneesEnrichies: $e[0],
>   donneesComplementaires: {
>     typeProprietaire: "public",
>     etatBatiInfrastructure: "degradation-moyenne",
>     presencePollution: "ne-sait-pas",
>     valeurArchitecturaleHistorique: "ordinaire",
>     qualitePaysage: "ordinaire",
>     qualiteVoieDesserte: "accessible",
>     trameVerteEtBleue: "hors-trame",
>     presenceEspecesProtegees: "non",
>     presenceZoneHumide: "non"
>   }
> }' | curl -sS -X POST "$BASE/evaluation/calculer" \
>   -H "Content-Type: application/json" -H "Origin: $ORIGINE" \
>   -d @- > evaluation.json
>
> jq '{evaluationId, fiabilite: .fiabilite.note, resultats: [.resultats[] | {rang, usage, indiceMutabilite}]}' evaluation.json
>
> # 3. Relire l'évaluation plus tard
> curl -sS "$BASE/evaluation/$(jq -r .evaluationId evaluation.json)"
> ```
>
> **Trois règles** pour `donneesComplementaires` :
>
> - les 9 champs sont obligatoires ; pour une information inconnue, envoyez `"ne-sait-pas"`
>   (jamais `null` ni une clé absente) ;
> - les valeurs autorisées sont servies par `GET /evaluation/metadata`
>   (`champsComplementairesRequis` et `enums.saisie`) ;
> - renvoyez l'objet de l'étape 1 tel quel dans `donneesEnrichies`, sans le réduire.
>
> **Limites.** 60 parcelles par site, 100 requêtes par minute et par adresse IP. Un site
> identique rejoué dans les 24 heures est servi depuis le cache. Ne découpez pas un grand
> site en plusieurs appels : chaque appel devient un site distinct, avec des indices
> différents. Écrivez-nous plutôt, la limite peut être revue.
>
> **Documentation.** Swagger : https://mutafriches.beta.gouv.fr/api — guide :
> https://mutafriches.beta.gouv.fr/integrer-mutafriches/api
>
> Nous vous préviendrons de toute évolution de l'algorithme ou de l'API. N'hésitez pas à
> revenir vers nous pour toute question ou retour sur les résultats.
>
> Bien cordialement,

### Tests de vérification

Pour reproduire un problème signalé par un intégrateur, avec `BASE` et `ORIGINE` à son
environnement et à son domaine. Le parcours nominal est celui du mail d'accueil : attendre
`201`, `201`, puis `200`.

```bash
# 403 Origin required : sans header Origin
curl -sS -o /dev/null -w "%{http_code}\n" -X POST "$BASE/enrichissement" \
  -H "Content-Type: application/json" -d '{"identifiant":"49020000AK0118"}'

# 403 Origin not allowed : origine voisine, non déclarée (www. ou sans www.)
curl -sS -o /dev/null -w "%{http_code}\n" -X POST "$BASE/enrichissement" \
  -H "Content-Type: application/json" -H "Origin: https://www.{{HOTE}}" \
  -d '{"identifiant":"49020000AK0118"}'
```

### Requête de suivi

En lecture sur la base de l'environnement (cf. [ops/scalingo.md](./ops/scalingo.md)).
Déclarés et actifs, tous canaux :

```sql
SELECT i.canal, i.structure, i.cle_stats, i.statut, i.created_at::date AS declare_le,
       COUNT(e.id) AS appels_calcul,
       COUNT(e.id) FILTER (WHERE e.evaluation_source_id IS NULL) AS evaluations_hors_cache,
       MAX(e.date_calcul)::date AS dernier_appel
FROM integrateurs i
LEFT JOIN evaluations e ON e.integrateur = i.cle_stats
GROUP BY i.id
ORDER BY i.canal, appels_calcul DESC;
```

`appels_calcul` compte chaque appel à `POST /evaluation/calculer`, y compris ceux servis par le
cache de 24 h ; `evaluations_hors_cache` suit le périmètre commun des statistiques. Pour les
qualifications, la même jointure vaut sur `enrichissements` (une parcelle) et `sites` (plusieurs
parcelles), avec `enrichissement_source_id IS NULL` pour écarter le cache. L'extension QGIS se
lit sur les lignes `qgis` : `cle_stats = 'qgis:<hôte>'`, ou `qgis.mutafriches.beta.gouv.fr` pour
les versions antérieures à la déclaration par structure.

Détail d'un intégrateur API :

```sql
SELECT 'enrichissement' AS etape, source_utilisation, COUNT(*), MAX(date_enrichissement) AS dernier
FROM enrichissements WHERE integrateur = '{{HOTE}}' GROUP BY 1, 2
UNION ALL
SELECT 'site multi', source_utilisation, COUNT(*), MAX(date_enrichissement)
FROM sites WHERE integrateur = '{{HOTE}}' GROUP BY 1, 2
UNION ALL
SELECT 'evaluation', source_utilisation, COUNT(*), MAX(date_calcul)
FROM evaluations WHERE integrateur = '{{HOTE}}' GROUP BY 1, 2;
```

Attendu : `source_utilisation = API_DIRECTE`. Les appels antérieurs à septembre 2026
apparaissent en `IFRAME_INTEGREE` (erreur de classement corrigée depuis).

---

## 2. Référence

### Ce qu'est un « accès API » chez nous

Il n'y a **pas de clé d'API**. `IntegrateurOriginGuard` accepte nos propres origines, codées, et
toute origine déclarée en statut `actif` dans la table `integrateurs` pour les canaux `api` et
`qgis` ([ADR-0055](./adr/0055-registre-integrateurs-declaration-par-domaine.md), qui amende
l'[ADR-0011](./adr/0011-securisation-origin-guard-sans-api-key.md)). CORS suit la même liste.

Le contrôle d'origine **n'est pas une autorisation** : n'importe qui peut déclarer un domaine.
Il sert à savoir qui appelle. Les protections réelles sont la limite de débit, les caches et la
révocation.

- **Déclaration** : `POST /api/integrateurs/declarations`, depuis les formulaires du site ou
  l'extension QGIS. Limitée à 5 appels par heure et par IP. Redéclarer un domaine ne crée rien.
- **Domaines refusés** : tout ce qui n'est pas un nom de domaine complet avec son extension
  (`mon-service`, `intranet`, adresse IP), schéma autre que `https`, port explicite, suffixe
  local, nos propres domaines. La règle de format est partagée par le formulaire et l'API
  (`hoteDeDomaineDeclare`, `shared-types`), les domaines réservés restent côté API
  (`normaliserDomaineDeclare`).
- **Délais** : une déclaration vaut tout de suite sur le conteneur qui l'a reçue, dans la minute
  sur les autres (CORS ne lit que le cache du registre) ; une révocation prend effet en une
  minute au plus.
- **Iframe** : l'iframe tourne sur notre domaine, ses appels portent notre origine. Un
  intégrateur iframe est déclaré dans `INTEGRATEURS_IFRAME` (`shared-types`), qui alimente aussi
  `frame-ancestors` ; une origine déclarée pour l'API ne permet pas de nous embarquer.

### Identification dans les statistiques

L'intégrateur est identifié par **l'hôte de son `Origin`**, enregistré dans la colonne
`integrateur` (`benefriches.ademe.fr`, par exemple), avec `source_utilisation = API_DIRECTE`.
La même valeur est dans `integrateurs.cle_stats` : c'est la clé de jointure. L'extension QGIS
envoie en plus `X-Mutafriches-Client: qgis/<version>` et s'écrit `qgis:<hôte>`. Le paramètre
`?integrateur=` n'est lu qu'en mode iframe (`iframe=true`) et ignoré en appel direct.

### Pièges fréquents

- **`integrator=demo` n'est pas une authentification.** C'est un paramètre de tracking du mode
  iframe (`/iframe?integrator=...`). Le mettre sur un appel API direct ne débloque rien : le
  `403` vient du header `Origin`.
- **`GET` ≠ `POST`.** Les lectures (`GET /evaluation/:id`, `GET /evaluation/metadata`,
  `GET /stats`, `GET /api/attributaire/sites`) sont ouvertes ; seuls les deux `POST` passent
  par le guard.
- **Appel serveur à serveur** (script, notebook, batch) : aucun `Origin` n'est envoyé par
  défaut, d'où `403 Origin required`. Le client pose le header lui-même, avec le domaine
  déclaré.
- **Égalité stricte** sur `scheme + host + port` : `https://exemple.fr` et
  `https://www.exemple.fr` sont deux déclarations distinctes, aucun sous-domaine n'est couvert.
  Les écarts bénins (slash final, casse, port par défaut) sont normalisés
  ([ADR-0043](./adr/0043-normalisation-origines-whitelistees.md)).
- **En local**, le guard est désactivé (`NODE_ENV=development`) : un test local ne prouve
  rien sur le registre.
- **Staging et production ont chacun leur table** : un domaine déclaré sur l'un ne vaut pas
  sur l'autre.

### Limites à annoncer

| Limite | Valeur | Où |
|--------|--------|-----|
| Parcelles par site | **60** (`identifiants[]`) | `MAX_PARCELLES_PAR_SITE_API` (shared-types) |
| Débit | **100 requêtes/minute par IP** | `ThrottlerGuard` (`app.module.ts`) |
| Taille du corps JSON | **2 Mo** (`413` au-delà) | `useBodyParser` (`main.ts`) |
| Cache d'enrichissement | 24 h par site | rejouer un site identique ne recoûte rien |

La limite de 60 parcelles (portée de 20 à 60 en septembre 2026 pour les friches de Setec) est
une **règle de validation**, avec un plafond de stockage : `evaluations.site_id` (varchar 1000)
range les identifiants joints par virgules, soit **66 parcelles au plus**. Aller au-delà impose
une migration de cette colonne. La carte de l'UI garde sa propre limite (20 parcelles, 10 ha).

`CadastreEnrichissementService.enrichirMulti()` interroge l'API Carto et la BDNB **par lots de
10 appels simultanés** (`mapParLots`) : un site de 60 parcelles coûte 6 salves, sans saturer ces
services pour les autres utilisateurs. Le reste de l'enrichissement travaille sur un site virtuel
agrégé et ne dépend pas du nombre de parcelles.

Sur un grand site, zonages et risques restent lus sur la **parcelle prédominante** (la plus
grande) : l'indice est calculable, mais plus approximatif si le site chevauche plusieurs zones.

Découper un site de 55 parcelles en plusieurs appels **n'est pas équivalent** : la surface
agrégée et la parcelle prédominante (qui porte zonages et risques) changent, donc les indices
de mutabilité aussi.

### Révoquer

```bash
scalingo --app mutafriches --region osc-secnum-fr1 run "pnpm integrateurs:revoquer <id>"
```

L'identifiant vient de `pnpm integrateurs:lister`. La ligne passe en `revoque`, l'origine est
refusée en une minute au plus, et une nouvelle déclaration du même domaine ne la réactive pas
(`pnpm integrateurs:reactiver <id>` le fait). La révocation est au grain de l'origine, **tous
canaux confondus** : révoquer la ligne `api` d'un domaine bloque aussi sa ligne `qgis`, et le
domaine ne peut plus être déclaré sur aucun canal. Deux intégrateurs qui partagent un domaine
ne peuvent pas être révoqués séparément.

### Liens

- Registre : `apps/api/src/integrateurs/` (table `integrateurs`)
- Guard : `apps/api/src/shared/guards/integrateur-origin.guard.ts`
- Détection de l'origine : `apps/api/src/shared/services/origine-detection.service.ts`
- ADR : [ADR-0055](./adr/0055-registre-integrateurs-declaration-par-domaine.md),
  [ADR-0011](./adr/0011-securisation-origin-guard-sans-api-key.md)
- Guide intégrateur : [docs/integration/README.md](./integration/README.md)
- Page partenaire (autre besoin) : [docs/ajout-partenaire.md](./ajout-partenaire.md)
