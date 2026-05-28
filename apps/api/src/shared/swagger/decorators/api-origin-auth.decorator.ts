import { applyDecorators } from "@nestjs/common";
import { ApiForbiddenResponse } from "@nestjs/swagger";

type OriginScope = "integrateur" | "mutafriches";

const DESCRIPTIONS: Record<OriginScope, string> = {
  integrateur:
    "Endpoint protégé par contrôle d'origine HTTP. Le header `Origin` (ou `Referer` en fallback) doit appartenir à la liste des intégrateurs whitelistés (Mutafriches, Benefriches, ou ajoutés via `ALLOWED_INTEGRATOR_ORIGINS`). En mode `development`, le contrôle est bypassed.",
  mutafriches:
    "Endpoint réservé aux domaines Mutafriches uniquement. Les intégrateurs tiers (Benefriches, etc.) n'y ont pas accès.",
};

/**
 * Documente l'authentification par contrôle d'origine HTTP (IntegrateurOriginGuard / OriginGuard).
 * À appliquer sur chaque endpoint protégé par l'un de ces guards.
 */
export function ApiOriginAuth(scope: OriginScope = "integrateur") {
  return applyDecorators(
    ApiForbiddenResponse({
      description: DESCRIPTIONS[scope],
      schema: {
        examples: {
          originManquante: {
            summary: "Header Origin absent",
            value: {
              statusCode: 403,
              message: "Origin required",
              error: "Forbidden",
            },
          },
          origineNonAutorisee: {
            summary: "Origin non whitelistée",
            value: {
              statusCode: 403,
              message: "Origin not allowed",
              error: "Forbidden",
            },
          },
        },
      },
    }),
  );
}
