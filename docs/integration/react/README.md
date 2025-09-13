# Intégration React - Mutafriches

Exemple d'intégration de l'iframe Mutafriches dans une application React avec le Design System de l'État (DSFR).

## 📋 Prérequis

- React 18+
- Node.js 16+
- DSFR (Design System de l'État)

## 🚀 Installation rapide

### 1. Intégrer le DSFR

Dans votre fichier `public/index.html`, ajoutez les liens vers le DSFR :

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Intégration Mutafriches</title>
  
  <!-- DSFR CSS -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@gouvfr/dsfr@1.14.1/dist/dsfr.min.css">
</head>
<body>
  <div id="root"></div>
  
  <!-- DSFR JS -->
  <script src="https://cdn.jsdelivr.net/npm/@gouvfr/dsfr@1.14.1/dist/dsfr.min.js"></script>
</body>
</html>
```

### 2. Utiliser le composant

Copiez le fichier `App.jsx` dans votre projet et adaptez la configuration :

```typescript
const CONFIG = {
  // Pour tester avec la production Mutafriches
  iframeUrl: "https://mutafriches.beta.gouv.fr",
  expectedOrigin: "https://mutafriches.beta.gouv.fr",
  
  // Pour tester avec votre API locale
  // iframeUrl: "http://localhost:3000/iframe",
  // expectedOrigin: "http://localhost:3000",
  
  params: {
    integrator: "demo", // Remplacez par votre identifiant
    callbackUrl: "https://votre-site.fr/retour",
    callbackLabel: "Retour vers notre site",
  },
};
```

## 📦 Fonctionnalités

- ✅ Hook personnalisé `useMutafriches` pour gérer la communication
- ✅ Gestion des événements PostMessage
- ✅ Interface DSFR responsive
- ✅ Affichage des résultats d'analyse
- ✅ Scroll automatique vers les résultats
- ✅ Gestion des erreurs

## 🔧 Configuration

### Paramètres disponibles

| Paramètre | Description | Exemple |
|-----------|-------------|---------|
| `integrator` | Identifiant de votre organisation | `"demo"` |
| `callbackUrl` | URL de retour après analyse | `"https://votre-site.fr"` |
| `callbackLabel` | Texte du bouton de retour | `"Retour"` |

### Événements écoutés

```typescript
const EVENTS = {
  READY: "mutafriches:ready",       // L'iframe est prête
  COMPLETED: "mutafriches:completed", // Analyse terminée
  ERROR: "mutafriches:error",        // Erreur dans le formulaire
  RESIZE: "mutafriches:resize"       // Demande de redimensionnement
};
```

## 📝 Structure des résultats

Les résultats reçus après une analyse complète :

```typescript
{
  resultats: [
    {
      libelle: "Usage Résidentiel ou mixte",
      score: 68
    },
    // ... autres usages
  ],
  fiabilite: {
    note: 9.5,
    text: "Fiabilité excellente"
  }
}
```

## 🎨 Personnalisation

Le composant utilise les variables CSS du DSFR. Pour personnaliser l'apparence, utilisez les classes DSFR ou surchargez les variables CSS :

```css
:root {
  --border-action-high-blue-france: #000091;
  --background-alt-blue-france: #f5f5fe;
}
```

## 📌 Notes importantes

- L'iframe doit être servie depuis un domaine autorisé
- Les messages PostMessage sont vérifiés par origine pour la sécurité
- Le mode `integrated` doit être activé pour recevoir les événements

## 🔗 Ressources

- [Documentation DSFR](https://www.systeme-de-design.gouv.fr/)
- [API Mutafriches](https://mutafriches.beta.gouv.fr)
- [Support](mailto:contact@mutafriches.beta.gouv.fr)
