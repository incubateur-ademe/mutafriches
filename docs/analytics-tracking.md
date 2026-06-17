# Tracking & analytics

> Comment Mutafriches mesure l'usage (événements, sessions, utilisateurs) et comment interpréter les statistiques côté Metabase.

## Modèle de données

Les événements utilisateur sont stockés dans la table `evenements_utilisateur` (schéma : `apps/api/src/shared/database/schemas/evenements.schema.ts`). Champs utiles pour l'analyse :

| Colonne | Rôle |
|---------|------|
| `type_evenement` | Étape du parcours (`resultats_mutabilite` = simulation aboutie, etc.) |
| `session_id` | Identifiant d'une **visite** (voir ci-dessous) |
| `visitor_id` | Identifiant d'un **utilisateur** anonyme persistant (voir ci-dessous) |
| `evaluation_id` | Lien vers l'évaluation calculée (permet de dédoublonner les simulations) |
| `mode_utilisation` | `standalone` ou `iframe` |
| `integrateur` | Provenance (`benefriches`, hostname, ...) |

Les évaluations persistées (`evaluations`) portent aussi `source_utilisation`, `integrateur`, `utilisateur_id` (réutilisé pour le `visitor_id`) et `fiabilite`.

## Session vs utilisateur : la distinction clé

C'est la nuance qui change l'interprétation de toutes les stats de récurrence.

| | **Session** | **Utilisateur (visiteur)** |
|---|---|---|
| Représente | Une visite / période d'activité continue | Une personne, à travers le temps |
| Durée de vie | Éphémère : régénérée à chaque chargement de l'app (un F5 = nouvelle session) | Persistante : survit aux rechargements et aux visites |
| Stockage | En mémoire, non persisté | `localStorage` du navigateur |
| Source dans le code | `generateSessionId()` → `session-${Date.now()}-${random}` | `getOrCreateVisitorId()` → UUID persisté sous la clé `mutafriches_visitor_id` |

Conséquence : mesurer la récurrence **par session** sous-estime le nombre de personnes réellement récurrentes — une même personne qui revient compte comme plusieurs sessions.

### Comment garantir « le même utilisateur » ?

Il faut un identifiant **stocké côté client qui survit aux rechargements et aux visites**. Par ordre de robustesse :

1. **`localStorage` (approche retenue)** — un UUID anonyme généré une fois, relu à chaque visite. Standard pour de l'analytics anonyme sans compte. Le mot-clé qui sépare des deux notions : *persistant* (vs la session, en mémoire).
2. **Cookie persistant** — équivalent mais renvoyé au serveur à chaque requête ; plus exposé au RGPD.
3. **Authentification (login)** — seul moyen *certain* (ID lié à un compte, pas à un navigateur), mais hors périmètre d'un outil public sans compte.

### Limites — un « même utilisateur » reste une approximation

Sans login, l'égalité « 1 identifiant = 1 personne » casse dans ces cas :

- **Multi-appareils** (mobile + bureau) → 2 identifiants.
- **Multi-navigateurs** (Chrome / Firefox ne partagent pas le `localStorage`).
- **Navigation privée** → identifiant éphémère ou bloqué (repli en mémoire).
- **Vidage du cache / suppression des données du site** → nouvel identifiant.
- **Iframe (Bénéfriches)** : `localStorage` par-origine — OK car servie depuis le domaine Mutafriches, mais certains navigateurs restreignent le storage tiers en cross-site.

En résumé : `visitor_id` transforme « par visite » en « par navigateur » — bien meilleur que la session, mais toujours une sous-estimation par rapport à « par personne ». Seul un compte authentifié supprime cette marge d'erreur.

## État de la mesure

- **Provisoire (avant déploiement du `visitor_id`)** : la récurrence est mesurée par `session_id` (une visite). Les chiffres sont une **borne basse indicative**.
- **Cible (après déploiement)** : récurrence mesurée par `visitor_id` (un navigateur), décompte des simulations via `COUNT(DISTINCT evaluation_id)`.

Détails de la décision et du périmètre technique : voir [ADR-0018](./adr/0018-identifiant-visiteur-anonyme-persistant.md).

## Requêtes Metabase de référence

### Part des utilisateurs récurrents par provenance — version provisoire (par session)

```sql
WITH simulations AS (
  SELECT
    session_id,
    COUNT(*) AS nb_simulations,
    MAX(CASE WHEN integrateur ILIKE '%benefriches%' THEN 1 ELSE 0 END) AS est_benefriches,
    MAX(CASE WHEN mode_utilisation = 'iframe' THEN 1 ELSE 0 END)       AS est_iframe
  FROM evenements_utilisateur
  WHERE type_evenement = 'resultats_mutabilite'
    AND session_id IS NOT NULL
  GROUP BY session_id
),
recurrents AS (
  SELECT session_id, nb_simulations,
    CASE
      WHEN est_benefriches = 1 THEN 'Bénéfriches'
      WHEN est_iframe = 1      THEN 'Autre intégrateur (iframe)'
      ELSE                          'Standalone'
    END AS provenance
  FROM simulations
  WHERE nb_simulations >= 3
)
SELECT provenance,
       COUNT(*) AS nb_utilisateurs_recurrents,
       ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS pct_utilisateurs,
       SUM(nb_simulations) AS total_simulations
FROM recurrents
GROUP BY provenance
ORDER BY nb_utilisateurs_recurrents DESC;
```

### Version cible (par visiteur, après déploiement)

Remplacer `session_id` par `visitor_id` et `COUNT(*)` par `COUNT(DISTINCT evaluation_id)`.

> Note Metabase/PostgreSQL : ne pas nommer un CTE `analyse` (`ANALYSE` est un mot réservé). Préférer `jsonb_exists(...)` à l'opérateur `?` (interprété comme un placeholder JDBC).
