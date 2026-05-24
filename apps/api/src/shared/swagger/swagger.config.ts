import { DocumentBuilder } from "@nestjs/swagger";
import { APP_VERSION } from "../utils/version.utils";
import { isProduction, isStaging } from "../utils/environment.utils";
import { VERSION_COURANTE } from "../../evaluation/services/algorithme/versions";

const SERVERS = {
  production: { url: "https://mutafriches.beta.gouv.fr", description: "Production" },
  staging: { url: "https://mutafriches.incubateur.ademe.dev", description: "Staging" },
  local: { url: "http://localhost:3000", description: "Local" },
} as const;

/**
 * Ordonne les serveurs selon l'environnement courant : Swagger UI utilise le premier
 * comme cible par défaut du bouton "Execute". En dev, on cible localhost pour éviter
 * que les essais "Try it out" partent en prod et soient rejetés par le guard d'origine.
 */
function orderedServers() {
  if (isProduction()) {
    return [SERVERS.production, SERVERS.staging, SERVERS.local];
  }
  if (isStaging()) {
    return [SERVERS.staging, SERVERS.production, SERVERS.local];
  }
  return [SERVERS.local, SERVERS.staging, SERVERS.production];
}

const DESCRIPTION = `
API publique de **Mutafriches** — analyse de la mutabilité des friches urbaines.

Cette API expose deux services principaux :

- **Enrichissement** d'une parcelle cadastrale à partir de ~24 sources publiques (IGN, BDNB, GéoRisques, Enedis, ZAER, etc.)
- **Évaluation de mutabilité** sur 7 usages (résidentiel, équipements, culture, tertiaire, industrie, renaturation, photovoltaïque) à partir d'une matrice 24 critères × 7 usages

---

### Authentification

Les endpoints exposés aux intégrateurs sont protégés par un contrôle d'**origine HTTP** (header \`Origin\`, fallback \`Referer\`).
Seules les origines whitelistées (Mutafriches, Benefriches, plus la variable \`ALLOWED_INTEGRATOR_ORIGINS\`) sont autorisées.
Pas de clé API à transmettre — l'autorisation se fait au niveau du navigateur ou du serveur appelant.

| Code | Quand | Sens |
|------|-------|------|
| \`403 Forbidden\` | Header \`Origin\` absent ou non whitelisté | Contacter l'équipe Mutafriches pour ajouter votre domaine |

### Rate limiting

Limite globale : **100 requêtes / minute / IP**. Un endpoint interne (\`/evenements\`) est plus restrictif (30 req/min) et n'est pas exposé ici.

### Versioning de l'algorithme

L'algorithme de scoring est versionné. La version courante (\`${VERSION_COURANTE}\`) est utilisée par défaut.
Pour cibler une version précise, passer \`?versionAlgorithme=vX.Y\` sur \`POST /evaluation/calculer\`.
La liste complète des versions est exposée via \`GET /evaluation/algorithme/versions\`.

### Sémantique des données manquantes

Trois valeurs distinctes traduisent l'absence d'information dans les réponses :

- \`null\` — recherche effectuée, aucun résultat trouvé (**compte comme renseigné**)
- \`undefined\` (champ absent) — donnée techniquement indisponible (API en panne, timeout)
- \`"ne-sait-pas"\` — l'utilisateur a explicitement répondu qu'il ne sait pas

Cette distinction est utilisée par le calcul de l'indice de fiabilité.

### Format des identifiants cadastraux

14 caractères : \`DDDCCCSSNNNNPP\` (département 3 chiffres, commune 3 chiffres, section 2 caractères, numéro 4 chiffres, parcelle 2 chiffres).
Exemples : \`25056000HZ0346\` (Besançon), \`49353000AV0202\` (Trélazé).
Cas particuliers : Corse (\`2A\`/\`2B\`), DOM-TOM (départements \`971\`–\`976\`).

### Liens utiles

- Code source : [github.com/MTES-MCT/mutafriches](https://github.com/MTES-MCT/mutafriches)
- Page produit : [mutafriches.beta.gouv.fr](https://mutafriches.beta.gouv.fr)
`;

export function buildSwaggerConfig() {
  const builder = new DocumentBuilder()
    .setTitle("Mutafriches API")
    .setDescription(DESCRIPTION)
    .setVersion(APP_VERSION)
    .setContact(
      "Équipe Mutafriches",
      "https://mutafriches.beta.gouv.fr",
      "contact@mutafriches.beta.gouv.fr",
    )
    .setLicense("MIT", "https://opensource.org/licenses/MIT");

  for (const server of orderedServers()) {
    builder.addServer(server.url, server.description);
  }

  return builder
    .addTag(
      "enrichissement",
      "Enrichissement d'une parcelle cadastrale à partir de ~24 sources publiques",
    )
    .addTag("evaluation", "Calcul de mutabilité sur 7 usages (matrice 24 critères × 7 usages)")
    .addTag("stats", "KPIs publics Mutafriches")
    .addTag("donnees-externes", "Statut des sources externes (cache, monitoring)")
    .addTag("health", "Vérification de l'état de santé de l'API")
    .build();
}
