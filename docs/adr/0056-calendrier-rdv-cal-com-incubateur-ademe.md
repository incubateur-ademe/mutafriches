# ADR-0056 : Calendrier de rendez-vous servi par l'instance Cal.com de l'incubateur ADEME

**Date** : 2026-11-25
**Statut** : Accepté (remplace l'ADR-0031, amende l'ADR-0020)

## Contexte

La modale « Échangez avec l'équipe Mutafriches » (page résultats, `/utiliser-mutafriches`, documentation de l'API) embarquait un calendrier ZCal (ADR-0020), dont le cycle de vie avait dû être repris à la main (ADR-0031).

L'équipe prend désormais ses rendez-vous sur l'instance Cal.com de l'incubateur ADEME : `https://rdv.incubateur.ademe.fr/celia.vermicelli/45min`. L'ancien lien ZCal ne doit plus être proposé.

Ce n'est pas un simple changement d'URL. Le script `static.zcal.co/embed/v1/embed.js` ne sait pas dimensionner une page Cal.com, et les contournements de l'ADR-0031 (iframe `loading="lazy"`, garde `window.zcal`, préfixe `/emb`) sont propres à ZCal.

## Décision

> Nous embarquons le calendrier avec le script d'embed « inline » servi par l'instance elle-même (`<origine>/embed/embed.js`), piloté par `CalendrierRdvEmbed`.

- Une seule valeur de configuration : l'URL de réservation (`VITE_CALENDRIER_RDV_URL`, défaut dans `calendrier-rdv.config.ts`). L'origine, l'adresse du script, le chemin du calendrier et les paramètres transmis à l'embed en sont dérivés (`construireParametresEmbed`).
- Le composant installe la file `window.Cal.q` que le script exige à son chargement, charge le script une seule fois, puis envoie `init` et `inline` sur un conteneur vide que React ne remplit pas.
- Les événements `linkReady` et `linkFailed` du script pilotent l'alerte de repli, affichée aussi si rien n'est prêt au bout de 6 secondes. Le lien « Ouvrir le calendrier dans un nouvel onglet » reste présent en toute circonstance.
- Le thème est forcé en clair, comme l'UI, et le titre de l'iframe est posé en français (le script écrit « Book a call »).

## Options envisagées

### Option A — Script d'embed de l'instance Cal.com (retenue)

- Avantages : hauteur ajustée par le script à chaque étape de la réservation ; plus aucun script chargé depuis `zcal.co` ; le script et le calendrier viennent du même hôte, opéré par l'ADEME ; pas de `loading="lazy"`, donc plus de contournement Firefox.
- Inconvénients : dépend du contrat du script (file `window.Cal.q`, instructions `init`, `inline`, `on`), qui suit la version de Cal.com déployée par l'incubateur.

### Option B — Changer seulement l'URL et garder le script ZCal

- Avantages : une ligne modifiée.
- Inconvénients : un script tiers sans rapport avec le calendrier affiché ; pas d'ajustement de hauteur (les messages de Cal.com ne sont pas ceux qu'attend ZCal) ; page complète affichée, pas sa variante d'embed.

### Option C — Iframe simple vers l'URL de réservation

- Avantages : aucun script tiers.
- Inconvénients : hauteur fixe, donc contenu tronqué ou double barre de défilement dans la modale (défaut déjà corrigé une fois, PR #144) ; la route `/embed` de Cal.com reste masquée tant que le script parent ne lui a pas répondu.

### Option D — Paquet `@calcom/embed-react`

- Avantages : composant React prêt à l'emploi.
- Inconvénients : une dépendance de plus à auditer pour une trentaine de lignes, et son script par défaut vient de `app.cal.com`, pas de notre instance.

## Conséquences

### Positives

- Le rendez-vous se prend sur un service de l'ADEME, sans tiers commercial.
- Le composant perd son `MutationObserver` et son iframe de secours.
- La garantie de l'ADR-0020 est inchangée : Mutafriches ne collecte ni ne stocke aucune donnée nominative, la réservation se fait dans l'iframe.

### Négatives / Risques

- Une montée de version de Cal.com sur l'instance peut changer le contrat du script : le repli (alerte et lien direct) couvre ce cas.
- `frame-ancestors` n'est pas concerné (c'est nous qui embarquons), mais une future CSP devra autoriser `rdv.incubateur.ademe.fr` en `script-src` et `frame-src` (cf. `docs/SUJETS-A-TRAITER.md`).
- L'URL par défaut porte le calendrier d'une personne : à remplacer par un calendrier d'équipe si l'instance en propose un.

### Migration

- `VITE_ZCAL_URL` n'est plus lue : la retirer des environnements où elle est définie. Pour surcharger le calendrier, définir `VITE_CALENDRIER_RDV_URL` (variable de build Vite).
- `ZcalEmbed` et `zcal.config.ts` sont renommés ; `ContactMultisitesModal` garde son interface.

## Liens

- ADR-0020 : prise de rendez-vous multisites par calendrier embarqué
- ADR-0031 : cycle de vie de l'embed ZCal (remplacé)
- Fichiers : `apps/ui/src/shared/components/common/CalendrierRdvEmbed.tsx`, `apps/ui/src/shared/config/calendrier-rdv.config.ts`, `apps/ui/src/features/resultats/components/ContactMultisitesModal.tsx`
- Documentation : [Cal.com — embed](https://cal.com/docs/core-features/embed)
