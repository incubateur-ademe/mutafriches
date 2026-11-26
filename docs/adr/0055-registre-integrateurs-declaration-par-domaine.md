# ADR-0055 : Registre des intégrateurs en base, déclaration libre par domaine, contact dans Brevo

**Date** : 2026-11-20
**Statut** : Accepté (amende l'ADR-0011, l'ADR-0020 et l'ADR-0051)

## Contexte

Quatre canaux permettent d'utiliser Mutafriches hors du site : l'API, l'extension QGIS, l'iframe
et les pages personnalisées. Aucun ne permettait de répondre à trois questions de pilotage : qui
veut utiliser le service, qui l'utilise réellement, et par quel canal.

- **API** : l'accès s'ouvrait à la main, en ajoutant une origine à la variable Scalingo
  `ALLOWED_INTEGRATOR_ORIGINS` (ADR-0011). La demande passait par un rendez-vous ZCal ou un
  e-mail, sans trace en base ; la fiche de l'intégrateur vivait dans Notion.
- **Extension QGIS** : toutes les installations partageaient l'origine
  `https://qgis.mutafriches.beta.gouv.fr`. Rien ne distinguait une structure d'une autre. La
  comparaison par sous-chaîne d'`OrigineDetectionService` classait de surcroît cette origine en
  `SITE_STANDALONE` : les appels de l'extension étaient comptés comme des visites du site.
- **Iframe et page personnalisée** : une demande n'existait que dans une boîte mail ou un
  calendrier.
- **Metabase** : chaque intégrateur était reconnu par un `CASE` écrit en dur dans les cartes ; un
  nouveau venu tombait dans « Autre ».

L'application ne stocke aucune donnée personnelle depuis l'ADR-0020, et l'incident Metabase
d'août 2026 a montré que tout ce qui est lisible en base de production peut fuiter par cet outil.

## Décision

> Nous tenons en base un registre des intégrateurs (table `integrateurs`), alimenté par un
> formulaire de déclaration ouvert. Le domaine déclaré sert d'identifiant ; le prénom, le nom et
> l'adresse e-mail du déclarant partent dans Brevo et ne sont jamais écrits en base.

1. **Une table, quatre canaux** (`api`, `qgis`, `page`, `iframe`) : structure, type de structure,
   origine normalisée, statut (`en_attente`, `actif`, `revoque`) et `cle_stats`, la valeur écrite
   dans la colonne `integrateur` des tables d'usage (hôte, `qgis:<hôte>`, `partenaire:<slug>`,
   identifiant iframe). « Qui veut » se lit dans la table, « qui utilise » par jointure.
2. **API et QGIS actifs dès la déclaration**. `POST /api/integrateurs/declarations` est une route
   ouverte, limitée à 5 appels par heure et par IP. `IntegrateurOriginGuard` et CORS lisent
   `IntegrateursRegistreService` : cache d'une minute, et pour le guard seulement, recherche en
   base d'une origine inconnue (une requête à la fois par origine, court cache des refus). CORS
   ne lit que le cache : son middleware passe avant la limite de débit, et l'en-tête `Origin`
   est libre.
3. **Révocation au grain de l'origine, tous canaux confondus** : une ligne `revoque` bloque son
   origine même si une autre ligne (API ou QGIS) est active, et une nouvelle déclaration de ce
   domaine est refusée sur tous les canaux. Sans cela, redéclarer le domaine sur l'autre canal
   lèverait la révocation.
4. **Page et iframe en attente**. Elles demandent une mise en place par l'équipe (seed du
   partenaire, entrée de `INTEGRATEURS_IFRAME` déployée), puis `pnpm integrateurs:publier`.
   Le registre iframe du code reste la liste d'autorisation technique.
5. **Extension QGIS identifiée par le domaine de la structure**, envoyé dans `Origin`, et par
   l'en-tête `X-Mutafriches-Client: qgis/<version>`, qui préfixe l'intégrateur de `qgis:`.
6. **Prénom, nom et e-mail obligatoires, chez Brevo uniquement** (attributs `PRENOM` et `NOM`) :
   un appel à `POST /v3/contacts`, une liste par environnement et un attribut booléen par canal (`USAGE_API`, `USAGE_QGIS`, `USAGE_PAGE`,
   `USAGE_IFRAME`), pour qu'un même contact cumule ses usages. La ligne porte
   `contact_enregistre` : faux si Brevo n'a pas reçu le contact.
   *Amendé en novembre 2026* : l'adresse obligatoire ne sert qu'au suivi de l'accès. Être
   sollicité (retours d'expérience, évolutions du service) demande un consentement séparé,
   case décochée par défaut, porté par le champ optionnel `accepteContact` et l'attribut
   `ACCEPTE_CONTACT`, transmis seulement quand il est donné. L'attribut `TYPE_ACCES` nomme en
   clair le dernier accès demandé.
7. **Reprise de l'existant** par `integrateurs:synchroniser`, lancé au `postdeploy` : origines de
   la variable, registre iframe et pages partenaires. Deux origines d'un même hôte (http et
   https, deux ports) sont toutes reprises, une seule portant la clé de statistiques ; le script
   échoue si une origine de la variable manque en base.

