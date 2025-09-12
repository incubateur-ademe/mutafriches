import { IntegratorConfig } from "./IframeContext.types";

// Configuration des intégrateurs autorisés
// TODO: ajouter ici les intégrateurs au fur et à mesure
export const INTEGRATORS: Record<string, IntegratorConfig> = {
  mutafriches: {
    name: "Mutafriches",
    allowedDomains: ["mutafriches.beta.gouv.fr", "mutafriches.incubateur.ademe.dev"],
    defaultCallbackLabel: "Retour vers Mutafriches",
  },
  benefriches: {
    name: "Bénéfriches",
    allowedDomains: ["benefriches.fr", "www.benefriches.fr"],
    defaultCallbackLabel: "Retour vers Bénéfriches",
  },
  test: {
    name: "Test Local",
    allowedDomains: ["localhost", "127.0.0.1"],
    defaultCallbackLabel: "Retour vers le site test",
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
};
