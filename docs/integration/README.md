# Guide d'intégration Mutafriches

## 🎯 Objectif

Ce guide vous permet d'intégrer le formulaire d'analyse Mutafriches dans votre site web. L'intégration se fait via une iframe qui communique avec votre page grâce à l'API postMessage.

## 🚀 Démarrage rapide (5 minutes)

### Intégration HTML simple

1. **Téléchargez le fichier exemple** [`integration-mutafriches.html`](./html/integration-mutafriches.html)

2. **Modifiez la configuration** dans la section JavaScript :

```javascript
const INTEGRATOR = "demo";                      // Votre identifiant d'intégrateur
const CALLBACK_URL = "https://votre-site.fr";   // URL de retour vers votre site
const CALLBACK_LABEL = "Retour vers mon site";  // Texte du bouton de retour
```

3. **Testez localement** en ouvrant le fichier dans votre navigateur

4. **Déployez** sur votre serveur web

### Intégration React

Pour une application React, consultez l'exemple complet dans [`/react`](./react) avec hook personnalisé et gestion d'état.

## 📋 Configuration détaillée

### Paramètres d'intégration

| Paramètre | Description | Exemple | Requis |
|-----------|-------------|---------|---------|
| `integrator` | Identifiant unique fourni par Mutafriches | `"demo"` pour les tests | ✅ |
| `callbackUrl` | URL où renvoyer l'utilisateur après l'analyse | `"https://votre-site.fr/retour"` | ❌ |
| `callbackLabel` | Texte affiché sur le bouton de retour | `"Retour vers notre plateforme"` | ❌ |

### Environnements disponibles

| Environnement | URL | Usage |
|---------------|-----|--------|
| Production | `https://mutafriches.beta.gouv.fr` | Site en production |
| Développement | `http://localhost:3000/iframe` | Tests locaux |

### Intégrateur de démonstration

Pour vos tests, utilisez l'intégrateur `"demo"` qui :

- Fonctionne depuis n'importe quel domaine
- N'a pas de restriction sur l'URL de callback
- Permet de tester l'intégration en local

### Intégrateur de production

Pour la production, contactez-nous à `contact@mutafriches.beta.gouv.fr` pour obtenir :

- Votre identifiant d'intégrateur unique
- L'autorisation de votre domaine
- Un support technique personnalisé

## 📨 Messages échangés

Le formulaire communique avec votre page via des messages JavaScript.

### Message `completed`

Envoyé quand l'analyse est terminée avec les résultats complets :

```javascript
{
  type: 'mutafriches:completed',
  timestamp: 1758177708492,
  data: {
    evaluationId: "uuid-de-l-evaluation",
    identifiantParcelle: "49353000AV0202",
    identifiantsParcelles: ["49353000AV0202"],  // Multi-parcelle : liste des identifiants
    retrieveUrl: "/evaluation/uuid-de-l-evaluation",
    fiabilite: {
      note: 8.5,
      text: "Bonne"
    },
    usagePrincipal: {
      usage: "residentiel",
      indiceMutabilite: 75.5,
      potentiel: "Excellent"
    },
    top3Usages: [
      { usage: "residentiel", indiceMutabilite: 75.5, rang: 1 },
      { usage: "equipements", indiceMutabilite: 68.2, rang: 2 },
      { usage: "tertiaire", indiceMutabilite: 62.1, rang: 3 }
    ],
    metadata: {
      dateAnalyse: "2026-03-15T10:30:00Z",
      versionAlgorithme: "2.0.0"
    }
  }
}
```

> **Note multi-parcelle** : En mode multi-parcelle, `identifiantParcelle` contient les identifiants séparés par des virgules et `identifiantsParcelles` contient le tableau complet.

### Message `error`

Envoyé en cas d'erreur :

```javascript
{
  type: "mutafriches:error",
  timestamp: 1758177708492,
  data: {
    error: "Description de l'erreur",
    code: "ERROR_CODE"
  }
}
```

## 💻 Exemples d'intégration

### Exemple minimal HTML

```html
<!DOCTYPE html>
<html>
<head>
  <title>Mon site - Analyse Mutafriches</title>
</head>
<body>
  <h1>Analysez votre friche</h1>
  
  <!-- Iframe Mutafriches -->
  <iframe 
    id="mutafriches"
    src="https://mutafriches.beta.gouv.fr/iframe?integrator=demo&callbackUrl=https://mon-site.fr&callbackLabel=Retour"
    style="width: 100%; height: 900px; border: none;">
  </iframe>
  
  <script>
    // Écouter les résultats
    window.addEventListener('message', (event) => {
      // Vérifier l'origine pour la sécurité
      if (event.origin !== 'https://mutafriches.beta.gouv.fr') return;
      
      if (event.data.type === 'mutafriches:completed') {
        console.log('Analyse terminée !', event.data.data);
        // Traiter les résultats...
      }
    });
  </script>
</body>
</html>
```

### Gestion avancée des résultats

```javascript
function handleFormCompletion(data) {
  // Extraire les résultats simplifiés
  const { evaluationId, usagePrincipal, fiabilite } = data;
  
  // Sauvegarder l'ID pour récupération ultérieure
  localStorage.setItem('lastEvaluationId', evaluationId);
  
  // Afficher un récapitulatif
  console.log(`Meilleur usage: ${usagePrincipal.usage} (${usagePrincipal.indiceMutabilite}%)`);
  
  // Option : Récupérer l'évaluation complète via API
  fetch(`https://mutafriches.beta.gouv.fr${data.retrieveUrl}`)
    .then(res => res.json())
    .then(evaluation => {
      console.log('Évaluation complète:', evaluation);
      // Traitement des données complètes
    });
}
```

## Intégration API directe (partenaires)

En plus de l'intégration iframe, les partenaires peuvent appeler l'API REST directement pour un contrôle total du flux.

### Flux d'utilisation

1. **Enrichir un site** (mono ou multi-parcelle)

```bash
POST https://mutafriches.beta.gouv.fr/enrichissement?integrateur=votre-id
Content-Type: application/json

