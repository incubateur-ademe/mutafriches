import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from "@nestjs/common";
import { Request } from "express";

const DEFAULT_ALLOWED_ORIGINS = [
  "https://mutafriches.beta.gouv.fr",
  "https://mutafriches.incubateur.ademe.dev",
  "http://localhost:5173",
];

@Injectable()
export class OriginGuard implements CanActivate {
  private readonly logger = new Logger(OriginGuard.name);
  private readonly allowedOrigins: string[];

  constructor() {
    const envOrigins = process.env.ALLOWED_ORIGINS;
    this.allowedOrigins = envOrigins
      ? envOrigins.split(",").map((o) => o.trim())
      : DEFAULT_ALLOWED_ORIGINS;
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
