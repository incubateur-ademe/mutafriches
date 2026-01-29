# Documentation Mutafriches

> API d'analyse de mutabilité des friches urbaines - Beta.gouv / ADEME

## 📚 Documentation disponible

### Pour les développeurs

- **[Module Enrichissement](./enrichissement.md)** - Collecte automatique des données via APIs externes
- **[Algorithme d'Évaluation](./evaluation-mutabilite.md)** - Calcul des indices de mutabilité

### Pour les intégrateurs

- **[Guide d'Intégration](./integration/README.md)** - Intégrer Mutafriches dans votre site web

## 🎯 Vue d'ensemble du système

```
┌─────────────────┐
│  Identifiant    │
│  cadastral      │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  ENRICHISSEMENT │ ←── 24 APIs publiques
│  24 sources     │     (IGN, Enedis, GeoRisques...)
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  ÉVALUATION     │ ←── Matrice 26 critères × 7 usages
│  Mutabilité     │
└────────┬────────┘
         │
         ↓
   Indice 0-100%
   pour 7 usages
```

## 🚀 Démarrage rapide

### Enrichir une parcelle

```bash
POST /enrichissement
{
  "identifiant": "25056000HZ0346"
}
```

**Réponse** : Parcelle enrichie avec ~25 critères (surfaces, distances, risques, zonages...)

### Évaluer la mutabilité

```bash
POST /evaluation/calculer
{
  "identifiantParcelle": "25056000HZ0346",
  # + critères enrichis ou saisis manuellement
}
```

**Réponse** : Indices de mutabilité 0-100% pour 7 usages + fiabilité

## 🏗️ Architecture

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

## 📖 Concepts clés

### Enrichissement

Le module d'enrichissement interroge **24 sources de données externes** (APIs publiques françaises) pour pré-remplir automatiquement les critères d'une parcelle :

- **9 domaines** : Cadastre, Énergie, Transport, Urbanisme, Risques Naturels, Risques Technologiques, Pollution, Zonages, GeoRisques
- **21 APIs externes** : IGN, Enedis, GeoRisques, API Carto, data.gouv.fr...
- **3 bases locales** : Transport, BPE (commerces), Sites pollués ADEME
- **Cache 24h** : Optimisation des performances

### Évaluation de mutabilité

L'algorithme calcule un **indice de mutabilité 0-100%** pour **7 usages** possibles d'une friche :

1. Résidentiel pur
2. Résidentiel mixte
3. Tertiaire
4. Logistique
5. Industrie
6. Équipements publics
7. Énergies renouvelables

**Matrice** : 26 critères × 7 usages = 182 pondérations
**Fiabilité** : Indice 0-10 selon précision des données d'entrée

### Intégration

Mutafriches peut être intégré dans un site web via **iframe + postMessage** :

- Formulaire complet dans iframe
- Communication bidirectionnelle sécurisée
- Callback personnalisable
- Support HTML/React

## 🔗 Liens utiles

- **Production** : https://mutafriches.beta.gouv.fr
- **Staging** : https://mutafriches.incubateur.ademe.dev
- **Documentation API** : https://mutafriches.beta.gouv.fr/docs
- **Repository** : https://github.com/incubateur-ademe/mutafriches
- **Contact** : contact@mutafriches.beta.gouv.fr

## 🛠️ Développement

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

## 📋 Règles de code

Voir [CLAUDE.md](../CLAUDE.md) pour les règles strictes :

- Typage TypeScript explicite obligatoire
- Pas d'emojis dans le code
- Accents français obligatoires
- Conventions de nommage NestJS

## 🤝 Contribuer

1. Fork le projet
2. Créer une branche (`git checkout -b feature/ma-fonctionnalite`)
3. Commit avec messages conventionnels
4. Push et ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT - voir le fichier LICENSE pour plus de détails.

---

**Version** : 1.0
**Dernière mise à jour** : 2026-01-29
**Projet** : Mutafriches - Beta.gouv / ADEME
