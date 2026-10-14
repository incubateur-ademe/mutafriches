# ADR-0051 : Durcissement HTTP — en-têtes `helmet`, CORS restreint, bypass de développement explicite

**Date** : 2026-10-14
**Statut** : Accepté

## Contexte

Une revue de sécurité globale de l'application (octobre 2026) a relevé trois écarts dans
`apps/api/src/main.ts` et `shared/utils/environment.utils.ts`, tous liés à la configuration HTTP
plutôt qu'au code métier :

- `app.enableCors()` sans option reflétait `Access-Control-Allow-Origin: *` en production. Les
  guards d'origine protègent les `POST` sensibles, mais tout site pouvait lire les `GET` (évaluations
  par identifiant, métadonnées, statistiques) depuis un navigateur. Le `TODO` datait du premier
  déploiement et figurait dans `docs/SUJETS-A-TRAITER.md`.
- Aucun en-tête de sécurité n'était posé : pas de `Strict-Transport-Security`, pas de
  `X-Content-Type-Options`, pas de `Referrer-Policy`.
- `isDevelopment()` valait `true` quand `NODE_ENV` était **absent**. Trois bypass en dépendent :
  `IntegrateurOriginGuard`, le CORS local et `ApiRefreshTokenGuard` (qui laisse passer sans jeton).
  Un conteneur démarré sans la variable (image reconstruite, `scalingo run` mal configuré) tournait
  donc **sans aucune protection**, sans le signaler.

Trois constantes d'origines étaient par ailleurs dupliquées (deux guards, deux contrôleurs), avec le
risque classique d'en corriger une sur quatre.

## Décision

> Les en-têtes de sécurité viennent de `helmet`, CORS ne reflète que les origines connues, et tout
> bypass de sécurité exige `NODE_ENV=development` explicite.

- **`helmet`** est posé en premier middleware avec CSP, `frameguard`, COEP et COOP **désactivés**, et
  CORP à `cross-origin`. L'UI est embarquée en iframe par les intégrateurs (Bénéfriches) et charge des
  tiers (DSFR, tuiles IGN, Metabase, ZCal) : une CSP ou un `X-Frame-Options` posés à l'aveugle
  casseraient l'intégration. Le reste (HSTS, `nosniff`, `Referrer-Policy`, suppression de
  `X-Powered-By`) s'applique.
- **CORS** passe par `construireOriginesCors()` (`shared/utils/origines-autorisees.ts`) : nos deux
  domaines, les dashboards ADEME, `ALLOWED_ORIGINS` et `ALLOWED_INTEGRATOR_ORIGINS`, normalisés
  (ADR-0043). En `development`, toute origine locale est acceptée (port Vite glissant). Une requête
  sans `Origin` passe sans en-tête. Les constantes d'origines n'existent plus qu'à cet endroit.
- **`isDevelopment()`** ne vaut `true` que pour `NODE_ENV=development`. `start:dev` et `start:debug`
  posent la variable via `cross-env`. Un `NODE_ENV` absent applique les réglages de production et
  émet un avertissement au démarrage (`isEnvironnementNonDeclare()`).

## Options envisagées

### Option A — `helmet` sans CSP, CORS sur liste blanche, bypass explicite (retenue)

- Avantages : aucun accès retiré (toute origine hors liste était déjà refusée par les guards) ;
  dépendance standard de l'écosystème Express/Nest ; fail-closed sur l'environnement.
- Inconvénients : la CSP reste à écrire (sujet tracé) ; un développeur qui lance `nest start` à la
  main sans `NODE_ENV` voit les guards actifs, d'où l'avertissement.

### Option B — Conserver `enableCors()` ouvert et poser les en-têtes à la main

- Avantages : aucune dépendance nouvelle.
- Inconvénients : réécrit ce que `helmet` maintient (valeurs, dépréciations) ; laisse `*` en place,
  alors que la liste des intégrateurs navigateur existe déjà dans `ALLOWED_INTEGRATOR_ORIGINS`.

### Option C — Activer aussi CSP et `frame-ancestors` dès maintenant

- Avantages : couverture complète en une PR.
- Inconvénients : impossible sans relever les origines chargées en production ; risque de casser la
  carte, Metabase ou l'iframe Bénéfriches sans test. Reporté avec un préalable
  (`docs/SUJETS-A-TRAITER.md`).

## Conséquences

### Positives

- Plus de `Access-Control-Allow-Origin: *` ; les en-têtes de base sont présents sur toutes les
  réponses, UI comprise.
- Un conteneur sans `NODE_ENV` est protégé et le dit dans ses logs.
- Une seule source pour les origines autorisées, testée (`origines-autorisees.spec.ts`).

### Négatives / Risques

- Un intégrateur navigateur absent de `ALLOWED_INTEGRATOR_ORIGINS` perd la lecture des `GET` qu'il
  obtenait grâce à `*`. Aucun cas connu : les intégrateurs déclarés y figurent déjà pour les `POST`.
- HSTS (`max-age` d'un an par défaut) engage le domaine sur HTTPS : déjà le cas sur Scalingo.
- Lancer l'API sans `pnpm dev:api` exige de poser `NODE_ENV=development` soi-même.

### Migration

Aucune donnée ni variable à migrer. Vérifier après déploiement : `curl -I https://mutafriches.beta.gouv.fr/health`
doit montrer `Strict-Transport-Security` et `X-Content-Type-Options`, et une requête avec
`Origin: https://exemple.fr` ne doit renvoyer aucun `Access-Control-Allow-Origin`.

## Liens

- Code : `apps/api/src/main.ts`, `apps/api/src/shared/utils/origines-autorisees.ts`,
  `apps/api/src/shared/utils/environment.utils.ts`
- ADR liés : ADR-0011 (guards d'origine), ADR-0043 (normalisation des origines)
- Suivi : `docs/SUJETS-A-TRAITER.md` (CSP, `ValidationPipe` whitelist, certificat PostgreSQL)
- Documentation : `.claude/context/security-rules.md`, `docs/security/vulnerabilites-acceptees.md`
