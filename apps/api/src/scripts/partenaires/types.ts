// Un site à pré-chauffer : une unité foncière (mono ou multi-parcelles).
export interface SitePrefetch {
  idtup: string;
  commune: string;
  parcelles: string[];
  /** Nom fourni par le partenaire (devient le nom partagé du site au seed). */
  nom?: string;
}
