import { Injectable, Logger } from "@nestjs/common";
import * as jwt from "jsonwebtoken";
import { getAppConfig } from "../config";

@Injectable()
export class MetabaseService {
  private readonly logger = new Logger(MetabaseService.name);

  private readonly siteUrl: string | undefined;
  private readonly secretKey: string | undefined;
  private readonly dashboardId: number;

  constructor() {
    const metabase = getAppConfig().metabase;
    this.siteUrl = metabase.siteUrl;
    this.secretKey = metabase.secretKey;
    this.dashboardId = metabase.dashboardId;

    if (!this.isConfigured()) {
      this.logger.warn(
        "Metabase non configure : METABASE_SITE_URL et/ou METABASE_SECRET_KEY manquants",
      );
    }
  }

  /**
   * Verifie que les variables d'environnement Metabase sont presentes.
   */
  isConfigured(): boolean {
    return Boolean(this.siteUrl) && Boolean(this.secretKey);
  }

  /**
   * Genere une URL d'embedding Metabase signee par JWT.
   * Le token expire apres 10 minutes.
   */
  generateEmbedUrl(): string {
    if (!this.siteUrl || !this.secretKey) {
      throw new Error("Metabase non configure");
    }

    const payload = {
      resource: { dashboard: this.dashboardId },
      params: {},
      exp: Math.round(Date.now() / 1000) + 10 * 60, // 10 minutes
    };

    const token = jwt.sign(payload, this.secretKey);

    return `${this.siteUrl}/embed/dashboard/${token}#bordered=true&titled=true`;
  }
}
