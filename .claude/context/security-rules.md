# Règles de sécurité

> Checklist de sécurité pour le développement et la revue de code Mutafriches.

---

## 1. Gestion des secrets

- **JAMAIS** de clés API, mots de passe ou tokens en dur dans le code
- **TOUJOURS** utiliser les variables d'environnement (`process.env` ou `ConfigService`)
- **TOUJOURS** vérifier que `.env` est dans `.gitignore`
- **JAMAIS** logger de données sensibles (tokens, mots de passe, clés API)
- **JAMAIS** inclure de secrets dans les messages d'erreur retournés au client

```typescript
// INTERDIT
const apiKey = "ma-cle-secrete-1234";

// CORRECT
const apiKey = this.configService.get<string>("MON_API_KEY");
```

---

## 2. Validation des entrées

### DTOs NestJS

- **TOUJOURS** valider les entrées via des DTOs typés
- **TOUJOURS** utiliser `class-validator` ou des pipes de validation
- Valider les identifiants cadastraux (format 14 caractères, caractères autorisés)
- Valider les codes INSEE (5 caractères numériques)
- Limiter le nombre de parcelles en entrée (max 20)

```typescript
// Exemple de validation d'identifiant cadastral
if (!isValidIdentifiantCadastral(identifiant)) {
  throw new BadRequestException("Identifiant cadastral invalide");
}
```

### Données utilisateur

- **JAMAIS** faire confiance aux données d'entrée sans validation
- **TOUJOURS** vérifier les types et les plages de valeurs
- **TOUJOURS** sanitiser les chaînes avant utilisation dans des requêtes

---

## 3. Protection des APIs externes

### Timeouts et résilience

- **TOUJOURS** configurer un timeout sur les appels HTTP (`HttpService`)
- **TOUJOURS** encapsuler les appels dans un try/catch (pattern `ApiResponse<T>`)
- **JAMAIS** propager les erreurs brutes des APIs externes au client
- Utiliser `Promise.allSettled()` pour les appels parallèles (un échec n'affecte pas les autres)

```typescript
// CORRECT : timeout + gestion d'erreur
const response = await firstValueFrom(
  this.httpService.get(url, { timeout: 10000 }),
);

// INTERDIT : pas de timeout, erreur non gérée
const response = await firstValueFrom(this.httpService.get(url));
```

### Données reçues

- **TOUJOURS** caster les réponses API (`as MonType`) — jamais utiliser directement
- **TOUJOURS** vérifier la présence des champs attendus avant utilisation
- **JAMAIS** logger le contenu complet des réponses API en production (taille, données personnelles)

---

## 4. Guards et contrôle d'accès

### IntegrateurOriginGuard

- Vérifie l'origine des requêtes pour les endpoints intégrateurs
- Origines par défaut whitelistées (Mutafriches, Benefriches)
- Bypass en mode `development` uniquement
- S'applique à : `POST /enrichissement`, `POST /evaluation/calculer`

### OriginGuard

- Plus restrictif que IntegrateurOriginGuard
- Uniquement les origines Mutafriches (pas les intégrateurs)
- S'applique à : `POST /evenements`
- Les intégrateurs ne doivent PAS envoyer d'événements

### Règles

- **JAMAIS** désactiver un guard en production
- **TOUJOURS** vérifier l'en-tête `Origin` puis `Referer` en fallback
- **JAMAIS** ajouter `localhost` aux origines autorisées en production
- Pour ajouter un nouvel intégrateur : utiliser `ALLOWED_INTEGRATOR_ORIGINS`

---

## 5. Base de données et PostGIS

### Requêtes SQL

- **TOUJOURS** utiliser Drizzle ORM pour les requêtes (pas de SQL brut)
- Si SQL brut nécessaire (PostGIS), **TOUJOURS** utiliser des paramètres préparés
- **JAMAIS** concaténer des entrées utilisateur dans du SQL

```typescript
// INTERDIT : injection SQL possible
const query = `SELECT * FROM sites WHERE code_insee = '${codeInsee}'`;

// CORRECT : paramètre préparé via Drizzle
const result = await db.select().from(sites).where(eq(sites.codeInsee, codeInsee));
```

### Données géographiques

- **TOUJOURS** valider les coordonnées (latitude -90/+90, longitude -180/+180)
- **TOUJOURS** valider les géométries GeoJSON avant utilisation dans des requêtes PostGIS
- **JAMAIS** injecter de géométrie utilisateur directement dans une requête spatiale sans validation

---

## 6. Rate limiting

- Le ThrottlerGuard global est configuré à **100 requêtes/minute par IP**
- Ce guard s'applique à tous les endpoints
- En cas de besoin de limites spécifiques, utiliser `@Throttle()` sur le controller

---

## 7. Exposition de données

### Réponses API

- **JAMAIS** retourner d'informations système (stack traces, versions, chemins serveur)
- **JAMAIS** retourner de données internes (IDs de cache, métriques de performance en production)
- **TOUJOURS** utiliser des DTOs de sortie pour contrôler les champs exposés
- Les messages d'erreur doivent être génériques pour le client, détaillés dans les logs

```typescript
// INTERDIT
throw new InternalServerErrorException(error.stack);

// CORRECT
this.logger.error(`Erreur enrichissement cadastre : ${error.message}`, error.stack);
throw new InternalServerErrorException("Erreur lors de l'enrichissement");
```

### Logs

- **JAMAIS** logger de données personnelles (adresses, noms)
- Masquer les identifiants sensibles dans les logs si nécessaire
- Utiliser les niveaux de log appropriés (`warn` pour les erreurs récupérables, `error` pour les erreurs critiques)

---

## 8. CORS et cookies

- En production, NestJS sert l'API et l'UI depuis le même domaine (pas de CORS)
- En développement, le proxy Vite gère la communication API ↔ UI
- **JAMAIS** configurer `Access-Control-Allow-Origin: *` en production

---

## 9. Dépendances

- Vérifier régulièrement les vulnérabilités : `pnpm audit`
- Utiliser `pnpm install --frozen-lockfile` en CI/CD
- Mettre à jour les dépendances critiques (NestJS, Drizzle, Axios)

---

## Checklist revue de code

- [ ] Pas de secrets en dur dans le code
- [ ] Entrées validées (DTOs, identifiants cadastraux, coordonnées)
- [ ] Appels API externes avec timeout et gestion d'erreur
- [ ] Pas d'injection SQL (Drizzle ORM ou paramètres préparés)
- [ ] Géométries validées avant requêtes PostGIS
- [ ] Messages d'erreur génériques pour le client
- [ ] Pas de données sensibles dans les logs
- [ ] Guards appropriés sur les nouveaux endpoints
- [ ] Rate limiting vérifié
- [ ] Types castés explicitement (pas de `any` implicite)
