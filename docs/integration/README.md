# Exemples d'intégration Mutafriches

Ce dossier contient des exemples d'intégration de l'iframe Mutafriches dans différents contextes.

## 📁 Exemples disponibles

### [HTML](/docs/integration/html)

Intégration simple en HTML/JavaScript vanilla avec le DSFR.

- ✅ Sans framework
- ✅ Léger et rapide
- ✅ Idéal pour sites statiques

### [React](/docs/integration/react)

Intégration dans une application React avec hook personnalisé.

- ✅ Hook `useMutafriches` réutilisable
- ✅ Gestion d'état React
- ✅ TypeScript ready

## 🚀 Démarrage rapide

1. Choisissez l'exemple correspondant à votre stack
2. Suivez les instructions du README spécifique
3. Adaptez la configuration à vos besoins

## 📝 Configuration commune

Tous les exemples utilisent les mêmes paramètres :

| Paramètre | Description | Requis |
|-----------|-------------|---------|
| `integrator` | Identifiant unique de votre organisation | ✅ |
| `callbackUrl` | URL de retour après analyse | ❌ |
| `callbackLabel` | Texte personnalisé du bouton de retour | ❌ |

## 🔒 Sécurité

- Vérifiez toujours l'origine des messages PostMessage
- Utilisez HTTPS en production
- Validez les données reçues avant utilisation

## 💡 Besoin d'aide ?

- Documentation complète : [mutafriches.beta.gouv.fr/docs](https://mutafriches.beta.gouv.fr/docs)
- Support technique : <contact@mutafriches.beta.gouv.fr>
