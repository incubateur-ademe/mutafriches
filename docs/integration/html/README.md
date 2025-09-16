# Guide d'intégration Mutafriches

## 🎯 Objectif

Ce guide vous permet d'intégrer le formulaire d'analyse Mutafriches dans votre site web. L'intégration se fait via une iframe qui communique avec votre page grâce à l'API postMessage.

## 🚀 Démarrage rapide (5 minutes)

### 1. Téléchargez le fichier exemple

Téléchargez le fichier [`integration-mutafriches.html`](./integration-mutafriches.html) qui contient un exemple complet d'intégration avec le Design System de l'État (DSFR).

### 2. Modifiez la configuration

Ouvrez le fichier et modifiez ces 3 lignes dans la section JavaScript :

```javascript
const INTEGRATOR = "demo";                      // Votre identifiant d'intégrateur
const CALLBACK_URL = "https://votre-site.fr";   // URL de retour vers votre site
const CALLBACK_LABEL = "Retour vers mon site";  // Texte du bouton de retour
```

### 3. Testez localement

Ouvrez le fichier HTML dans votre navigateur. Le formulaire Mutafriches se chargera automatiquement.

### 4. Déployez sur votre serveur

Hébergez le fichier sur votre serveur web. C'est prêt !

## 📋 Configuration détaillée

### Paramètres d'intégration

| Paramètre | Description | Exemple |
|-----------|-------------|---------|
| `INTEGRATOR` | Identifiant unique fourni par Mutafriches | `"demo"` pour les tests |
| `CALLBACK_URL` | URL où renvoyer l'utilisateur après l'analyse | `"https://votre-site.fr/retour"` |
| `CALLBACK_LABEL` | Texte affiché sur le bouton de retour | `"Retour vers notre plateforme"` |
| `MUTAFRICHES_BASE_URL` | URL de l'API Mutafriches | `"https://mutafriches.beta.gouv.fr"` |

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

Le formulaire communique avec votre page via des messages JavaScript. Voici les messages que vous recevrez :

### Message `completed`

Envoyé quand l'analyse est terminée avec les résultats complets.

```javascript
{
  type: "mutafriches:completed",
  data: {
    results: {
      resultats: [...],     // Tableau des 7 usages analysés
      fiabilite: {...}      // Indice de fiabilité
    },
    formData: {...}         // Données du formulaire
  }
}
```

### Message `error`

Envoyé en cas d'erreur.

```javascript
{
  type: "mutafriches:error",
  data: {
    error: "Description de l'erreur",
    code: "ERROR_CODE"
  }
}
```

## 🔧 Personnalisation

### Adapter le style

Le fichier exemple utilise le DSFR. Vous pouvez :

- Garder le DSFR pour une cohérence avec les sites de l'État
- Remplacer par votre propre CSS
- Intégrer dans votre framework CSS existant

### Gérer les résultats

Dans la fonction `handleFormCompletion`, vous pouvez :

```javascript
function handleFormCompletion(data) {
  // Extraire les résultats
  const topUsage = data.results.resultats[0];
  const fiabilite = data.results.fiabilite;
  
  // Envoyer à votre backend
  fetch('/api/save-analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  // Afficher un récapitulatif
  alert(`Meilleur usage: ${topUsage.libelle} (${topUsage.score}%)`);
  
  // Rediriger l'utilisateur
  window.location.href = '/resultats';
}
```

### Taille de l'iframe

Modifiez la hauteur selon vos besoins :

```html
<iframe 
  style="height: 900px;"  <!-- Ajustez ici -->
>
```

Hauteur recommandée : **900px minimum** pour une expérience optimale.

## 🛡️ Sécurité

### Vérification de l'origine

Le code vérifie l'origine des messages pour la sécurité :

```javascript
const allowedOrigins = [
  "https://mutafriches.beta.gouv.fr",
  "https://mutafriches.incubateur.ademe.dev"
];
```

### HTTPS obligatoire

En production, utilisez toujours HTTPS pour :

- Votre page d'intégration
- L'URL de callback

## 🧪 Test et débogage

### Console du navigateur

Ouvrez la console (F12) pour voir :

- Les messages échangés
- Les erreurs éventuelles
- Les logs de debug

### Console visuelle

Le fichier exemple inclut une console visuelle qui affiche :

- Les messages reçus en temps réel
- Le détail des données
- L'horodatage

### Problèmes courants

| Problème | Solution |
|----------|----------|
| Aucun message reçu | Vérifiez que vous utilisez l'intégrateur `"demo"` pour les tests |
| Erreur HTTPS | En production, l'URL de callback doit être en HTTPS |
| Iframe ne se charge pas | Vérifiez la connexion internet et l'URL de Mutafriches |
| Bouton callback absent | Le bouton apparaît uniquement à l'étape 3 après les résultats |

## 📞 Support

### Documentation

- Site web : [https://mutafriches.beta.gouv.fr](https://mutafriches.beta.gouv.fr)
- Documentation API : [https://mutafriches.beta.gouv.fr/integration](https://mutafriches.beta.gouv.fr/integration)

### Contact

- Email : <contact@mutafriches.beta.gouv.fr>
- Sujet : "Demande d'intégration - [Nom de votre organisation]"

### Informations à fournir

Pour obtenir votre identifiant d'intégrateur :

1. Nom de votre organisation
2. URL(s) de votre site
3. Contact technique
4. Cas d'usage prévu

## 📝 Exemple complet

Voici un exemple minimal d'intégration :

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
    src="https://mutafriches.beta.gouv.fr?integrator=demo&callbackUrl=https://mon-site.fr&callbackLabel=Retour"
    style="width: 100%; height: 900px; border: none;">
  </iframe>
  
  <script>
    // Écouter les résultats
    window.addEventListener('message', (event) => {
      if (event.data.type === 'mutafriches:completed') {
        console.log('Analyse terminée !', event.data.results);
        // Traiter les résultats...
      }
    });
  </script>
</body>
</html>
```

## ✅ Checklist de mise en production

- [ ] J'ai testé avec l'intégrateur `"demo"`
- [ ] J'ai demandé mon identifiant d'intégrateur officiel
- [ ] Mon domaine est autorisé par Mutafriches
- [ ] Mon URL de callback est en HTTPS
- [ ] J'ai configuré la gestion des résultats
- [ ] J'ai testé sur mobile et desktop
- [ ] J'ai prévu la sauvegarde des résultats

---

*Version 1.0 - Septembre 2025*
