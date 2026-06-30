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
  departement: string; // code département INSEE (ex : "49", "92", "2A", "971") — pas encore affiché
  storageKey: string; // clé localStorage des sites ajoutés manuellement
  sites: PartnerSite[];
  sitesByCommune: Record<string, PartnerSite[]>;
}
