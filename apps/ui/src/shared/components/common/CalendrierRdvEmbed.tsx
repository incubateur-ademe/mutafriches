import React, { useEffect, useRef, useState } from "react";
import {
  CALENDRIER_RDV_CONFIG,
  construireParametresEmbed,
} from "../../config/calendrier-rdv.config";

type InstructionCal = unknown[];

interface FileCal {
  (...instruction: InstructionCal): void;
  q: InstructionCal[];
  ns: Record<string, unknown>;
}

declare global {
  interface Window {
    Cal?: FileCal;
  }
}

const TITRE_IFRAME = "Calendrier de prise de rendez-vous";

// `embed.js` exige une file `window.Cal.q` déjà en place à son chargement, puis exécute
// chaque instruction dès qu'elle y est poussée.
function fileCal(): FileCal {
  if (!window.Cal) {
    const cal = ((...instruction: InstructionCal): void => {
      cal.q.push(instruction);
    }) as FileCal;
    cal.q = [];
    cal.ns = {};
    window.Cal = cal;
  }
  return window.Cal;
}

let chargementScript: Promise<void> | null = null;

function chargerScriptCal(scriptUrl: string): Promise<void> {
  if (chargementScript) return chargementScript;

  fileCal();
  chargementScript = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      chargementScript = null;
      script.remove();
      reject(new Error("Script d'embed du calendrier indisponible"));
    };
    document.head.appendChild(script);
  });

  return chargementScript;
}

interface CalendrierRdvEmbedProps {
  /** Activer le rendu : le script n'est chargé que quand l'embed est visible (ex. modale ouverte) */
  active: boolean;
}

// Embed « inline » Cal.com de l'instance de l'incubateur ADEME, auto-dimensionné par son script (ADR-0056).
export const CalendrierRdvEmbed: React.FC<CalendrierRdvEmbedProps> = ({ active }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const pretRef = useRef(false);
  const [echec, setEchec] = useState(false);

  useEffect(() => {
    if (!active) return;

    const host = hostRef.current;
    if (!host) return;

    const { origine, scriptUrl, calLink, config } = construireParametresEmbed();
    let annule = false;

    const surPret = (): void => {
      pretRef.current = true;
      clearTimeout(minuteur);
      if (!annule) setEchec(false);
    };
    const surEchec = (): void => {
      if (!annule) setEchec(true);
    };

    // À la réouverture de la modale le calendrier est déjà affiché : `linkReady` ne rejouera pas.
    const minuteur = setTimeout(() => {
      if (!pretRef.current) surEchec();
    }, CALENDRIER_RDV_CONFIG.delaiAvantSecoursMs);

    void chargerScriptCal(scriptUrl)
      .then(() => {
        if (annule) return;
        const cal = fileCal();
        cal("on", { action: "linkReady", callback: surPret });
        cal("on", { action: "linkFailed", callback: surEchec });
        // L'iframe vit hors de React, qui ne possède que le conteneur vide : ne pas la recréer.
        if (host.querySelector("iframe")) return;
        cal("init", { origin: origine });
        cal("inline", { elementOrSelector: host, calLink, config });
        // Le script pose un titre anglais (« Book a call »)
        host.querySelector("iframe")?.setAttribute("title", TITRE_IFRAME);
      })
      .catch(surEchec);

    return () => {
      annule = true;
      clearTimeout(minuteur);
      window.Cal?.("off", { action: "linkReady", callback: surPret });
      window.Cal?.("off", { action: "linkFailed", callback: surEchec });
    };
  }, [active]);

  return (
    <>
      <div ref={hostRef} className="w-full" />
      {echec && (
        <div className="fr-alert fr-alert--info fr-alert--sm fr-mt-2w">
          <p>Le calendrier ne s'affiche pas ? Ouvrez-le directement via le lien ci-dessous.</p>
        </div>
      )}
      <p className="fr-mt-2w fr-mb-0">
        <a
          className="fr-link fr-text--sm"
          href={CALENDRIER_RDV_CONFIG.bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Ouvrir le calendrier dans un nouvel onglet
        </a>
      </p>
    </>
  );
};
