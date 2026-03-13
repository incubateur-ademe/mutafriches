# ADR-0008 : Intégration iframe + PostMessage

**Date** : 2025-06-01
**Statut** : Accepté

## Contexte

Des applications partenaires (Benefriches, collectivités) doivent intégrer Mutafriches dans leur propre interface. Il faut un mécanisme d'intégration qui isole les contextes de sécurité tout en permettant la communication bidirectionnelle.

## Décision

Nous utilisons une **intégration iframe** avec communication via l'API **PostMessage** du navigateur. Un guard côté API vérifie l'origine des requêtes.

## Options envisagées

### Option A — iframe + PostMessage (retenue)

- Avantages : isolation complète du contexte de sécurité, pas de dépendance côté intégrateur (juste un `<iframe>`), communication bidirectionnelle (résultats renvoyés au parent), compatible tous frameworks
- Inconvénients : contraintes de taille iframe, pas de personnalisation profonde du style

### Option B — API REST pure (sans UI)

- Avantages : flexibilité totale pour l'intégrateur, pas de contrainte d'affichage
- Inconvénients : l'intégrateur doit reconstruire toute l'UI (formulaire, carte, résultats), maintenance dupliquée, risque d'expérience utilisateur dégradée

### Option C — Web Components

- Avantages : encapsulation native, personnalisable
- Inconvénients : complexité de packaging, support navigateur variable, maintenance lourde

## Conséquences

### Positives

- Benefriches intègre Mutafriches en 3 lignes de HTML
- Les résultats d'analyse sont renvoyés au parent via `mutafriches:completed`
- La sécurité est assurée par `IntegrateurOriginGuard` + vérification d'origine PostMessage

### Négatives / Risques

- L'intégrateur ne peut pas personnaliser le style au-delà des paramètres URL
- Les origines autorisées doivent être maintenues dans la variable d'environnement `ALLOWED_INTEGRATOR_ORIGINS`

## Liens

- Communication iframe : `apps/ui/src/shared/iframe/iframeCommunication.ts`
- Guard : `apps/api/src/shared/guards/integrateur-origin.guard.ts`
- Documentation intégration : `docs/integration/`
- Exemple React : `docs/integration/react/`
