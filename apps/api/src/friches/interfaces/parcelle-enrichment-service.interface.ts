import { EnrichmentResultDto } from "../dto/enrichment-result.dto";

export interface IParcelleEnrichmentService {
  /**
   * Enrichit une parcelle depuis toutes les sources externes disponibles
   * @param identifiantParcelle Identifiant de la parcelle à enrichir
   * @returns Promise<EnrichmentResultDto> Résultat de l'enrichissement avec parcelle enrichie, sources utilisées, champs manquants et indice de fiabilité
   */
  enrichFromDataSources(identifiantParcelle: string): Promise<EnrichmentResultDto>;
}
