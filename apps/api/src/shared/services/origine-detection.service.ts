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
   * Détecte l'origine de l'appel API
   *
   * Logique de détection :
   * 1. Si query param iframe=true -> IFRAME_INTEGREE (prioritaire)
   * 2. Sinon, détection auto depuis referer/origin (API_DIRECTE / SITE_STANDALONE / IFRAME)
   * 3. Contexte page partenaire (query param partenaire=<slug>) : uniquement si la source
   *    détectée est SITE_STANDALONE, tague integrateur = 'partenaire:<slug>'.
   *
   * @param req - Request Express (optionnel)
   * @param isIframe - Query param iframe (optionnel)
   * @param integrateur - Query param integrateur (optionnel, mode iframe)
   * @param partenaire - Query param partenaire : slug d'une page partenaire (optionnel)
   */
  detecterOrigine(
    req?: Request,
    isIframe?: boolean,
    integrateur?: string,
    partenaire?: string,
  ): OrigineUtilisation {
    // 1. Si iframe=true en query param, forcer le mode iframe (prioritaire)
    const iframeMode = String(isIframe) === "true";
    if (iframeMode) {
      return {
        source: SourceUtilisation.IFRAME_INTEGREE,
        integrateur: integrateur || "unknown",
      };
    }

    // 2. Détection automatique depuis la requête
    const origine = this.detecterOrigineAuto(req);

    // 3. Contexte page partenaire : uniquement si l'origine détectée est le site standalone
    // (les pages partenaires y vivent). On évite ainsi qu'un appel API_DIRECTE ou iframe
    // usurpe le canal via un simple query param. Seul l'intégrateur est tagué, source conservée.
    const slug = this.normaliserSlugPartenaire(partenaire);
    if (slug && origine.source === SourceUtilisation.SITE_STANDALONE) {
      return { ...origine, integrateur: `partenaire:${slug}` };
    }

    return origine;
  }

  /**
   * Détection automatique de la source depuis le referer/origin de la requête.
   */
  private detecterOrigineAuto(req?: Request): OrigineUtilisation {
    // Sans request, on considere que c'est un appel API direct
    if (!req) {
      return { source: SourceUtilisation.API_DIRECTE };
    }

    // Extraire le referrer ou origin
    const referrer = this.extractReferrer(req);

    // Si pas de referrer mais origin present
    if (!referrer && req.headers["origin"]) {
      const origin = req.headers["origin"] as string;
      return this.detectFromUrl(origin);
    }

    // Si le referrer contient /api -> appel API direct
    if (referrer && (referrer.includes("/api") || referrer.endsWith("/api"))) {
      return { source: SourceUtilisation.API_DIRECTE };
    }

    // Detecter depuis le referrer
    if (referrer) {
      const origine = this.detectFromUrl(referrer);
      // Ne pas retourner IFRAME si c'est un domaine standalone avec /api
      if (origine.source === SourceUtilisation.SITE_STANDALONE && referrer.includes("/api")) {
        return { source: SourceUtilisation.API_DIRECTE };
      }
      return origine;
    }

    // Par defaut -> API directe
    return { source: SourceUtilisation.API_DIRECTE };
  }

  /**
   * Valide et normalise un slug de partenaire (defense contre l'injection dans la
   * colonne integrateur). Retourne null si absent ou format invalide.
   */
  private normaliserSlugPartenaire(partenaire?: string): string | null {
    if (!partenaire) return null;
    const slug = partenaire.trim().toLowerCase();
    return /^[a-z0-9-]{1,40}$/.test(slug) ? slug : null;
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
