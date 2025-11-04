import { CodeErreurEnrichissement } from "../enums/code-erreur.enum";
import { SourceEnrichissement } from "../enums/source.enum";

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
 * Helper pour vérifier si une source est utilisée
 */
export const hasSource = (sources: string[], sourceEnum: SourceEnrichissement): boolean => {
  return sources.includes(sourceEnum);
};

/**
 * Helper pour grouper les sources GeoRisques
 */
export const hasGeoRisquesData = (sources: string[]): boolean => {
  return sources.some((s) => s.startsWith("GeoRisques-"));
};
