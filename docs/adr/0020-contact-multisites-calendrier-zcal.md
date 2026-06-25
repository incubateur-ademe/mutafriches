# ADR-0020 : Prise de rendez-vous multisites via calendrier ZCal embarqué

**Date** : 2026-06-24
**Statut** : Accepté (remplace l'ADR-0015 et l'ADR-0017)

## Contexte

La page de résultats proposait, via la modale « Analyser plusieurs sites », un formulaire
de demande de contact (e-mail + besoin). Côté serveur, ce formulaire :

- **stockait l'e-mail** de l'usager dans une table dédiée `demandes_contact` (PostgreSQL) ;
- déclenchait **deux e-mails transactionnels** (confirmation usager + notification équipe)
  via la brique `apps/api/src/mailer/` (abstraction `EmailProvider`, transport Brevo/MailHog,
  cf. ADR-0015 et ADR-0017).

Cette mécanique présente plusieurs inconvénients :

- **Donnée nominative persistée** : un e-mail est une donnée à caractère personnel, qui impose
  une base légale, une durée de conservation et une gestion RGPD pour un volume de demandes faible.
- **Surface technique disproportionnée** : une brique d'envoi d'e-mails complète (providers,
  templates, garde-fous staging, dépendances `@getbrevo/brevo` / `nodemailer` / `html-to-text`,
  service MailHog) dont le **seul** consommateur était la demande de contact.
- **Friction** : l'usager devait remplir un formulaire puis attendre un recontact manuel.

L'équipe dispose par ailleurs d'un calendrier **ZCal** (`https://zcal.co/i/D0NODYSy`) permettant
la réservation directe d'un créneau d'échange.

## Décision

Remplacer le formulaire de contact par le **calendrier ZCal embarqué en iframe** dans la modale,
et **supprimer toute la chaîne de stockage et d'envoi d'e-mails** :

1. La modale « Analyser plusieurs sites » affiche désormais un `<iframe>` ZCal. L'usager réserve
   son créneau directement ; ZCal gère ses propres confirmations.
2. Suppression de la table `demandes_contact` et de son enum (migration `0026`) : **plus aucune
   coordonnée nominative n'est stockée**.
3. Suppression du module `contact/` et de la brique `mailer/` (devenue sans appelant), des
   variables d'environnement associées (`SMTP_*`, `BREVO_API_KEY`, `MAIL_*`, `EMAIL_*`,
   `CONTACT_*`, `APP_BASE_URL`), du service MailHog et des dépendances d'envoi.
4. **Conservation du tracking** `OUVERTURE_MODALE_MULTISITES` (clic sur le CTA) comme métrique
   d'engagement — sans aucune donnée nominative. L'événement `DEMANDE_CONTACT_MULTISITES`
   (soumission du formulaire) est retiré.
5. L'URL du calendrier est configurable via `VITE_ZCAL_URL` (défaut : calendrier de l'équipe),
   pour différencier les environnements sans rebuild.

## Conséquences

**Positives**

- **Zéro stockage de donnée nominative** côté Mutafriches : périmètre RGPD réduit.
- **Suppression d'une surface technique entière** (mailer + contact + MailHog + 5 dépendances).
- **Parcours usager simplifié** : réservation immédiate, plus d'attente de recontact.

**Négatives / points d'attention**

- **Dépendance à un service tiers** (ZCal) pour la prise de rendez-vous ; l'iframe nécessite que
  ZCal autorise l'embarquement (le cas pour les URLs `embed=1`).
- **Perte du suivi des demandes en base** : le suivi des rendez-vous se fait désormais dans ZCal,
  plus dans Metabase. Le dashboard « demandes de contact » devient obsolète.
- **Plus aucun envoi d'e-mail transactionnel** dans l'application : tout futur besoin d'e-mail
  devra réintroduire une brique d'envoi (les ADR-0015/0017 restent une référence d'implémentation).

## Alternatives écartées

- **Conserver le formulaire en anonymisant moins** : ne résout pas la charge RGPD ni la surface
  technique.
- **Garder la brique mailer dormante** : code mort non testé en conditions réelles, qui dériverait ;
  préférable de le retirer et de s'appuyer sur l'historique Git + les ADR-0015/0017 si réintroduction.
