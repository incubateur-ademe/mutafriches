/** Corps de PATCH /api/partenaires/:slug/sites/:id (renommage d'un site) */
export interface RenommerSitePartenaireInputDto {
  /** Nouveau nom. Vide => réinitialise au nom par défaut. */
  nom: string;
}
