# ADR-0043 : Normalisation des origines whitelistées au parsing

**Date** : 2026-09-17
**Statut** : Accepté

## Contexte

Les deux guards d'origine (`IntegrateurOriginGuard` pour `/enrichissement` et `/evaluation/calculer`, `OriginGuard` pour `/evenements`) comparent le header `Origin` de la requête aux origines whitelistées par **égalité stricte**. Cette égalité stricte est elle-même un correctif : un `startsWith` laissait auparavant passer les sous-domaines suffixes usurpés du type `https://benefriches.ademe.fr.attacker.com`.

Les whitelists sont alimentées par deux variables d'environnement (`ALLOWED_INTEGRATOR_ORIGINS`, `ALLOWED_ORIGINS`), saisies à la main dans la configuration Scalingo. Or un header `Origin` ne porte **jamais** de slash final, alors qu'une URL copiée depuis la barre d'adresse d'un navigateur en porte un presque toujours. Une entrée saisie avec un slash final est donc **morte** : elle ne matche aucune requête.

Cas constaté en préproduction le 2026-09-17 : `ALLOWED_INTEGRATOR_ORIGINS` contenait `https://vmap-ofriches.data.arnia-bfc.fr/`, et le partenaire recevait un 403 sur chaque appel, sans explication ni piste de diagnostic. Le mode de panne est d'autant plus discret côté `/evenements` : `EvenementsService.enregistrerEvenement()` avale l'erreur, le parcours utilisateur continue normalement et l'événement disparaît sans trace, ni en base ni en console.

La même saisie manuelle expose aux mêmes écarts sur la casse (`HTTPS://Partenaire.FR`), les espaces autour des virgules, ou un chemin résiduel (`https://partenaire.fr/app`).

## Décision

> Nous normalisons chaque origine whitelistée **au parsing**, dans le constructeur des guards, et nous laissons la comparaison en égalité stricte inchangée.

La normalisation est mutualisée dans `apps/api/src/shared/utils/origine.utils.ts` :

- `trim` puis retrait du ou des slashs finaux ;
- passage par `new URL(...).origin`, qui ramène le schéma et l'hôte en casse basse, retire le port par défaut et écarte un chemin résiduel ;
- repli sur la chaîne nettoyée si la valeur n'est pas parsable — la comparaison stricte tranchera ;
- rejet des origines opaques (`file:`, `data:`), dont `.origin` vaut la chaîne `"null"` : les retenir autoriserait toutes les requêtes portant `Origin: null`, émises par les iframes sandboxées ;
- entrées vides écartées, et journalisation de chaque entrée réécrite au démarrage.

## Options envisagées

### Option A — Normaliser les origines configurées au parsing (retenue)

- Avantages :
  - La comparaison reste une égalité stricte sur scheme + host + port : la protection contre les sous-domaines suffixes usurpés est intacte, et ses tests de régression restent verts sans modification
  - Coût nul à l'exécution : la normalisation a lieu une fois, à la construction du guard
  - Le log des entrées réécrites donne à l'exploitation la liste réellement chargée, là où le symptôme initial était un rejet silencieux
  - Corrige une classe entière d'écarts de saisie (slash, casse, espaces), pas seulement le cas constaté
- Inconvénients :
  - Une entrée avec un chemin (`https://partenaire.fr/app`) devient active sur tout l'hôte au lieu de rester morte. Un header `Origin` ne portant jamais de chemin, aucune restriction par chemin n'était possible de toute façon — mais l'intention de qui a saisi cette valeur n'est pas respectée. Le log la rend visible
  - La liste chargée diffère de la variable d'environnement brute : lire la valeur Scalingo ne suffit plus pour savoir ce que le guard applique (d'où le log)

### Option B — Assouplir la comparaison (tolérer le slash des deux côtés)

- Avantages :
  - Correctif d'une ligne, sans nouveau fichier
- Inconvénients :
  - Toucher à la comparaison est précisément ce qui avait introduit la faille du `startsWith` : chaque assouplissement y rouvre une surface d'attaque
  - Coût à chaque requête au lieu d'une fois au démarrage
  - Ne traite ni la casse, ni les espaces, ni les chemins résiduels : le prochain écart de saisie produira le même 403 muet

### Option C — Valider la variable d'environnement au démarrage (fail-fast)

- Avantages :
  - Cohérent avec `AppConfig` et sa validation au démarrage (ADR-0016)
  - Force une configuration propre côté exploitation
- Inconvénients :
  - Un slash final est une saisie légitime en intention : refuser de démarrer l'application pour cela transforme une gêne en indisponibilité totale
  - Ne dispense pas de normaliser : il faudrait de toute façon décider quoi faire de la casse et des chemins
  - Retenue en complément possible, pas en remplacement

## Conséquences

### Positives

- Une origine saisie avec un slash final, des espaces ou une casse mixte fonctionne, sur les deux guards
- La règle est écrite une fois et testée unitairement (`origine.utils.spec.ts`), plutôt que dupliquée dans chaque guard avec ses cas limites
- Les tests de régression sur les suffixes usurpés sont dupliqués sur les entrées normalisées, dans les deux guards : la normalisation ne peut pas dériver vers un assouplissement sans casser un test
- Le démarrage expose la whitelist effective dans les logs

### Négatives / Risques

- Une entrée configurée avec un chemin autorise désormais tout l'hôte (voir Option A)
- La normalisation ne s'applique qu'aux origines **configurées**, pas au header entrant : un `Origin` en casse haute ne matcherait pas. Le risque est théorique, la spécification URL imposant aux navigateurs de sérialiser schéma et hôte en casse basse
- La sémantique propre à chaque variable est conservée et reste asymétrique : `ALLOWED_INTEGRATOR_ORIGINS` **s'ajoute** aux valeurs par défaut, `ALLOWED_ORIGINS` les **remplace**. La mutualisation ne corrige pas ce piège de lecture, elle le documente

### Migration

Aucune migration de données. Le correctif ne prend effet qu'au redéploiement, la whitelist étant figée à la construction du guard.

Le nettoyage de `ALLOWED_INTEGRATOR_ORIGINS` côté Scalingo (retrait du slash final) n'est plus nécessaire au fonctionnement, mais reste souhaitable pour l'hygiène de la variable. C'est une action d'exploitation, distincte de ce correctif.

## Liens

- Utilitaire : `apps/api/src/shared/utils/origine.utils.ts`
- Guards : `apps/api/src/shared/guards/integrateur-origin.guard.ts`, `apps/api/src/evenements/guards/origin.guard.ts`
- Stratégie de sécurisation par whitelist d'origines : ADR-0011
- Configuration centralisée et validation au démarrage : ADR-0016
- Contexte sécurité : `.claude/context/security-rules.md`
