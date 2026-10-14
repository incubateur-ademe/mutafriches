import { INTEGRATEURS_IFRAME } from "@mutafriches/shared-types";

// Registre des intégrateurs : packages/shared-types/src/integration/integrateurs-iframe.ts
export const INTEGRATORS = INTEGRATEURS_IFRAME;

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
