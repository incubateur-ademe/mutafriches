import React, { useEffect, useRef, useState } from "react";
import { ZCAL_CONFIG, construireUrlIframeZcal } from "../../config/zcal.config";

/** Chargement unique du script : `embed.js` est gardé par `window.zcal` et ne scanne le DOM qu'une fois. */
let chargementScript: Promise<void> | null = null;

function chargerScriptZcal(): Promise<void> {
  if (chargementScript) return chargementScript;

  chargementScript = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = ZCAL_CONFIG.embedScriptUrl;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      chargementScript = null;
      reject(new Error("Script d'embed ZCal indisponible"));
    };
    document.body.appendChild(script);
  });

  return chargementScript;
}

function construireIframe(): HTMLIFrameElement {
  const iframe = document.createElement("iframe");
  iframe.src = construireUrlIframeZcal();
  iframe.title = "Calendrier de prise de rendez-vous";
  iframe.width = "100%";
  iframe.height = String(ZCAL_CONFIG.hauteurSecoursPx);
  iframe.loading = "eager";
  iframe.style.border = "0";
  return iframe;
}

interface ZcalEmbedProps {
  /** Activer le rendu : le script n'est chargé que quand l'embed est visible (ex. modale ouverte) */
  active: boolean;
}

/**
 * Embed ZCal officiel (version JavaScript responsive), dont le cycle de vie est repris
 * à la main : le script pose une iframe `loading="lazy"` que Firefox ne charge pas dans
 * le conteneur scrollable d'une modale, et sa garde `window.zcal` l'empêche de rescanner
 * le DOM après le premier passage. Cf. ADR-0031.
 */
export const ZcalEmbed: React.FC<ZcalEmbedProps> = ({ active }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const [echec, setEchec] = useState(false);

  useEffect(() => {
    if (!active) return;

    const host = hostRef.current;
    if (!host) return;

    // L'effet doit être idempotent : il rejoue au double montage StrictMode et à la
    // réouverture de la modale, où le widget est déjà construit.
    let conteneur = host.querySelector<HTMLDivElement>(".zcal-inline-widget");
    if (!conteneur) {
      // Le script remplace son ancre par `replaceChild` : on la crée hors de React,
      // qui ne possède que le conteneur vide.
      conteneur = document.createElement("div");
      conteneur.className = "zcal-inline-widget";
      const nouvelleAncre = document.createElement("a");
      nouvelleAncre.href = ZCAL_CONFIG.bookingUrl;
      nouvelleAncre.textContent = "Choisir un créneau avec l'équipe Mutafriches";
      conteneur.appendChild(nouvelleAncre);
      host.appendChild(conteneur);
    }
    const cible = conteneur;

    let annule = false;
    let minuteur: ReturnType<typeof setTimeout> | undefined;

    const surIframe = (iframe: HTMLIFrameElement): void => {
      // Repasser en `eager` reprend la navigation suspendue par le lazy loading.
      iframe.loading = "eager";
      iframe.addEventListener("load", () => {
        if (minuteur) clearTimeout(minuteur);
        if (!annule) setEchec(false);
      });
    };

    const observateur = new MutationObserver(() => {
      const iframe = cible.querySelector("iframe");
      if (!iframe) return;
      observateur.disconnect();
      surIframe(iframe);
    });

    const iframeExistante = cible.querySelector("iframe");
    if (iframeExistante) {
      surIframe(iframeExistante);
    } else {
      observateur.observe(cible, { childList: true, subtree: true });
      minuteur = setTimeout(() => {
        if (!annule) setEchec(true);
      }, ZCAL_CONFIG.delaiAvantSecoursMs);
    }

    void chargerScriptZcal()
      .then(() => {
        if (annule) return;
        const ancre = cible.querySelector("a");
        // L'ancre est intacte après exécution du script : il avait déjà scanné le DOM
        // lors d'un montage précédent et ne la traitera pas. On pose l'iframe nous-mêmes.
        if (ancre) {
          const iframe = construireIframe();
          observateur.disconnect();
          cible.replaceChild(iframe, ancre);
          surIframe(iframe);
        }
      })
      .catch(() => {
        if (!annule) setEchec(true);
      });

    return () => {
      annule = true;
      observateur.disconnect();
      if (minuteur) clearTimeout(minuteur);
    };
  }, [active]);

  return (
    <>
      <div ref={hostRef} />
      {echec && (
        <div className="fr-alert fr-alert--info fr-alert--sm fr-mt-2w">
          <p>Le calendrier ne s'affiche pas ? Ouvrez-le directement via le lien ci-dessous.</p>
        </div>
      )}
      {/* Lien hors du conteneur remplacé par le script : reste disponible en toute circonstance */}
      <p className="fr-mt-2w fr-mb-0">
        <a
          className="fr-link fr-text--sm"
          href={ZCAL_CONFIG.bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Ouvrir le calendrier dans un nouvel onglet
        </a>
      </p>
    </>
  );
};
