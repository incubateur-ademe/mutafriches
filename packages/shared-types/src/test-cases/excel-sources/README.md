# Excel Sources

Fichiers Excel de test pour Mutafriches.

## Structure

```
excel-sources/
├── v1.0/
│   ├── v1.0_test-01_oyonnax.xlsx
│   ├── v1.0_test-02_renaison.xlsx
│   └── v1.0_test-03_...xlsx
└── v1.1/                         # Futures versions
```

## Usage

```bash
# Générer une fixture depuis un Excel
pnpm excel-to-fixture ./src/test-cases/excel-sources/v1.0/v1.0_test-01_oyonnax.xlsx

# Générer toutes les fixtures
pnpm excel-to-fixture:all
```

## Convention de nommage

Format : `v1.0_test-[XX]_[ville].xlsx`

- Version algorithme Mutafriches
- Numéro séquentiel sur 2 chiffres
- Nom de ville en minuscules
