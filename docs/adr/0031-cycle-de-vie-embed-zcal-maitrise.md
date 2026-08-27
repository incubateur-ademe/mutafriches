# ADR-0031 : Cycle de vie de l'embed ZCal maîtrisé côté application

**Date** : 2026-08-27
**Statut** : Accepté

## Contexte

Le calendrier de prise de rendez-vous multisites (ADR-0020) est intégré via le script d'embed officiel `https://static.zcal.co/embed/v1/embed.js`, qui transforme une ancre `.zcal-inline-widget` en iframe auto-dimensionnée (PR #144, corrigeait la troncature d'un iframe statique).

Le calendrier ne s'affichait pas sous Firefox alors qu'il fonctionnait sous Chrome. L'analyse du script et une reproduction en Firefox headless (profils neufs, ETP strict, blocage des cookies tiers, navigation privée) ont écarté toute incompatibilité navigateur, tout blocage par liste de traqueurs (`zcal.co` est absent d'EasyPrivacy et de la liste Disconnect) et tout en-tête bloquant (ni `X-Frame-Options`, ni `frame-ancestors`, et l'application n'expose aucune CSP). Trois défauts propres à notre intégration ressortent :

1. Le script crée son iframe avec `loading="lazy"`. Dans le conteneur scrollable de la modale DSFR (`.fr-modal__body`, `overflow-y: auto; max-height: 80vh`), Firefox ne déclenche jamais la navigation : l'iframe reste indéfiniment au `min-height` de 544 px du placeholder, sans erreur ni requête réseau. Chromium dispose d'un correctif dédié au lazy loading dans les scrollers imbriqués, pas Gecko ; la distance de préchargement est laissée à l'implémentation par le standard HTML. Reproduit à l'identique : bloqué à `h=544` sous Firefox, débloqué à `h=1112` en repassant l'iframe en `eager`.
2. Le script est gardé par `window.zcal = window.zcal || (...)` : il ne scanne le DOM **qu'une seule fois par chargement de page**. La stratégie de réinjection du script à chaque ouverture de la modale était donc inopérante (le commentaire du composant affirmait l'inverse).
3. Le script remplace l'ancre par `replaceChild`, alors que cette ancre était rendue par React : le DOM réel et le DOM virtuel divergeaient, avec un risque d'erreur au démontage ou au changement de route.

## Décision

> Nous conservons le script d'embed officiel pour son auto-dimensionnement, mais l'application maîtrise son cycle de vie : chargement unique, forçage de `loading="eager"` sur l'iframe produite, repli si le script ne peut plus scanner le DOM, et conteneur isolé de React.

Concrètement, dans `apps/ui/src/shared/components/common/ZcalEmbed.tsx` :

- le script est chargé via une promesse singleton au niveau module et n'est plus retiré à la fermeture de la modale ;
- React ne possède qu'un conteneur vide ; l'ancre que le script remplace est créée impérativement à l'intérieur ;
- un `MutationObserver` repasse l'iframe en `loading = "eager"` dès son insertion, ce qui reprend la navigation suspendue ;
- si l'ancre est toujours intacte après exécution du script (garde `window.zcal` déjà armée lors d'un montage précédent), l'application construit elle-même l'iframe via `construireUrlIframeZcal()` ;
- un lien « Ouvrir le calendrier dans un nouvel onglet », placé hors du conteneur remplacé, reste disponible en toute circonstance, et une alerte s'affiche si rien n'a chargé au bout de 6 secondes.

## Options envisagées

### Option A — Conserver le script officiel et maîtriser son cycle de vie (retenue)

- Avantages : conserve l'auto-dimensionnement (le contenu ZCal mesure environ 850 px et varie selon l'étape du formulaire) ; corrige les trois défauts d'un coup ; repli explicite si le script est bloqué ou déjà consommé.
- Inconvénients : dépend de détails d'implémentation non documentés du script tiers (garde `window.zcal`, structure de l'ancre) ; à revérifier lors d'une montée de version de l'embed.

### Option B — Construire nous-mêmes l'iframe et supprimer le script tiers

- Avantages : intégration entièrement déterministe, un script tiers en moins.
- Inconvénients : perte de l'auto-dimensionnement, donc retour de la troncature corrigée en PR #144 — mesuré à 620 px, le contenu est coupé sans barre de défilement interne, et le scroll de la modale ne permet pas de faire défiler un contenu cross-origin tronqué. Une hauteur figée reste un pari sur la taille du contenu.

### Option C — Ne rien changer et documenter le contournement (scroller jusqu'au calendrier)

- Avantages : aucun coût de développement.
- Inconvénients : le calendrier reste invisible pour les utilisateurs Firefox dans le cas nominal ; le canal de contact multisites est le seul point d'entrée vers l'équipe sur la page résultats.

## Conséquences

### Positives

- Le calendrier s'affiche sous Firefox comme sous Chrome, y compris à la réouverture de la modale.
- Un lien direct vers le calendrier est toujours présent, ce qui couvre aussi les bloqueurs de contenu.
- Le DOM muté par le script tiers n'est plus un nœud possédé par React.

### Négatives / Risques

- Le repli reproduit la construction d'URL du script (préfixe `/emb` pour un chemin à un seul segment) : à revalider si ZCal change son schéma d'URL. Couvert par `zcal.config.spec.ts`.
- L'iframe de secours utilise une hauteur fixe (`hauteurSecoursPx`, 900 px) sans auto-dimensionnement : acceptable pour un chemin dégradé, insuffisant comme mode nominal.

### Migration

Aucune migration de données. Le composant `ZcalEmbed` conserve son interface (`active`), les appelants ne changent pas.

## Liens

- ADR-0020 : prise de rendez-vous multisites via ZCal
- PR : #144 (passage à l'embed JavaScript pour corriger la troncature)
- Fichiers : `apps/ui/src/shared/components/common/ZcalEmbed.tsx`, `apps/ui/src/shared/config/zcal.config.ts`, `apps/ui/src/features/resultats/components/ContactMultisitesModal.tsx`
- Documentation : [HTML Standard — lazy loading](https://html.spec.whatwg.org/dev/urls-and-fetching.html), [ZCal — embed](https://help.zcal.co/share/embed)
