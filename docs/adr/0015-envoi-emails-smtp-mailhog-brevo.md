# ADR-0015 : Envoi d'emails transactionnels via SMTP (MailHog en local, Brevo en production)

**Date** : 2026-06-02
**Statut** : Remplacé par ADR-0020 (suppression de la brique e-mail avec le passage du contact multisites au calendrier ZCal). Conservé comme référence d'implémentation en cas de réintroduction d'un envoi d'e-mails.

## Contexte

La fonctionnalité de demande de contact multisites (modale « Être contacté » sur la page de résultats) nécessite, à chaque demande, l'envoi de deux emails :

- un email de **confirmation** à l'utilisateur ;
- un email de **notification** à l'équipe.

Jusqu'ici, le projet n'avait aucune brique d'envoi d'email. Il faut donc en introduire une, tout en restant aligné sur les contraintes du projet : configuration par variables d'environnement (`process.env`, pas de `ConfigService`), pas de secret en dur, dégradation gracieuse (le tracking d'évènement ne doit jamais échouer à cause d'un email), et testabilité locale sans dépendre d'un service tiers.

Brevo (ex-Sendinblue) a été retenu comme fournisseur. Brevo expose deux interfaces : une API HTTP transactionnelle (clé API + templates dashboard) et un **relais SMTP**.

## Décision

> Nous envoyons les emails via un transport **SMTP unique** (bibliothèque `nodemailer`), configuré par variables d'environnement : **MailHog** en local pour capturer les mails, **relais SMTP Brevo** en production.

Les templates HTML sont **versionnés dans le repo** (`apps/api/src/mailer/templates/`) plutôt que gérés dans le dashboard Brevo, pour rester testables et sous revue de code.

## Options envisagées

### Option A — Transport SMTP unique via nodemailer (retenue)

- Avantages : **même code path** en local et en production (seules les variables d'env changent) ; capture locale des emails avec MailHog (UI web, aucun envoi réel) ; aucun couplage au SDK Brevo ; changement de fournisseur SMTP trivial ; templates versionnés et testables.
- Inconvénients : ajout de la dépendance `nodemailer` ; pas d'accès aux fonctionnalités avancées de l'API Brevo (statistiques de délivrabilité fines, templates no-code dashboard).

### Option B — API HTTP transactionnelle Brevo

- Avantages : statistiques de délivrabilité, gestion des templates dans le dashboard, pas de gestion SMTP.
- Inconvénients : **impossible de tester avec MailHog** (qui ne capte que le SMTP) ; deux chemins distincts (mock/API en local vs API en prod) ; couplage à l'API et au format Brevo ; templates hors repo donc hors revue de code.

### Option C — SMTP direct sans bibliothèque

- Avantages : aucune dépendance ajoutée.
- Inconvénients : réimplémentation fragile du protocole (encodage, MIME, TLS, auth) ; non justifié alors que `nodemailer` est le standard de fait.

## Conséquences

### Positives

- Test local de bout en bout via MailHog (`pnpm mail:start`, UI sur http://localhost:8026).
- `MailerService` à dégradation gracieuse : si `SMTP_HOST` est absent, l'envoi est ignoré (log d'avertissement) sans jamais lever d'exception.
- Migration ultérieure vers un autre fournisseur SMTP sans changement de code.

### Négatives / Risques

- Dépendance supplémentaire (`nodemailer`).
- La délivrabilité dépend de la bonne configuration du relais Brevo en production (domaine expéditeur, SPF/DKIM) — hors code.
- Adresses expéditrice et de notification à finaliser via les variables d'environnement.

### Migration (si applicable)

- Nouvelles variables d'environnement (cf. `apps/api/.env.example`) : `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_SENDER_EMAIL`, `MAIL_SENDER_NAME`, `CONTACT_NOTIFICATION_EMAIL`.
- En production : `SMTP_HOST=smtp-relay.brevo.com`, `SMTP_PORT=587`, `SMTP_USER`=login Brevo, `SMTP_PASS`=clé SMTP Brevo.
- En local : MailHog ajouté au `docker-compose.yml` (ports hôte 1026/8026).

## Liens

- Module mailer : `apps/api/src/mailer/`
- Module contact : `apps/api/src/contact/`
- Conteneur MailHog : `apps/api/docker-compose.yml`
- Documentation : modale de contact multisites (page de résultats `apps/ui/src/features/resultats/`)
