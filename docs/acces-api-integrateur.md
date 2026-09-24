# Ouvrir un accès API à un intégrateur — procédure

Procédure d'exploitation pour autoriser un tiers à appeler directement l'API REST
(`POST /enrichissement`, `POST /evaluation/calculer`), depuis son site web **ou** depuis un
traitement serveur à serveur.

Le document a deux parties :

1. **[Modèle à dupliquer](#1-modèle-à-dupliquer-dans-notion)** : la fiche, la checklist, les
   deux mails et les commandes. À copier dans Notion pour chaque nouvel intégrateur ; la
   fiche remplie (contacts, échanges) reste dans Notion, jamais dans ce dépôt public.
2. **[Référence](#2-référence)** : le fonctionnement, les pièges, les limites, la révocation.

Côté intégrateur, le mode d'emploi est dans le
[guide d'intégration](./integration/README.md#intégration-api-directe-partenaires).

> À ne pas confondre avec [Ajouter un partenaire](./ajout-partenaire.md), qui publie une page
> `/partenaires/<slug>` dans notre UI. Les deux sont indépendants : un intégrateur API n'a pas
> besoin de page partenaire, et inversement.

---

## 1. Modèle à dupliquer dans Notion

Remplacer `{{ORIGINE}}` (ex. `https://exemple.fr`) et `{{HOTE}}` (ex. `exemple.fr`) partout.

### Fiche

| Champ | Valeur |
|-------|--------|
| Organisation | |
| Contact technique (nom, e-mail) | |
| Contact métier | |
| Usage prévu | (ex. pré-diagnostic d'un inventaire, intégration dans un outil métier) |
| Contexte d'appel | navigateur / serveur à serveur |
| Origine autorisée `{{ORIGINE}}` | |
| Identifiant en base (`integrateur`) | `{{HOTE}}` (déduit de l'origine) |
| Volumétrie prévue | sites / mois, pic éventuel |
| Parcelles max par site | (≤ 20 ?) |
| Ouvert en staging le | |
| Ouvert en production le | |
| Bucket Metabase ajouté | oui / non |

### Checklist

**Qualification**

- [ ] Mail n°1 envoyé, réponses reportées dans la fiche.
- [ ] Origine exacte validée avec le demandeur (schéma + hôte, sans chemin ; `www.` ou non).
- [ ] Contexte d'appel connu : en serveur à serveur, le demandeur sait qu'il doit poser
      `Origin` lui-même.
- [ ] Volumétrie compatible avec les [limites](#limites-à-annoncer) (100 req/min par IP,
      20 parcelles par site). Sinon, en discuter avant d'ouvrir.

**Staging** (`mutafriches-preprod`)

- [ ] Relire la valeur existante (`env-set` **remplace**, il n'ajoute pas) :
  ```bash
  scalingo --app mutafriches-preprod --region osc-fr1 env | grep ALLOWED_INTEGRATOR_ORIGINS
  ```
- [ ] Ajouter l'origine à la suite de la valeur existante :
  ```bash
  scalingo --app mutafriches-preprod --region osc-fr1 env-set ALLOWED_INTEGRATOR_ORIGINS="<valeur existante>,{{ORIGINE}}"
  ```
- [ ] Attendre la fin du redéploiement ; si l'origine a été réécrite, les logs de démarrage
      le signalent (`Origine autorisée normalisée : ...`).
- [ ] Jouer les [tests de vérification](#tests-de-vérification) avec
      `BASE=https://mutafriches.incubateur.ademe.dev`.

**Production** (`mutafriches`)

- [ ] Mêmes étapes avec `--app mutafriches --region osc-secnum-fr1` (autre région que la
      preprod) et `BASE=https://mutafriches.beta.gouv.fr`.
- [ ] Mail n°2 envoyé.

**Suivi**

- [ ] Premiers appels visibles en base ([requête de suivi](#requête-de-suivi)).
- [ ] Ajouter une ligne `WHEN integrateur ILIKE '%{{HOTE}}%' THEN '<Organisation>'` au bloc
      `CASE` de [analytics-tracking.md](./analytics-tracking.md#pilotage-par-canal-qualifications--évaluations-par-mois)
      et dans les questions Metabase qui le reprennent.
- [ ] Relance à J+7 : l'intégration fonctionne-t-elle, des questions ?
- [ ] Point à J+30 : volumétrie réelle, retours sur les indices.
- [ ] Contact ajouté à la liste des intégrateurs à prévenir en cas de changement
      d'algorithme ou de contrat d'API.

### Mail n°1 — qualification

> **Objet :** Accès à l'API Mutafriches — quelques informations pour ouvrir votre accès
>
> Bonjour,
>
> Merci pour votre intérêt pour Mutafriches. L'API est ouverte aux acteurs publics et à
> leurs partenaires, sans clé d'accès : nous autorisons l'origine de vos requêtes (le header
> HTTP `Origin`). Pour préparer l'ouverture, pourriez-vous nous indiquer :
>
> 1. **L'origine à autoriser**, schéma compris, par exemple `https://exemple.fr`. La
>    comparaison est stricte : `https://www.exemple.fr` est une autre origine, et les
>    sous-domaines ne sont pas couverts. Si vous appelez l'API depuis un script ou un
>    serveur, vous n'avez pas besoin d'un site publié : l'origine sert d'identifiant
>    conventionnel de votre organisation, que vous poserez vous-même en header.
> 2. **Le contexte d'appel** : depuis une page web (navigateur) ou depuis un serveur, un
>    script ou un notebook.
> 3. **L'usage prévu** et la **volumétrie** estimée (nombre de sites par mois, pics
>    éventuels).
> 4. **Le nombre maximal de parcelles** par site que vous pensez analyser (la limite actuelle
>    est de 20).
> 5. **Un contact technique** à prévenir en cas d'évolution de l'API ou de l'algorithme.
>
> En attendant, la documentation de l'API est consultable ici :
>
> - Swagger : https://mutafriches.beta.gouv.fr/api
> - Guide d'intégration : https://mutafriches.beta.gouv.fr/documentation-integration
>
> Bien cordialement,

### Mail n°2 — ouverture de l'accès

> **Objet :** Votre accès à l'API Mutafriches est ouvert
>
> Bonjour,
>
> Votre accès à l'API Mutafriches est ouvert pour l'origine **`{{ORIGINE}}`**, en
> pré-production (`https://mutafriches.incubateur.ademe.dev`) comme en production
> (`https://mutafriches.beta.gouv.fr`). Nous vous recommandons de faire vos essais en
> pré-production.
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
> # 1. Enrichir un site (1 à 20 parcelles)
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
> **Limites.** 20 parcelles par site, 100 requêtes par minute et par adresse IP. Un site
> identique rejoué dans les 24 heures est servi depuis le cache. Ne découpez pas un grand
> site en plusieurs appels : chaque appel devient un site distinct, avec des indices
> différents. Écrivez-nous plutôt, la limite peut être revue.
>
> **Documentation.** Swagger : https://mutafriches.beta.gouv.fr/api — guide :
> https://mutafriches.beta.gouv.fr/documentation-integration
>
> Nous vous préviendrons de toute évolution de l'algorithme ou de l'API. N'hésitez pas à
> revenir vers nous pour toute question ou retour sur les résultats.
>
> Bien cordialement,

### Tests de vérification

À jouer après chaque ouverture, sur l'environnement concerné. Le parcours nominal est celui
du mail n°2, avec `ORIGINE={{ORIGINE}}` : attendre `201`, `201`, puis `200`.

Non-régression : on vérifie qu'on n'a pas ouvert plus que prévu.

```bash
# 403 Origin required : sans header Origin
curl -sS -o /dev/null -w "%{http_code}\n" -X POST "$BASE/enrichissement" \
  -H "Content-Type: application/json" -d '{"identifiant":"49020000AK0118"}'

# 403 Origin not allowed : origine voisine (www. ou sans www., selon celle ouverte)
curl -sS -o /dev/null -w "%{http_code}\n" -X POST "$BASE/enrichissement" \
  -H "Content-Type: application/json" -H "Origin: https://www.{{HOTE}}" \
  -d '{"identifiant":"49020000AK0118"}'
```

- [ ] Parcours nominal : `201` / `201` / `200`, sept usages classés.
- [ ] Sans `Origin` : `403`.
- [ ] Origine voisine : `403`.

### Requête de suivi

En lecture sur la base de l'environnement (cf. [ops/scalingo.md](./ops/scalingo.md)) :

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

Il n'y a **pas de clé d'API** : l'autorisation repose sur une whitelist d'origines
(`IntegrateurOriginGuard`, cf. [ADR-0011](./adr/0011-securisation-origin-guard-sans-api-key.md)).
Ouvrir un accès revient à ajouter une origine à la variable d'environnement
`ALLOWED_INTEGRATOR_ORIGINS`. Aucun code à modifier, aucun secret à transmettre.

`ALLOWED_INTEGRATOR_ORIGINS` **s'ajoute** aux origines par défaut codées dans le guard
(Mutafriches, Bénéfriches).

### Identification dans les statistiques

L'intégrateur est identifié par **l'hôte de son `Origin`**, enregistré dans la colonne
`integrateur` (`benefriches.ademe.fr`, par exemple), avec `source_utilisation = API_DIRECTE`.
Il n'y a pas de slug à lui attribuer : le paramètre `?integrateur=` n'est lu qu'en mode
iframe (`iframe=true`) et ignoré en appel direct. L'hôte a l'avantage de ne pas pouvoir être
choisi librement, puisque seules les origines whitelistées passent le guard.

### Pièges fréquents

- **`integrator=demo` n'est pas une authentification.** C'est un paramètre de tracking du mode
  iframe (`/iframe?integrator=...`). Le mettre sur un appel API direct ne débloque rien : le
  `403` vient du header `Origin`.
- **`GET` ≠ `POST`.** Les lectures (`GET /evaluation/:id`, `GET /evaluation/metadata`,
  `GET /stats`) sont ouvertes ; seuls les deux `POST` passent par le guard.
- **Appel serveur à serveur** (script, notebook, batch) : aucun `Origin` n'est envoyé par
  défaut, d'où `403 Origin required`. Le client pose le header lui-même ; c'est la limite
  assumée de l'ADR-0011.
- **Égalité stricte** sur `scheme + host + port` : `https://exemple.fr` et
  `https://www.exemple.fr` sont deux entrées distinctes, aucun sous-domaine n'est couvert.
  Les écarts bénins (slash final, casse, port par défaut) sont normalisés au démarrage
  ([ADR-0043](./adr/0043-normalisation-origines-whitelistees.md)).
- **En local**, le guard est désactivé (`NODE_ENV=development`) : un test local ne prouve
  rien sur la whitelist.

### Limites à annoncer

| Limite | Valeur | Où |
|--------|--------|-----|
| Parcelles par site | **20** (`identifiants[]`) | `enrichir-site.dto.ts` (`ArrayMaxSize`) |
| Débit | **100 requêtes/minute par IP** | `ThrottlerGuard` (`app.module.ts`) |
| Cache d'enrichissement | 24 h par site | rejouer un site identique ne recoûte rien |

La limite de 20 parcelles est une **règle de validation**, pas une contrainte de stockage : la
relever est un changement d'une ligne. Ce qu'il faut mesurer avant de le faire, c'est le
cadastre : `CadastreEnrichissementService.enrichirMulti()` lance un `Promise.allSettled` **sans
borne de concurrence** sur toutes les parcelles, soit autant d'appels simultanés à l'API Carto,
et renvoie autant de géométries dans la réponse. Le reste de l'enrichissement travaille sur un
site virtuel agrégé et ne dépend pas du nombre de parcelles.

Découper un site de 55 parcelles en trois appels de 20 **n'est pas équivalent** : la surface
agrégée et la parcelle prédominante (qui porte zonages et risques) changent, donc les indices
de mutabilité aussi.

### Révoquer

Retirer l'origine de `ALLOWED_INTEGRATOR_ORIGINS` sur l'environnement concerné (relire la
valeur avant `env-set`). La révocation est au grain de l'origine : deux intégrateurs qui
partagent un domaine ne peuvent pas être révoqués séparément (limite connue de l'ADR-0011).

### Liens

- Guard : `apps/api/src/shared/guards/integrateur-origin.guard.ts`
- Détection de l'origine : `apps/api/src/shared/services/origine-detection.service.ts`
- ADR socle : [ADR-0011](./adr/0011-securisation-origin-guard-sans-api-key.md)
- Guide intégrateur : [docs/integration/README.md](./integration/README.md)
- Page partenaire (autre besoin) : [docs/ajout-partenaire.md](./ajout-partenaire.md)
