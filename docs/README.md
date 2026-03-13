# Documentation Mutafriches

> API d'analyse de mutabilité des friches urbaines - Beta.gouv / ADEME

## Documentation disponible

### Pour les développeurs

- **[Module Enrichissement](./enrichissement.md)** - Collecte automatique des données via APIs externes
- **[Algorithme d'Évaluation](./evaluation-mutabilite.md)** - Calcul des indices de mutabilité

### Pour les intégrateurs

- **[Guide d'Intégration](./integration/README.md)** - Intégrer Mutafriches dans votre site web

## Vue d'ensemble du système

```
┌──────────────────────┐
│  Identifiant(s)      │
│  cadastral(s)        │
│  (1 à 20 parcelles)  │
└──────────┬───────────┘
           │
           ↓
┌──────────────────────┐
│  ENRICHISSEMENT      │ ←── 24 sources externes + 3 bases locales
│  10 domaines         │     (IGN, Enedis, GeoRisques, ZAER...)
└──────────┬───────────┘
           │
           ↓
┌──────────────────────┐
│  ÉVALUATION          │ ←── Matrice 24 critères × 7 usages
│  Mutabilité          │
└──────────┬───────────┘
           │
           ↓
     Indice 0-100%
     pour 7 usages
```

## Démarrage rapide

### Enrichir un site (mono-parcelle)

```bash
POST /enrichissement
{
  "identifiant": "25056000HZ0346"
}
```

### Enrichir un site (multi-parcelle, 1 à 20)

```bash
POST /enrichissement
{
  "identifiants": ["25056000HZ0346", "25056000HZ0347"]
}
```

**Réponse** : Site enrichi avec ~25 critères (surfaces, distances, risques, zonages, ZAER...)

### Évaluer la mutabilité

```bash
POST /evaluation/calculer
{
  "donneesEnrichies": { ... },
  "donneesComplementaires": { ... }
}
```

**Réponse** : Indices de mutabilité 0-100% pour 7 usages + fiabilité

## Architecture

### Monorepo

```
mutafriches/
├── apps/
│   ├── api/          # API NestJS (backend)
│   └── ui/           # React + Vite (frontend)
└── packages/
    └── shared-types/ # Types TypeScript partagés
```

### Stack technique

- **Backend** : NestJS (TypeScript)
- **Base de données** : PostgreSQL + PostGIS
- **ORM** : Drizzle ORM
- **UI** : React + Vite + DSFR
- **Package Manager** : pnpm (OBLIGATOIRE)
- **Tests** : Vitest

## Concepts clés

### Enrichissement

Le module d'enrichissement interroge **24 sources de données externes** et **3 bases locales PostGIS** pour pré-remplir automatiquement les critères d'un site (mono ou multi-parcelle) :

- **10 domaines** : Cadastre, Énergie, Transport, Urbanisme, Risques Naturels, Risques Technologiques, Pollution, Zonages, ENR/ZAER, GeoRisques brut
- **24 sources externes** : IGN, BDNB, Enedis, GeoRisques (×13), API Carto, ZAER WFS, data.gouv.fr...
- **3 bases locales** : Transport, BPE (commerces), Sites pollués ADEME
- **Multi-parcelle** : Support de 1 à 20 parcelles par site
- **Cache 24h** : Optimisation des performances

### Évaluation de mutabilité

L'algorithme calcule un **indice de mutabilité 0-100%** pour **7 usages** possibles d'une friche :

1. Résidentiel ou mixte
2. Équipements publics
3. Culturel, touristique
4. Tertiaire
5. Industriel, logistique
6. Renaturation
7. Photovoltaïque au sol

**Matrice** : 24 critères × 7 usages
**Fiabilité** : Indice 0-10 selon la complétude des données d'entrée (pondéré par poids des critères)

### Intégration

Mutafriches peut être intégré dans un site web via **iframe + postMessage** :

- Formulaire complet dans iframe
- Communication bidirectionnelle sécurisée
- Callback personnalisable
- Support HTML/React

## Liens utiles

- **Production** : https://mutafriches.beta.gouv.fr
- **Staging** : https://mutafriches.incubateur.ademe.dev
- **Documentation API (Swagger)** : https://mutafriches.beta.gouv.fr/api
- **Repository** : https://github.com/incubateur-ademe/mutafriches
- **Contact** : contact@mutafriches.beta.gouv.fr

## Développement

### Installation

```bash
# Cloner le projet
git clone https://github.com/incubateur-ademe/mutafriches.git
cd mutafriches

# Installer les dépendances (OBLIGATOIRE : pnpm)
pnpm install

# Démarrer en mode développement
pnpm run start:dev
```

### Commandes utiles

```bash
# Tests
pnpm run test              # Tests unitaires
pnpm run test:watch        # Tests en mode watch

# Qualité de code
pnpm run lint              # ESLint
pnpm run typecheck         # TypeScript

# Base de données
pnpm run db:generate       # Générer migrations Drizzle
pnpm run db:migrate        # Appliquer migrations
pnpm run db:studio         # Interface Drizzle Studio
```

## Règles de code

Voir [CLAUDE.md](../CLAUDE.md) pour les règles strictes :

- Typage TypeScript explicite obligatoire
- Pas d'emojis dans le code
- Accents français obligatoires
- Conventions de nommage NestJS

## Contribuer

1. Fork le projet
2. Créer une branche (`git checkout -b feature/ma-fonctionnalite`)
3. Commit avec messages conventionnels
4. Push et ouvrir une Pull Request

## Licence

Ce projet est sous licence MIT - voir le fichier LICENSE pour plus de détails.

---

**Version** : 2.0
**Dernière mise à jour** : 2026-03-11
**Projet** : Mutafriches - Beta.gouv / ADEME
