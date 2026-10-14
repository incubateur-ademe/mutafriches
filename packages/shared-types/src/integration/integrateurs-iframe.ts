// Registre des intégrateurs iframe (`/iframe?integrator=<id>`), source unique UI + API.
// L'UI s'en sert pour valider le domaine du callback ; l'API en dérive `frame-ancestors`.
// Un intégrateur qui appelle aussi l'API directement doit EN PLUS figurer dans
// ALLOWED_INTEGRATOR_ORIGINS (variable Scalingo) : cf. docs/ajout-partenaire.md.

export interface IntegrateurIframeConfig {
  name: string;
  // Hôtes (sans schéma) autorisés à embarquer l'iframe et à recevoir le callback
  allowedDomains: string[];
  defaultCallbackLabel: string;
}

export const INTEGRATEURS_IFRAME: Record<string, IntegrateurIframeConfig> = {
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
  mon_espace_collectivite: {
    name: "Mon Espace Collectivité",
    allowedDomains: [
      "monespacecollectivite.anct.gouv.fr",
      "mon-espace-collectivite-staging.osc-fr1.scalingo.io",
      "les-communs-transition-ecologique-api-staging.osc-fr1.scalingo.io",
    ],
    defaultCallbackLabel: "Retour vers Mon Espace Collectivité",
  },
  // Tests locaux des intégrateurs : hôtes locaux uniquement, pas de domaine public
  demo: {
    name: "Démo locale",
    allowedDomains: ["localhost", "127.0.0.1", "0.0.0.0", "192.168.1.1", "10.0.0.1"],
    defaultCallbackLabel: "Retour vers le site de démo",
  },
};

// Hôtes autorisés à embarquer l'iframe, tous intégrateurs confondus, dédoublonnés.
export function hotesIntegrateursIframe(): string[] {
  return [...new Set(Object.values(INTEGRATEURS_IFRAME).flatMap((c) => c.allowedDomains))];
}
