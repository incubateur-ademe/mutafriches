/* eslint-disable no-console */
import { useEffect, useState, ReactNode } from "react";
import { DsfrContext } from "./DsfrContext";

interface DsfrProviderProps {
  children: ReactNode;
}

// Déclaration globale avec types optionnels pour la configuration
declare global {
  interface Window {
    dsfr?: {
      start?: () => void;
      stop?: () => void;
      verbose?: boolean;
      mode?: string;
      production?: boolean;
    };
  }
}

export function DsfrProvider({ children }: DsfrProviderProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Configuration du DSFR pour React
    window.dsfr = {
      mode: "manual", // Mode manuel pour React
      verbose: import.meta.env.DEV as boolean,
      production: import.meta.env.PROD as boolean,
    };

    // Attendre que le DSFR soit chargé (scripts dans index.html)
    const checkDsfr = setInterval(() => {
      if (window.dsfr && typeof window.dsfr.start === "function") {
        clearInterval(checkDsfr);
        window.dsfr.start();
        setIsReady(true);
        console.log("DSFR initialized");
      }
    }, 100);

    // Timeout de sécurité
    const timeout = setTimeout(() => {
      clearInterval(checkDsfr);
      console.warn("DSFR failed to initialize after 5 seconds");
    }, 5000);

    // Cleanup
    return () => {
      clearInterval(checkDsfr);
      clearTimeout(timeout);
      if (window.dsfr && typeof window.dsfr.stop === "function") {
        window.dsfr.stop();
      }
    };
  }, []);

  return <DsfrContext.Provider value={{ isReady }}>{children}</DsfrContext.Provider>;
}
