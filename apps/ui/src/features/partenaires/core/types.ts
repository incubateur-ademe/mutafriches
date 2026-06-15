// Types partagés des pages partenaires multisites.

export interface PartnerParcelle {
  idpar: string;
  commune: string;
  idtup: string;
}

export interface PartnerSite {
  idtup: string;
  commune: string;
  parcelles: string[];
  nom?: string; // libellé d'affichage (défaut : idtup). Utile pour les sites multi-parcelles.
}

// Descripteur d'un partenaire : porte tout le spécifique (libellés, data, storage).
export interface PartnerConfig {
  slug: string; // segment d'URL : /partenaires/:slug
  nom: string; // titre de la page et de la carte sur le hub
  description: string; // texte de la carte sur le hub
  sousTitre: string; // sous-titre affiché en tête de page
  sidemenuTitre: string; // titre de la liste latérale des sites
  storageKey: string; // clé localStorage des sites ajoutés manuellement
  sites: PartnerSite[];
  sitesByCommune: Record<string, PartnerSite[]>;
}
