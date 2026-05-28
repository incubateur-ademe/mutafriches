import { applyDecorators } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiTooManyRequestsResponse,
} from "@nestjs/swagger";

interface StandardErrorsOptions {
  /** Inclure 404 Not Found (endpoints avec :id ou ressource ciblée) */
  notFound?: boolean;
  /** Inclure 429 Too Many Requests (endpoints sous Throttle) */
  rateLimited?: boolean;
}

/**
 * Empile les réponses d'erreur standards documentées.
 *
 * Par défaut : 400 (validation) + 500 (serveur).
 * Options : 404, 429.
 *
 * À appliquer sur tous les endpoints exposés publiquement pour garantir
 * une documentation cohérente des erreurs côté intégrateur.
 */
export function ApiStandardErrors(options: StandardErrorsOptions = {}) {
  const decorators = [
    ApiBadRequestResponse({
      description: "Requête invalide (validation DTO, format d'identifiant cadastral, etc.).",
      schema: {
        example: {
          statusCode: 400,
          message: ["identifiant cadastral invalide : doit faire 14 caractères"],
          error: "Bad Request",
        },
      },
    }),
    ApiInternalServerErrorResponse({
      description:
        "Erreur serveur. Le message est volontairement générique côté client ; le détail technique est journalisé côté serveur.",
      schema: {
        example: {
          statusCode: 500,
          message: "Erreur lors du traitement",
          error: "Internal Server Error",
        },
      },
    }),
  ];

  if (options.notFound) {
    decorators.push(
      ApiNotFoundResponse({
        description: "Ressource introuvable (identifiant inconnu ou expiré).",
        schema: {
          example: {
            statusCode: 404,
            message: "Évaluation introuvable",
            error: "Not Found",
          },
        },
      }),
    );
  }

  if (options.rateLimited) {
    decorators.push(
      ApiTooManyRequestsResponse({
        description:
          "Limite de requêtes atteinte. Limite globale : 100 req/min/IP. Réessayer après quelques secondes.",
        schema: {
          example: {
            statusCode: 429,
            message: "ThrottlerException: Too Many Requests",
          },
        },
      }),
    );
  }

  return applyDecorators(...decorators);
}
