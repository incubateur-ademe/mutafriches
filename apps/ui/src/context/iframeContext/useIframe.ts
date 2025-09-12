import { useContext } from "react";
import { IframeContextValue } from "./IframeContext.types";
import { IframeContext } from "./IframeContext";

// Hook principal pour utiliser le contexte iframe
export function useIframe(): IframeContextValue {
  const context = useContext(IframeContext);

  if (!context) {
    throw new Error("useIframe must be used within IframeProvider");
  }

  return context;
}

// Hook pour vérifier rapidement si on est en mode iframe
export function useIsIframeMode(): boolean {
  const { isIframeMode } = useIframe();
  return isIframeMode;
}

// Hook pour récupérer les infos de callback
export function useIframeCallback(): {
  hasCallback: boolean;
  callbackUrl: string | null;
  callbackLabel: string | null;
} {
  const { callbackUrl, callbackLabel } = useIframe();

  return {
    hasCallback: !!callbackUrl,
    callbackUrl,
    callbackLabel,
  };
}

// Hook pour récupérer les infos de l'intégrateur
export function useIntegrator(): {
  integrator: string | null;
  integratorName: string | null;
} {
  const { integrator, integratorConfig } = useIframe();

  return {
    integrator,
    integratorName: integratorConfig?.name || null,
  };
}
