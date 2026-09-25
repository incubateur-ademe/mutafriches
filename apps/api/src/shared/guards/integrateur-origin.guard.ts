import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from "@nestjs/common";
import { Request } from "express";
import { isDevelopment, normaliserOrigines } from "../utils";
import { getAppConfig } from "../../config";

// Seules nos propres origines sont codées : l'UI (standalone et iframe) appelle l'API depuis
// notre domaine. Tout intégrateur tiers passe par ALLOWED_INTEGRATOR_ORIGINS.
const DEFAULT_ALLOWED_ORIGINS = [
  "https://mutafriches.beta.gouv.fr",
  "https://mutafriches.incubateur.ademe.dev",
];

@Injectable()
export class IntegrateurOriginGuard implements CanActivate {
  private readonly logger = new Logger(IntegrateurOriginGuard.name);
  private readonly allowedOrigins: string[];

  constructor() {
    const envOrigins = getAppConfig().origins.allowedIntegrators;
    const originesBrutes = envOrigins
      ? [...DEFAULT_ALLOWED_ORIGINS, ...envOrigins.split(",")]
      : DEFAULT_ALLOWED_ORIGINS;

    this.allowedOrigins = normaliserOrigines(originesBrutes, this.logger);
  }

  canActivate(context: ExecutionContext): boolean {
    // Bypass en developpement
    if (isDevelopment()) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const origin = this.extractOrigin(request);

    if (!origin) {
      this.logger.warn(
        `Requete integrateur sans Origin/Referer bloquee: ${request.ip} - ${request.url}`,
      );
      throw new ForbiddenException("Origin required");
    }

    if (!this.isAllowedOrigin(origin)) {
      this.logger.warn(
        `Origin integrateur non autorisee: ${origin} - IP: ${request.ip} - URL: ${request.url}`,
      );
      throw new ForbiddenException("Origin not allowed");
    }

    this.logger.log(`Requete integrateur autorisee depuis: ${origin}`);
    return true;
  }

  private extractOrigin(request: Request): string | null {
    // Priorite au header Origin
    const origin = request.headers.origin;
    if (origin) {
      return origin;
    }

    // Fallback sur Referer
    const referer = request.headers.referer;
    if (referer) {
      try {
        const url = new URL(referer);
        return url.origin;
      } catch {
        return null;
      }
    }

    return null;
  }

  private isAllowedOrigin(origin: string): boolean {
    // Égalité stricte sur l'origine complète (scheme + host + port).
    // Un startsWith laisserait passer les sous-domaines suffixes usurpés
    // (ex. benefriches.ademe.fr.attacker.com).
    return this.allowedOrigins.includes(origin);
  }
}
