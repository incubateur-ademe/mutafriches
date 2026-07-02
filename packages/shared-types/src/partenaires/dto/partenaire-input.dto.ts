/** Corps de PATCH /api/partenaires/:slug/sites/:id (renommage d'un site) */
export interface RenommerSitePartenaireInputDto {
  /** Nouveau nom. Vide => réinitialise au nom par défaut. */
  nom: string;
}

/** Corps de POST /api/partenaires/:slug/sites (ajout d'un site) */
export interface AjouterSitePartenaireInputDto {
  /** Identifiants cadastraux (IDU) du site, 1 à 20. */
  parcelles: string[];
}
