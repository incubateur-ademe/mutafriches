# ADR-0021 : Proxy backend pour la comparaison avec l'API Cartofriches

**Date** : 2026-06-25
**Statut** : Accepté

## Contexte

On observe des écarts entre les résultats de Mutafriches et ceux de Cartofriches (Cerema) et on
veut les instruire. Cartofriches expose ses données via l'**API Données foncières du Cerema**
(`https://apidf-preprod.cerema.fr`, section « Cartofriches (accès libre) », sans authentification).

Investigation menée sur l'API et l'application :

- L'application `cartofriches.cerema.fr` est une **appli Shiny (R)** : sa modale est rendue côté
  serveur et poussée par WebSocket — **aucun endpoint REST** ne sert le texte de la modale, on ne
  peut pas le récupérer de façon stable.
- L'endpoint libre `GET /cartofriches/friches/{site_id}/?fields=all` (et `?code_insee=`) renvoie
  **davantage de champs que le schéma OpenAPI public** : les indices de mutabilité par usage
  (`p_residentiel`, `p_industriel`, …) et plusieurs champs sources non documentés
  (`distance_ite_bon`, `distance_ite_mauvais`, `site_zaer`, `zonage_enviro`, `monuhisto`).
- Les indices `p_*` sont **quasi toujours `null`** en accès libre (déploiement « beta ») : le score
  Cartofriches n'est pas récupérable de façon fiable. La matière exploitable est donc les
  **données sources** (surface, bâti, zonage, ITE fret, ZAER, environnement).
- L'API ne permet pas la recherche par parcelle : il faut récupérer les friches d'une commune
  (`code_insee`) puis matcher sur la référence cadastrale `unite_fonciere_refcad`.
- Certains champs sont sérialisés de façon non standard : `unite_fonciere_refcad` est une liste
  Python en string (`"['49353000AC0628']"`), `proprio_type`/`proprio_nom` arrivent parfois éclatés
  caractère par caractère (bug d'array Postgres).

Deux approches pour faire consommer cette API par la page de comparaison de l'UI.

## Décision

**Relayer l'API Cartofriches via un module proxy backend NestJS** (`apps/api/src/cartofriches/`)
plutôt que de l'appeler directement depuis le navigateur :

1. Un **adapter** (`CartofrichesAdapter`) appelle l'API Cerema avec `fields=all` systématiquement,
   suit la pagination, et retourne un `ApiResponse<FrichesCerema[]>` (pattern adapter, cf. ADR-0004).
2. Un **service** (`CartofrichesService`) récupère les friches de la commune (cache mémoire court
   par `code_insee`), parse `unite_fonciere_refcad`, nettoie les champs éclatés, et matche par
   référence cadastrale → `CartofrichesRechercheResult`.
3. Un **endpoint** `GET /api/cartofriches/recherche?identifiant=…&codeInsee=…` expose le résultat.
4. Le type `FrichesCerema` vit dans `shared-types` pour être partagé backend ↔ UI.

L'UI appelle ce endpoint interne (proxifié par Vite en dev via `/api`), jamais directement le Cerema.

## Conséquences

**Positives**

- **Pas de problème CORS** en dev comme en prod : l'appel sortant est fait côté serveur.
- **Matching et nettoyage centralisés et testés** (refcad sérialisé, champs éclatés) côté backend,
  pas dans le navigateur.
- **Cohérence** avec le pattern adapter existant ; le timeout, la pagination et le cache sont gérés
  au même endroit.
- **`fields=all` documenté ici** comme dépendance assumée à un comportement non garanti par le
  schéma OpenAPI.

**Négatives / points d'attention**

- **Dépendance à une API preprod** (`apidf-preprod`) potentiellement lente/instable : timeout 15 s,
  cache mémoire 10 min, message d'erreur propre côté UI. URL surchargeable via `CARTOFRICHES_API_URL`.
- **Champs non documentés** : `fields=all` et les champs `p_*`/`distance_ite_*` peuvent changer sans
  préavis côté Cerema. À surveiller.
- **Score Cartofriches indisponible** : la comparaison porte sur les données sources, pas sur un
  score vs score.

## Alternatives écartées

- **Appel direct depuis l'UI** (+ proxy Vite en dev) : plus rapide à coder mais expose au CORS en
  prod et disperse la logique de matching/nettoyage dans le navigateur.
- **Piloter l'app Shiny** pour lire la modale : fragile (WebSocket, rendu serveur), casserait à la
  moindre mise à jour de Cartofriches.
- **Import du dataset data.gouv `sites-references-dans-cartofriches`** (CSV/GPKG) : snapshot statique,
  lourd, non temps réel ; l'API libre couvre le besoin de comparaison ponctuelle.
