// Types pour le contexte iframe

export interface IntegratorConfig {
  name: string;
  allowedDomains: string[];
  defaultCallbackLabel: string;
}

export interface IframeContextValue {
  // Mode iframe activé ou non
  isIframeMode: boolean;

  // Identifiant de l'intégrateur
  integrator: string | null;

  // Configuration de l'intégrateur
  integratorConfig: IntegratorConfig | null;

  // URL de callback où renvoyer l'utilisateur
  callbackUrl: string | null;

  // Label du bouton de callback
  callbackLabel: string | null;

  // Domaine parent autorisé pour postMessage
  parentOrigin: string | null;
}
