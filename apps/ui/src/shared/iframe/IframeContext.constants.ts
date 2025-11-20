import { IntegratorConfig } from "./IframeContext.types";

// Configuration des intégrateurs autorisés
// Ajouter ici les nouveaux intégrateurs si besoin
export const INTEGRATORS: Record<string, IntegratorConfig> = {
  mutafriches: {
    name: "Mutafriches",
    allowedDomains: ["mutafriches.beta.gouv.fr", "mutafriches.incubateur.ademe.dev"],
    defaultCallbackLabel: "Retour vers Mutafriches",
  },
  benefriches: {
    name: "Bénéfriches",
    allowedDomains: ["benefriches.incubateur.ademe.dev", "benefriches.ademe.fr"],
    defaultCallbackLabel: "Retour vers Bénéfriches",
  },
  test: {
    name: "Test local",
    allowedDomains: ["localhost", "127.0.0.1"],
    defaultCallbackLabel: "Retour vers le site test",
  },
  demo: {
    name: "Démo locale",
    allowedDomains: ["localhost", "127.0.0.1", "0.0.0.0", "192.168.1.1", "10.0.0.1"],
    defaultCallbackLabel: "Retour vers le site de démo",
  },
};

// Valeurs par défaut du contexte
export const DEFAULT_IFRAME_CONTEXT = {
  isIframeMode: false,
  integrator: null,
  integratorConfig: null,
  callbackUrl: null,
  callbackLabel: null,
  parentOrigin: null,
  isReady: true,
};
