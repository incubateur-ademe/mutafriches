import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from "@nestjs/common";
import { Request } from "express";
import { isDevelopment } from "../../shared/utils";

/**
 * Guard pour les evenements (tracking interne)
 * N'autorise QUE les origines Mutafriches (prod + staging)
 * Localhost est autorise uniquement en mode developpement
 */
const MUTAFRICHES_ORIGINS = [
  "https://mutafriches.beta.gouv.fr",
  "https://mutafriches.incubateur.ademe.dev",
];

@Injectable()
export class OriginGuard implements CanActivate {
  private readonly logger = new Logger(OriginGuard.name);
  private readonly allowedOrigins: string[];

  constructor() {
    const envOrigins = process.env.ALLOWED_ORIGINS;
    if (envOrigins) {
      this.allowedOrigins = envOrigins.split(",").map((o) => o.trim());
    } else {
      // En developpement, autoriser aussi localhost
      this.allowedOrigins = isDevelopment()
        ? [...MUTAFRICHES_ORIGINS, "http://localhost:5173"]
        : MUTAFRICHES_ORIGINS;
    }
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const origin = this.extractOrigin(request);

    if (!origin) {
      this.logger.warn(`Requete sans Origin/Referer bloquee: ${request.ip} - ${request.url}`);
      throw new ForbiddenException("Origin required");
    }

    if (!this.isAllowedOrigin(origin)) {
      this.logger.warn(`Origin non autorisee: ${origin} - IP: ${request.ip}`);
      throw new ForbiddenException("Origin not allowed");
    }

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
    return this.allowedOrigins.includes(origin);
  }
}