## Options envisagées

### Option A — Registre déclaratif par domaine, contact dans Brevo (retenue)

- Avantages : aucune donnée personnelle en base ni dans Metabase ; un seul identifiant, le
  domaine, déjà celui des statistiques ; ouverture d'accès sans intervention ni redéploiement ;
  Brevo fournit l'outil d'envoi que l'application n'a plus.
- Inconvénients : le guard devient un registre, plus une barrière ; dépendance à un
  sous-traitant ; le lien entre une ligne et son contact ne se fait que dans un sens.

### Option B — Clé d'API par client (piste de l'ADR-0011)

- Avantages : identifie une installation plutôt qu'une structure ; révocation fine.
- Inconvénients : une clé dans un front ou dans les réglages d'un plugin n'est pas un secret ;
  génération, stockage et réémission à écrire ; deux mécanismes d'identification à maintenir.

### Option C — E-mail en base, dans une table à part

- Avantages : pas de tiers ; lien direct entre une ligne et son contact.
- Inconvénients : donnée personnelle en base de production, purge à écrire, droits Postgres à
  restreindre pour Metabase, et un export reste nécessaire pour écrire aux déclarants.

### Option D — Statu quo (variable d'environnement, fiches Notion)

- Avantages : rien à écrire.
- Inconvénients : aucune réponse aux trois questions de pilotage ; une intervention par accès.

## Conséquences

### Positives

- Les trois questions de pilotage ont une réponse en SQL, sans donnée personnelle.
- Un intégrateur API ou QGIS est autonome : il déclare son domaine et appelle dans la minute.
- Les cartes Metabase peuvent joindre `integrateurs.cle_stats` au lieu d'un `CASE` en dur.
- Les appels de l'extension QGIS cessent d'être comptés comme des visites du site : l'hôte
  standalone se compare désormais par égalité stricte.

### Négatives / Risques

- **Le contrôle d'origine n'est plus une autorisation.** N'importe qui peut déclarer un domaine
  et appeler. Les protections réelles sont la limite de 100 requêtes par minute et par IP, les
  caches et la révocation (`pnpm integrateurs:revoquer`, effective en une minute au plus). Le
  risque concret est le quota BDNB (ADR-0052), pas les données, qui sont publiques.
- **`frame-ancestors` ne contient plus les origines des intégrateurs API** : un domaine déclaré
  librement ne doit pas suffire à embarquer l'UI. Seuls `INTEGRATEURS_IFRAME`, nos origines et
  `ALLOWED_ORIGINS` y figurent. Un intégrateur API qui embarquait le site sans figurer au
  registre iframe ne le pourrait plus.
- **Donnée personnelle chez un sous-traitant** : Brevo conserve les adresses. La politique de
  confidentialité le mentionne ; la durée de conservation se règle dans Brevo.
- **Adresse non vérifiée** et **structure déclarative** : rien n'empêche une fausse saisie.
- **Panne de Brevo** : la déclaration est acceptée, le déclarant n'est pas joignable
  (`contact_enregistre = false`), et rien ne permet de réessayer puisque l'adresse n'est pas
  conservée.
- Une même adresse déclarée pour deux domaines voit ses attributs `STRUCTURE` et `DOMAINE`
  écrasés dans Brevo ; ses attributs d'usage, eux, se cumulent. Aucun attribut n'est remis à
  faux : un usage révoqué ou abandonné reste coché dans Brevo.
- Les statistiques de l'origine QGIS partagée basculent de `SITE_STANDALONE` à `API_DIRECTE` à
  partir du déploiement : rupture de série à connaître dans Metabase.

### Migration

1. Migration `0042_integrateurs` (création de table).
2. `integrateurs:synchroniser` au `postdeploy`, avant le démarrage de la nouvelle version : une
   erreur, ou une origine de la variable absente de la table, fait échouer le déploiement plutôt
   que de démarrer avec un registre incomplet.
3. Vérifier sur chaque environnement que toutes les origines de `ALLOWED_INTEGRATOR_ORIGINS`
   figurent dans la table, puis retirer la variable. Elle n'est plus lue que par la reprise.
4. Renommer à la main les structures reprises avec leur hôte pour nom.

## Liens

- Schéma : `apps/api/src/shared/database/schemas/integrateurs.schema.ts`
- Module : `apps/api/src/integrateurs/`
- Guard : `apps/api/src/shared/guards/integrateur-origin.guard.ts`
- Scripts : `apps/api/src/scripts/synchroniser-integrateurs.ts`, `gerer-integrateurs.ts`
- Formulaire : `apps/ui/src/features/integrer/components/FormulaireDeclaration.tsx`
- Types partagés : `packages/shared-types/src/integration/declaration-integrateur.ts`
- ADR liés : [0011](./0011-securisation-origin-guard-sans-api-key.md),
  [0020](./0020-contact-multisites-calendrier-zcal.md),
  [0043](./0043-normalisation-origines-whitelistees.md),
  [0051](./0051-durcissement-http-helmet-cors-bypass-dev-explicite.md)
- Procédure : [docs/acces-api-integrateur.md](../acces-api-integrateur.md)
