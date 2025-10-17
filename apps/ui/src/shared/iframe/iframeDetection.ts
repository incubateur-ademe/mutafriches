/**
 * Détecte si l'application s'exécute dans une iframe
 */
export const isRunningInIframe = (): boolean => {
  try {
    return window.self !== window.top;
  } catch (e) {
    console.warn("Détection iframe échouée, probablement à cause de CORS:", e);
    return true;
  }
};

/**
 * Essaie d'extraire le domaine parent quand on est en iframe
 */
export const getParentDomain = (): string | null => {
  if (!isRunningInIframe()) {
    return null;
  }

  // 1. Essayer document.referrer
  if (document.referrer) {
    try {
      const url = new URL(document.referrer);
      return url.hostname;
    } catch (e) {
      console.warn("Impossible de parser document.referrer:", e);
    }
  }

  // 2. Essayer window.parent.location
  try {
    return window.parent.location.hostname;
  } catch (e) {
    // Erreur CORS attendue, on continue
    console.warn("Détection iframe échouée, probablement à cause de CORS:", e);
  }

  // 3. Si tout échoue, retourner "unknown"
  return "unknown";
};

/**
 * Structure les informations iframe pour l'API
 */
export interface IframeInfo {
  isIframe: boolean;
  integrateur?: string;
}

export const getIframeInfo = (): IframeInfo => {
  const isIframe = isRunningInIframe();

  if (!isIframe) {
    return { isIframe: false };
  }

  return {
    isIframe: true,
    integrateur: getParentDomain() || "unknown",
  };
};
