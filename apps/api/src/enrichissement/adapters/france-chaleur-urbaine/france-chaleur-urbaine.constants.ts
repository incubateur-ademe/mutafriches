/**
 * Constantes pour l'API France Chaleur Urbaine
 *
 * Documentation : https://www.data.gouv.fr/dataservices/api-france-chaleur-urbaine
 * Schéma OpenAPI : https://france-chaleur-urbaine.beta.gouv.fr/openapi-schema.yaml
 */

export const FCU_API_BASE_URL = "https://france-chaleur-urbaine.beta.gouv.fr/api";

/**
 * Timeout volontairement court : l'endpoint répond en une cinquantaine de millisecondes et
 * l'orchestrateur enchaîne les domaines en série. Un critère de poids 1 sur 31 ne justifie
 * pas d'ajouter les 10 s du timeout par défaut au parcours utilisateur.
 */
export const FCU_TIMEOUT_MS = 3000;
