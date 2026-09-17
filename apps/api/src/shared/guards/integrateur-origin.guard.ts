import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from "@nestjs/common";
import { Request } from "express";
import { isDevelopment } from "../utils";
import { getAppConfig } from "../../config";

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
    const envOrigins = getAppConfig().origins.allowedIntegrators;
    const originesBrutes = envOrigins
      ? [...DEFAULT_ALLOWED_ORIGINS, ...envOrigins.split(",")]
      : DEFAULT_ALLOWED_ORIGINS;

    this.allowedOrigins = originesBrutes
      .map((origine) => this.normaliserOrigine(origine))
      .filter((origine): origine is string => origine !== null);
  }

  // Un header Origin ne porte jamais de slash final : sans normalisation, une entrée
  // configurée avec un slash ne matche jamais et l'intégrateur reçoit un 403 muet.
  private normaliserOrigine(valeur: string): string | null {
    const brute = valeur.trim().replace(/\/+$/, "");
    if (!brute) {
      return null;
    }

    let normalisee = brute;
    try {
      // new URL normalise la casse du schéma et de l'hôte, ainsi que le port par défaut.
      // Une origine opaque (file:, data:) donne la chaîne "null" : on la rejette pour ne
      // pas autoriser par accident les requêtes portant `Origin: null`.
      const origineUrl = new URL(brute).origin;
      if (origineUrl !== "null") {
        normalisee = origineUrl;
      }
    } catch {
      // Valeur non parsable : on conserve la chaîne nettoyée, la comparaison stricte tranchera.
    }

    if (normalisee !== valeur) {
      this.logger.log(`Origine intégrateur normalisée : "${valeur}" -> "${normalisee}"`);
    }

    return normalisee;
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
