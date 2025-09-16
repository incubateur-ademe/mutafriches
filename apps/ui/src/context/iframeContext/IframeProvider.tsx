import React, { useMemo } from "react";
import { DEFAULT_IFRAME_CONTEXT, INTEGRATORS } from "./IframeContext.constants";
import { IframeContext } from "./IframeContext";

interface IframeProviderProps {
  children: React.ReactNode;
}

export function IframeProvider({ children }: IframeProviderProps) {
  // Extraction et validation des paramètres de l'URL
  const contextValue = useMemo(() => {
    // Si on n'est pas dans le browser, retourner les valeurs par défaut
    if (typeof window === "undefined") {
      return DEFAULT_IFRAME_CONTEXT;
    }

    const params = new URLSearchParams(window.location.search);

    // Récupération des paramètres
    const integratorParam = params.get("integrator");
    const callbackUrl = params.get("callbackUrl");
    const callbackLabel = params.get("callbackLabel");

    const inIframe = window.self !== window.top;

    // Si pas d'intégrateur, on est en mode standalone
    if (!integratorParam) {
      return DEFAULT_IFRAME_CONTEXT;
    }

    // Validation de l'intégrateur
    const integratorConfig = INTEGRATORS[integratorParam] || null;

    if (!integratorConfig) {
      console.error(`Intégrateur non reconnu: ${integratorParam}`);
      return {
        ...DEFAULT_IFRAME_CONTEXT,
        isIframeMode: true,
        integrator: integratorParam,
        callbackLabel,
        callbackUrl,
      };
    }

    // Validation de l'URL de callback
    let parentOrigin: string | null = null;
    let validCallbackUrl: string | null = null;

    if (callbackUrl) {
      try {
        const url = new URL(callbackUrl);
        parentOrigin = url.origin;
        validCallbackUrl = callbackUrl;

        // Validation du domaine
        const hostname = url.hostname;
        const isAllowedDomain = integratorConfig.allowedDomains.some((domain) => {
          // Support des wildcards simples
          if (domain.startsWith("*.")) {
            const baseDomain = domain.slice(2);
            return hostname.endsWith(baseDomain);
          }
          return hostname === domain;
        });

        if (!isAllowedDomain) {
          console.error(
            `Domaine non autorisé pour ${integratorParam}: ${hostname}`,
            `Domaines autorisés: ${integratorConfig.allowedDomains.join(", ")}`,
          );
          return DEFAULT_IFRAME_CONTEXT;
        }

        // Vérification HTTPS en production
        if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
          console.error("L'URL de callback doit utiliser HTTPS en production");
          return DEFAULT_IFRAME_CONTEXT;
        }

        if (process.env.NODE_ENV === "development") {
          console.warn("Mode développement: validation du domaine ignorée");
        } else {
          return DEFAULT_IFRAME_CONTEXT;
        }
      } catch (error) {
        console.error("URL de callback invalide:", callbackUrl, error);
        return DEFAULT_IFRAME_CONTEXT;
      }
    }

    // Utilisation du label par défaut si non fourni
    const finalCallbackLabel = callbackLabel || integratorConfig.defaultCallbackLabel;

    const result = {
      isIframeMode: true,
      integrator: integratorParam,
      integratorConfig,
      callbackUrl: validCallbackUrl,
      callbackLabel: finalCallbackLabel,
      parentOrigin,
    };

    // Log en développement
    if (process.env.NODE_ENV === "development") {
      console.log("IframeContext initialized:", {
        ...result,
        inActualIframe: inIframe,
        urlParams: params.toString(),
      });
    }

    return result;
  }, []);

  return <IframeContext.Provider value={contextValue}>{children}</IframeContext.Provider>;
}
