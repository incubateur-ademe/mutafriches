import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useIsIframeMode } from "../../iframe/useIframe";

/**
 * Composant qui gère le scroll vers le haut lors des changements de page.
 * En mode iframe, le scroll est désactivé car c'est la page parente qui gère le défilement.
 */
export const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  const isIframeMode = useIsIframeMode();

  useEffect(() => {
    // En mode iframe, ne pas gérer le scroll (c'est la page parente qui le fait)
    if (isIframeMode) {
      return;
    }

    // Scroll immédiat vers le haut de la page
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname, isIframeMode]);

  return null;
};
