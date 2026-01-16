import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from "@nestjs/common";
import { Request } from "express";
import { isDevelopment } from "../utils";

// Domaines autorises par defaut pour les integrateurs
// Correspond à la liste des domaines de chacun des integrateurs connus
const DEFAULT_ALLOWED_ORIGINS = [
  // Self - Mutafriches
  "https://mutafriches.beta.gouv.fr",
  "https://mutafriches.incubateur.ademe.dev",

  // Bénéfriches
  "https://benefriches.incubateur.ademe.dev",
  "https://benefriches.ademe.fr",
];

@Injectable()
export class IntegrateurOriginGuard implements CanActivate {
  private readonly logger = new Logger(IntegrateurOriginGuard.name);
  private readonly allowedOrigins: string[];

  constructor() {
    const envOrigins = process.env.ALLOWED_INTEGRATOR_ORIGINS;
    this.allowedOrigins = envOrigins
      ? [...DEFAULT_ALLOWED_ORIGINS, ...envOrigins.split(",").map((o) => o.trim())]
      : DEFAULT_ALLOWED_ORIGINS;
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
    return this.allowedOrigins.some((allowed) => origin === allowed || origin.startsWith(allowed));
  }
}
