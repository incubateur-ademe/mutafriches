import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";

/**
 * Guard qui protège l'endpoint POST /api/donnees-externes/apis/refresh.
 *
 * Vérifie que la requête fournit un header `X-Refresh-Token` correspondant à
 * la variable d'environnement `API_REFRESH_TOKEN`.
 *
 * Utilisé par le workflow GitHub Actions `api-monitoring.yml`, qui dispose du
 * token via un secret GH.
 *
 * Si `API_REFRESH_TOKEN` n'est pas définie côté serveur, le guard rejette
 * toutes les requêtes (fail-closed) sauf en mode développement où il laisse
 * passer pour permettre le test local.
 */
@Injectable()
export class ApiRefreshTokenGuard implements CanActivate {
  private readonly logger = new Logger(ApiRefreshTokenGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const expectedToken = process.env.API_REFRESH_TOKEN;
    const providedToken = request.headers["x-refresh-token"];

    if (!expectedToken) {
      if (process.env.NODE_ENV === "development") {
        this.logger.warn(
          "API_REFRESH_TOKEN non définie — bypass autorisé en mode développement uniquement",
        );
        return true;
      }
      this.logger.error("API_REFRESH_TOKEN non définie côté serveur — refresh refusé");
      throw new UnauthorizedException("Authentification non configurée");
    }

    if (providedToken !== expectedToken) {
      throw new UnauthorizedException("Token de refresh invalide");
    }

    return true;
  }
}
