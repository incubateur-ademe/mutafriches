/**
 * Statuts d'enrichissement
 */
export enum StatutEnrichissement {
  SUCCES = "succes",
  PARTIEL = "partiel",
  ECHEC = "echec",
}

/**
 * Codes d'erreur d'enrichissement
 */
export enum CodeErreurEnrichissement {
  CADASTRE_INTROUVABLE = "CADASTRE_INTROUVABLE",
  CADASTRE_API_ERROR = "CADASTRE_API_ERROR",
  BDNB_API_ERROR = "BDNB_API_ERROR",
  ENEDIS_API_ERROR = "ENEDIS_API_ERROR",
  TRANSPORT_API_ERROR = "TRANSPORT_API_ERROR",
  OVERPASS_API_ERROR = "OVERPASS_API_ERROR",
  LOVAC_API_ERROR = "LOVAC_API_ERROR",
  ENRICHISSEMENT_FAILED = "ENRICHISSEMENT_FAILED",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
  GEORISQUES_RGA_ERROR = "GEORISQUES_RGA_ERROR",
}

/**
 * Messages d'erreur associés aux codes
 */
export const MessagesErreurEnrichissement: Record<CodeErreurEnrichissement, string> = {
  [CodeErreurEnrichissement.CADASTRE_INTROUVABLE]:
    "Données cadastrales introuvables pour cet identifiant",
  [CodeErreurEnrichissement.CADASTRE_API_ERROR]: "Erreur lors de l'appel à l'API Cadastre",
  [CodeErreurEnrichissement.BDNB_API_ERROR]: "Erreur lors de l'appel à l'API BDNB",
  [CodeErreurEnrichissement.ENEDIS_API_ERROR]: "Erreur lors de l'appel à l'API Enedis",
  [CodeErreurEnrichissement.TRANSPORT_API_ERROR]: "Erreur lors de l'appel à l'API Transport",
  [CodeErreurEnrichissement.OVERPASS_API_ERROR]: "Erreur lors de l'appel à l'API Overpass",
  [CodeErreurEnrichissement.LOVAC_API_ERROR]: "Erreur lors de l'appel à l'API Lovac",
  [CodeErreurEnrichissement.ENRICHISSEMENT_FAILED]: "Échec général de l'enrichissement",
  [CodeErreurEnrichissement.UNKNOWN_ERROR]: "Erreur inconnue lors de l'enrichissement",
  [CodeErreurEnrichissement.GEORISQUES_RGA_ERROR]: "Erreur lors de l'appel à l'API GeoRisques RGA",
};

/**
 * Noms des sources d'enrichissement
 */
export enum SourceEnrichissement {
  CADASTRE = "Cadastre",
  BDNB = "BDNB",
  BDNB_SURFACE_BATIE = "BDNB-SurfaceBatie",
  BDNB_RISQUES = "BDNB-Risques",
  ENEDIS_RACCORDEMENT = "Enedis-Raccordement",
  TRANSPORT = "Transport",
  OVERPASS = "Overpass",
  OVERPASS_TEMPORAIRE = "Overpass-Temporaire",
  LOVAC = "Lovac",
  LOVAC_TEMPORAIRE = "Lovac-Temporaire",
  DONNEES_TEMPORAIRES = "Données-Temporaires",
  GEORISQUES_RGA = "GeoRisques-RGA",
  GEORISQUES_CATNAT = "GeoRisques-CatNat",
}
