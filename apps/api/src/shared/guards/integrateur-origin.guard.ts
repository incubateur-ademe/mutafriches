import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from "@nestjs/common";
import { Request } from "express";
import { isDevelopment, normaliserOrigine } from "../utils";
import { IntegrateursRegistreService } from "../../integrateurs/integrateurs-registre.service";

// Les origines autorisées viennent du registre des intégrateurs (table `integrateurs`,
// ADR-0055) : les nôtres, codées, et celles des intégrateurs API et QGIS déclarés.
@Injectable()
export class IntegrateurOriginGuard implements CanActivate {
  private readonly logger = new Logger(IntegrateurOriginGuard.name);

  constructor(private readonly registre: IntegrateursRegistreService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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

    if (!(await this.isAllowedOrigin(origin))) {
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

  private isAllowedOrigin(origin: string): Promise<boolean> {
    // Égalité stricte sur l'origine complète (scheme + host + port), après la même
    // normalisation qu'à la déclaration. Un startsWith laisserait passer les sous-domaines
    // suffixes usurpés (ex. benefriches.ademe.fr.attacker.com).
    return this.registre.estOrigineAutorisee(normaliserOrigine(origin) ?? origin);
  }
}