# Mono-parcelle
{ "identifiant": "25056000HZ0346" }

# Multi-parcelle (1 à 20 parcelles)
{ "identifiants": ["25056000HZ0346", "25056000HZ0347", "25056000HZ0348"] }
```

2. **Calculer la mutabilité** avec les données enrichies + données complémentaires

```bash
POST https://mutafriches.beta.gouv.fr/evaluation/calculer?integrateur=votre-id
Content-Type: application/json

{
  "donneesEnrichies": { ... },        // Réponse de l'étape 1
  "donneesComplementaires": { ... }   // Données saisies par l'utilisateur
}
```

3. **Récupérer une évaluation** ultérieurement

```bash
GET https://mutafriches.beta.gouv.fr/evaluation/{evaluationId}
```

### Documentation Swagger

La documentation complète de l'API (schémas, DTOs, exemples) est disponible sur :
- **Production** : https://mutafriches.beta.gouv.fr/api
- **Staging** : https://mutafriches.incubateur.ademe.dev/api

### Autorisation des origines

Pour utiliser l'API directe en production, votre domaine doit être autorisé. Contactez-nous pour l'ajouter à la liste blanche.

---

## Personnalisation

### Taille de l'iframe

Hauteur recommandée : **900px minimum** pour une expérience optimale

```html
<iframe 
  style="width: 100%; height: 900px; border: none;"
>
```

### Style et apparence

Le fichier exemple utilise le Design System de l'État (DSFR). Vous pouvez :

- Garder le DSFR pour une cohérence avec les sites de l'État
- Remplacer par votre propre CSS
- Intégrer dans votre framework CSS existant

### Paramètres d'URL

Construction de l'URL avec paramètres :

```javascript
const params = new URLSearchParams({
  integrator: 'demo',
  callbackUrl: 'https://votre-site.fr',
  callbackLabel: 'Retour'
});

const iframeUrl = `https://mutafriches.beta.gouv.fr/iframe?${params}`;
```

## 🛡️ Sécurité

### Vérification de l'origine

**Toujours vérifier l'origine des messages** pour la sécurité :

```javascript
window.addEventListener('message', (event) => {
  // Liste des origines autorisées
  const allowedOrigins = [
    "https://mutafriches.beta.gouv.fr",
    "http://localhost:3000" // Pour le développement uniquement
  ];
  
  if (!allowedOrigins.includes(event.origin)) {
    console.warn('Message rejeté - origine non autorisée:', event.origin);
    return;
  }
  
  // Traiter le message en toute sécurité
  handleMessage(event.data);
});
```

### HTTPS obligatoire

En production :

- Votre page d'intégration doit être en HTTPS
- L'URL de callback doit être en HTTPS

## 🧪 Test et débogage

### Console du navigateur

Ouvrez la console (F12) pour voir :

- Les messages échangés
- Les erreurs éventuelles
- Les logs de debug

### Mode debug

Ajoutez des logs pour suivre la communication :

```javascript
window.addEventListener('message', (event) => {
  console.log('Message reçu:', {
    origin: event.origin,
    type: event.data.type,
    timestamp: new Date(event.data.timestamp),
    data: event.data
  });
});
```

### Problèmes courants

| Problème | Solution |
|----------|----------|
| Aucun message reçu | Vérifiez que vous utilisez l'intégrateur `"demo"` pour les tests |
| Erreur HTTPS | En production, l'URL de callback doit être en HTTPS |
| Iframe ne se charge pas | Vérifiez la connexion internet et l'URL de Mutafriches |
| Bouton callback absent | Le bouton apparaît uniquement à l'étape 3 après les résultats |
| Origine non autorisée | Vérifiez que votre domaine est autorisé pour votre intégrateur |

## ✅ Checklist de mise en production

- [ ] J'ai testé avec l'intégrateur `"demo"`
- [ ] J'ai demandé mon identifiant d'intégrateur officiel
- [ ] Mon domaine est autorisé par Mutafriches
- [ ] Mon URL de callback est en HTTPS
- [ ] Je vérifie l'origine des messages PostMessage
- [ ] J'ai configuré la gestion des résultats
- [ ] J'ai prévu la sauvegarde des évaluations

## 📁 Structure des exemples

```
/docs/integration/
├── README.md                           # Ce fichier
├── html/
│   └── integration-mutafriches.html    # Exemple HTML complet avec DSFR
└── react/
    ├── App.jsx                          # Composant React avec hook
    └── README.md                        # Documentation spécifique React
```

## 📞 Support

### Documentation

- Site web : [https://mutafriches.beta.gouv.fr](https://mutafriches.beta.gouv.fr)
- Documentation API : [https://mutafriches.beta.gouv.fr/docs](https://mutafriches.beta.gouv.fr/docs)

### Contact technique

Email : `contact@mutafriches.beta.gouv.fr`

Pour obtenir votre identifiant d'intégrateur, contactez-nous par mail afin d'échanger autour de vos besoins.

### Ressources complémentaires

- [Design System de l'État (DSFR)](https://www.systeme-de-design.gouv.fr/)
- [Documentation PostMessage MDN](https://developer.mozilla.org/fr/docs/Web/API/Window/postMessage)

---

*Version 2.0 - Mars 2026*  
