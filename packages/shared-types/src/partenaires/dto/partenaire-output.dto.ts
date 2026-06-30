/** Origine d'un site partenaire */
export type OrigineSitePartenaire = "seed" | "custom";

/** Un site (unité foncière) d'un partenaire */
export interface PartenaireSiteOutputDto {
  id: string;
  idtup: string;
  parcelles: string[];
  commune: string;
  codeInsee?: string;
  /** Nom éditable. Absent => utiliser nomDefaut */
  nom?: string;
  /** Nom par défaut (rue la plus proche) */
  nomDefaut?: string;
  origine: OrigineSitePartenaire;
}

/** Métadonnées d'un partenaire + ses sites (GET /api/partenaires/:slug) */
export interface PartenaireOutputDto {
  slug: string;
  nom: string;
  description: string;
  departement: string;
  sites: PartenaireSiteOutputDto[];
}
