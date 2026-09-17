# Ouvrir un accès API à un intégrateur — procédure

Procédure d'exploitation pour autoriser un tiers à appeler directement l'API REST
(`POST /enrichissement`, `POST /evaluation/calculer`), depuis son site web **ou** depuis un
traitement serveur à serveur.

Côté intégrateur, le mode d'emploi est dans le
[guide d'intégration](./integration/README.md#intégration-api-directe-partenaires). Ce
document décrit ce que **nous** avons à faire.

> À ne pas confondre avec [Ajouter un partenaire](./ajout-partenaire.md), qui publie une page
> `/partenaires/<slug>` dans notre UI. Les deux sont indépendants : un intégrateur API n'a pas
> besoin de page partenaire, et inversement.

## Ce qu'est un « accès API » chez nous

Il n'y a **pas de clé d'API** : l'autorisation repose sur une whitelist d'origines
(`IntegrateurOriginGuard`, cf. [ADR-0011](./adr/0011-securisation-origin-guard-sans-api-key.md)).
Concrètement, ouvrir un accès = ajouter une origine à la variable d'environnement
`ALLOWED_INTEGRATOR_ORIGINS`. Aucun code à modifier, aucun secret à transmettre.

Deux confusions fréquentes chez le demandeur :

- **`integrator=demo` n'est pas une authentification.** C'est un paramètre de tracking du mode
  iframe (`/iframe?integrator=...`). Le mettre sur un appel API direct ne débloque rien : le
  `403` vient du header `Origin`, pas de cette valeur.
- **`GET` ≠ `POST`.** Les lectures (`GET /evaluation/:id`, `GET /evaluation/metadata`,
  `GET /stats`) sont ouvertes ; seuls les deux `POST` passent par le guard.

## 1. Qualifier la demande

- [ ] Identifier le **domaine** du demandeur et le **contexte d'appel** :
  - appel depuis un **navigateur** (SPA, page web) → le navigateur pose `Origin` tout seul ;
  - appel **serveur à serveur** (script, notebook, poste de travail, batch) → aucun `Origin`
    n'est envoyé par défaut, donc `403 Origin required`. Le client devra **poser le header
    lui-même** ; c'est la limite assumée de l'ADR-0011, et le point à expliciter dans la
    réponse.
- [ ] Choisir la **valeur exacte d'origine** à whitelister, en accord avec le demandeur.
      Le guard fait une **égalité stricte** sur `scheme + host + port` : `https://exemple.fr` et
      `https://www.exemple.fr` sont deux entrées distinctes, et aucun sous-domaine n'est couvert
      implicitement.
- [ ] Choisir un **slug de tracking** (`integrateur=<slug>`, minuscules sans espace) pour
      distinguer ses appels dans les statistiques.
- [ ] Vérifier que les **limites** ci-dessous conviennent à son volume (nombre de parcelles par
      site notamment).

## 2. Staging d'abord

`ALLOWED_INTEGRATOR_ORIGINS` est une liste d'origines séparées par des virgules, qui **s'ajoute**
aux origines par défaut (Mutafriches, Bénéfriches) codées dans le guard. Toujours relire la
valeur existante avant d'écrire : `env-set` remplace, il n'ajoute pas.

```bash
scalingo --app mutafriches-preprod env | grep ALLOWED_INTEGRATOR_ORIGINS
scalingo --app mutafriches-preprod env-set ALLOWED_INTEGRATOR_ORIGINS="<valeur existante>,https://exemple.fr"
```

La modification redémarre l'application : attendre la fin du redéploiement avant de tester.

## 3. Vérifier

Depuis n'importe quelle machine, sur l'environnement concerné :

```bash
curl -i -X POST "https://mutafriches.incubateur.ademe.dev/enrichissement?integrateur=<slug>" \
  -H "Content-Type: application/json" \
  -H "Origin: https://exemple.fr" \
  -d '{"identifiant":"49020000AK0118"}'
```

- [ ] `201` avec l'origine autorisée.
- [ ] `403 Origin not allowed` sans le header `Origin` ou avec une origine voisine non listée
      (`https://www.exemple.fr` si seul `https://exemple.fr` a été ouvert) — c'est la
      non-régression : on vérifie qu'on n'a pas élargi plus que prévu.
- [ ] Les appels remontent bien avec le bon `integrateur` dans la table `enrichissements`.

## 4. Production

Rejouer les étapes 2 et 3 sur l'application de production, avec l'URL
`https://mutafriches.beta.gouv.fr`.

## 5. Répondre au demandeur

Lui transmettre :

- l'origine ouverte, à **poser en header sur chaque `POST`** si ses appels sont serveur à
  serveur ;
- son slug `integrateur=<slug>` à passer en query param ;
- le lien Swagger (`/api`) et la section « Intégration API directe » du guide d'intégration ;
- les limites ci-dessous.

## Limites à annoncer

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

## Révoquer

Retirer l'origine de `ALLOWED_INTEGRATOR_ORIGINS` sur l'environnement concerné. La révocation
est au grain de l'origine : deux intégrateurs qui partagent un domaine ne peuvent pas être
révoqués séparément (limite connue de l'ADR-0011).

## Liens

- Guard : `apps/api/src/shared/guards/integrateur-origin.guard.ts`
- ADR socle : [ADR-0011](./adr/0011-securisation-origin-guard-sans-api-key.md)
- Guide intégrateur : [docs/integration/README.md](./integration/README.md)
- Page partenaire (autre besoin) : [docs/ajout-partenaire.md](./ajout-partenaire.md)
