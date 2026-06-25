# ADR-0017 : Abstraction du transport email (Brevo API + MailHog) via provider

**Date** : 2026-06-03
**Statut** : Remplacé par ADR-0020 (suppression de la brique e-mail avec le passage du contact multisites au calendrier ZCal). Conservé comme référence d'implémentation en cas de réintroduction d'un envoi d'e-mails.

## Contexte

L'ADR-0015 avait retenu un **transport SMTP unique** (`nodemailer`) : MailHog en local, **relais SMTP Brevo** en production. À l'usage, on souhaite :

- utiliser l'**API HTTP transactionnelle Brevo** en staging/production (suivi de délivrabilité, `messageId`, pas de gestion SMTP côté infra) ;
- garder MailHog en local sans dépendre d'identifiants Brevo ;
- des garde-fous de staging (ne jamais spammer de vrais usagers depuis un environnement de test) ;
- une brique testable sans toucher aux vraies API.

## Décision

> Nous introduisons une abstraction `EmailProvider` avec deux implémentations — `SmtpProvider` (MailHog) et `BrevoProvider` (`@getbrevo/brevo`, `sendTransacEmail`) — sélectionnées par un **factory provider** NestJS. Un `MailService` injectable orchestre validation, fallback texte et redirection staging.

- **Bascule** : MailHog si environnement local **OU** si `BREVO_API_KEY` absente ; sinon Brevo. (`createEmailProvider` dans `mail.module.ts`.)
- **`MailService`** : valide les destinataires (`isValidEmail`), génère un **fallback texte** via `html-to-text`, applique la **redirection staging**, et renvoie toujours `{ success, messageId?, error? }` sans jamais throw.
- **Redirection staging** : si `EMAIL_DEV_INBOX` est défini, tous les destinataires sont réécrits vers cette boîte et le sujet préfixé `[STAGING → destinataire]`. Variable **interdite en production** et **restreinte** aux domaines `beta.gouv.fr` / `incubateur.ademe.dev`, vérifié au démarrage (`assertEmailDevInboxSafety` dans `env.validation.ts`).
- **`BrevoProvider`** : retry exponentiel (3 tentatives) sur les erreurs transitoires (5xx / timeout).
- **Templates** : fonctions TS + kit HTML inline (`templates/kit.ts` : `layout`, `heading`, `paragraph`, `button`, `alert`). Pas de React/MJML côté backend.
- Configuration via **`AppConfig`** (ADR-0016), groupe `mail` : aucune lecture `process.env` directe dans les providers.

## Options envisagées

### Option A — Abstraction provider + API Brevo en prod (retenue)

- Avantages : `messageId` et délivrabilité Brevo ; MailHog local sans clé ; providers mockables (tests sans réseau) ; garde-fous centralisés dans `MailService`.
- Inconvénients : dépendance `@getbrevo/brevo` ; deux transports à maintenir.

### Option B — Conserver le relais SMTP Brevo unique (ADR-0015)

- Avantages : un seul code path, aucune dépendance SDK.
- Inconvénients : pas de `messageId` API ni de suivi fin ; configuration SMTP côté infra ; pas d'abstraction testable.

### Option C — Templates `@react-email/render`

- Avantages : composants React cohérents avec le front.
- Inconvénients : tire React + react-email dans l'API NestJS ; surcoût de build/SSR non justifié.

## Conséquences

### Positives

- Staging/prod sur l'API Brevo avec retry et `messageId` ; local inchangé (MailHog).
- Garde-fou anti-spam en staging, vérifié au démarrage (fail-fast).
- `MailService` et providers testés (bascule, redirection, fallback) sans appel réseau réel.

### Négatives / Risques

- Nouvelle dépendance `@getbrevo/brevo` (+ `html-to-text`).
- La délivrabilité dépend de la configuration Brevo (domaine expéditeur, SPF/DKIM) — hors code.

### Migration

- `MailerService` (SMTP unique) remplacé par `MailService` + providers ; `ContactService` rebranché.
- Nouvelles variables : `BREVO_API_KEY`, `EMAIL_DEV_INBOX`, `EMAIL_REPLY_TO`, `APP_BASE_URL` (cf. `.env.example`).
- En production : définir `BREVO_API_KEY` (et **ne pas** définir `EMAIL_DEV_INBOX`). En staging : `BREVO_API_KEY` + `EMAIL_DEV_INBOX` (boîte beta.gouv.fr).

## Liens

- Brique email : `apps/api/src/mailer/` (`mail.service.ts`, `mail.module.ts`, `providers/`, `templates/`)
- Configuration : `apps/api/src/config/` (ADR-0016)
- ADR précédent : `docs/adr/0015-envoi-emails-smtp-mailhog-brevo.md`
