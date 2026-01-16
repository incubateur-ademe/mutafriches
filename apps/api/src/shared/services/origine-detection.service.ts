import { Injectable } from "@nestjs/common";
import { Request } from "express";
import { OrigineUtilisation, SourceUtilisation } from "@mutafriches/shared-types";

/**
 * Service de détection de l'origine des appels API
 *
 * Detecte automatiquement si l'appel provient de :
 * - SITE_STANDALONE : Front React mutafriches.beta.gouv.fr
 * - IFRAME_INTEGREE : Front embarque dans un site partenaire
 * - API_DIRECTE : Appel direct par un consommateur de l'API
 */
@Injectable()
export class OrigineDetectionService {
  private readonly domainesStandalone = [
    "localhost",
    "127.0.0.1",
    "mutafriches.beta.gouv.fr",
    "mutafriches.incubateur.ademe.dev",
  ];

  /**
   * Detecte l'origine de l'appel API
   *
   * Logique de detection :
   * 1. Si query param iframe=true -> IFRAME_INTEGREE
   * 2. Si pas de request -> API_DIRECTE
   * 3. Si referer contient /api -> API_DIRECTE
   * 4. Si referer/origin depuis domaine standalone -> SITE_STANDALONE
   * 5. Si referer/origin depuis autre domaine -> IFRAME_INTEGREE
   * 6. Sinon -> API_DIRECTE
   *
   * @param req - Request Express (optionnel)
   * @param isIframe - Query param iframe (optionnel)
   * @param integrateur - Query param integrateur (optionnel)
   */
  detecterOrigine(req?: Request, isIframe?: boolean, integrateur?: string): OrigineUtilisation {
    // 1. Si iframe=true en query param, forcer le mode iframe
    const iframeMode = String(isIframe) === "true";
    if (iframeMode) {
      return {
        source: SourceUtilisation.IFRAME_INTEGREE,
        integrateur: integrateur || "unknown",
      };
    }

    // 2. Sans request, on considere que c'est un appel API direct
    if (!req) {
      return { source: SourceUtilisation.API_DIRECTE };
    }

    // 3. Extraire le referrer ou origin
    const referrer = this.extractReferrer(req);

    // 4. Si pas de referrer mais origin present
    if (!referrer && req.headers["origin"]) {
      const origin = req.headers["origin"] as string;
      return this.detectFromUrl(origin);
    }

    // 5. Si le referrer contient /api -> appel API direct
    if (referrer && (referrer.includes("/api") || referrer.endsWith("/api"))) {
      return { source: SourceUtilisation.API_DIRECTE };
    }

    // 6. Detecter depuis le referrer
    if (referrer) {
      const origine = this.detectFromUrl(referrer);
      // Ne pas retourner IFRAME si c'est un domaine standalone avec /api
      if (origine.source === SourceUtilisation.SITE_STANDALONE && referrer.includes("/api")) {
        return { source: SourceUtilisation.API_DIRECTE };
      }
      return origine;
    }

    // 7. Par defaut -> API directe
    return { source: SourceUtilisation.API_DIRECTE };
  }

  /**
   * Detecte l'origine depuis une URL (referrer ou origin)
   */
  private detectFromUrl(url: string): OrigineUtilisation {
    const isStandalone = this.domainesStandalone.some((domain) => url.includes(domain));

    if (isStandalone) {
      return { source: SourceUtilisation.SITE_STANDALONE };
    }

    return {
      source: SourceUtilisation.IFRAME_INTEGREE,
      integrateur: this.extraireIntegrateur(url),
    };
  }

  /**
   * Extrait le referrer depuis les headers de la requete
   */
  private extractReferrer(req: Request): string | undefined {
    const referrer = req.headers["referer"] || req.headers["referrer"] || req.headers["origin"];
    if (!referrer) return undefined;
    return typeof referrer === "string" ? referrer : undefined;
  }

  /**
   * Extrait le hostname d'une URL pour identifier l'integrateur
   */
  private extraireIntegrateur(url: string): string | undefined {
    if (!url) return undefined;
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.hostname;
    } catch {
      return undefined;
    }
  }
}
