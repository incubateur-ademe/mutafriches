import { Injectable, Logger } from "@nestjs/common";
import { SourceEnrichissement } from "@mutafriches/shared-types";
import { ApiCartoGpuService } from "../../../adapters/api-carto/gpu/api-carto-gpu.service";
import { ParcelleGeometry } from "../../shared/geometry.types";
import { EnrichmentResult } from "../../shared/enrichissement.types";
import { ZonageReglementaireCalculator } from "./zonage-reglementaire.calculator";
import {
  EvaluationZonageReglementaire,
  ResultatZoneUrba,
  ResultatSecteurCC,
  InfoCommune,
} from "./zonage-reglementaire.types";

/**
 * Service d'enrichissement du sous-domaine Zonage Réglementaire
 *
 * Responsabilités :
 * - Appeler les APIs API Carto GPU (zone-urba, secteur-cc, municipality) en parallèle
 * - Transformer les réponses API en résultats structurés
 * - Utiliser le calculator pour évaluer le zonage final
 */
@Injectable()
export class ZonageReglementaireService {
  private readonly logger = new Logger(ZonageReglementaireService.name);

  constructor(
    private readonly apiCartoGpuService: ApiCartoGpuService,
    private readonly calculator: ZonageReglementaireCalculator,
  ) {}

  /**
   * Enrichit avec le zonage réglementaire
   *
   * @param geometry - Géométrie de la parcelle
   * @param codeInsee - Code INSEE de la commune
   * @returns Résultat de l'enrichissement et évaluation détaillée
   */
  async enrichir(
    geometry: ParcelleGeometry,
    codeInsee: string,
  ): Promise<{
    result: EnrichmentResult;
    evaluation: EvaluationZonageReglementaire;
  }> {
    const sourcesUtilisees: string[] = [];
    const sourcesEchouees: string[] = [];

    // Appeler les APIs en parallèle
    const [zoneUrbaResult, secteurCCResult, communeResult] = await Promise.allSettled([
      this.getZoneUrba(geometry),
      this.getSecteurCC(geometry),
      this.getCommune(codeInsee),
    ]);

    // Traiter les résultats
    let zoneUrbaData: ResultatZoneUrba | null = null;
    let secteurCCData: ResultatSecteurCC | null = null;
    let communeData: InfoCommune | null = null;

    // 1. Traiter zone-urba (PLU)
    if (zoneUrbaResult.status === "fulfilled" && zoneUrbaResult.value) {
      zoneUrbaData = zoneUrbaResult.value;
      sourcesUtilisees.push(SourceEnrichissement.API_CARTO_GPU);
      this.logger.debug(
        `Zone-urba: ${zoneUrbaData.present ? `${zoneUrbaData.typezone} - ${zoneUrbaData.libelle}` : "aucune"}`,
      );
    } else {
      sourcesEchouees.push(SourceEnrichissement.API_CARTO_GPU);
    }

    // 2. Traiter secteur-cc (carte communale)
    if (secteurCCResult.status === "fulfilled" && secteurCCResult.value) {
      secteurCCData = secteurCCResult.value;
      if (!sourcesUtilisees.includes(SourceEnrichissement.API_CARTO_GPU)) {
        sourcesUtilisees.push(SourceEnrichissement.API_CARTO_GPU);
      }
      this.logger.debug(
        `Secteur-CC: ${secteurCCData.present ? `${secteurCCData.typesect}` : "aucun"}`,
      );
    }

    // 3. Traiter infos commune (RNU)
    if (communeResult.status === "fulfilled" && communeResult.value) {
      communeData = communeResult.value;
      if (!sourcesUtilisees.includes(SourceEnrichissement.API_CARTO_GPU)) {
        sourcesUtilisees.push(SourceEnrichissement.API_CARTO_GPU);
      }
      this.logger.debug(`Commune: ${communeData.name} - RNU: ${communeData.is_rnu}`);
    }

    // 4. Évaluer le zonage final avec le calculator
    const zonageFinal = this.calculator.evaluer(zoneUrbaData, secteurCCData, communeData);

    this.logger.log(`Zonage réglementaire final: ${zonageFinal}`);

    return {
      result: {
        success: sourcesUtilisees.length > 0,
        sourcesUtilisees,
        sourcesEchouees,
      },
      evaluation: {
        zoneUrba: zoneUrbaData,
        secteurCC: secteurCCData,
        commune: communeData,
        zonageFinal,
      },
    };
  }

  private async getZoneUrba(geometry: ParcelleGeometry): Promise<ResultatZoneUrba | null> {
    try {
      const result = await this.apiCartoGpuService.getZoneUrba(geometry);

      if (!result.success || !result.data || result.data.totalFeatures === 0) {
        return {
          present: false,
          nombreZones: 0,
        };
      }

      const feature = result.data.features[0];
      const properties = feature.properties;

      return {
        present: true,
        nombreZones: result.data.totalFeatures,
        typezone: properties?.typezone as string,
        libelle: properties?.libelle as string,
        destdomi: properties?.destdomi as string,
      };
    } catch (error) {
      this.logger.error("Erreur lors de la recuperation zone-urba:", error);
      return null;
    }
  }

  private async getSecteurCC(geometry: ParcelleGeometry): Promise<ResultatSecteurCC | null> {
    try {
      const result = await this.apiCartoGpuService.getSecteurCC(geometry);

      if (!result.success || !result.data || result.data.totalFeatures === 0) {
        return {
          present: false,
          nombreSecteurs: 0,
        };
      }

      const feature = result.data.features[0];
      const properties = feature.properties;

      return {
        present: true,
        nombreSecteurs: result.data.totalFeatures,
        typesect: properties?.typesect as string,
        libelle: properties?.libelle as string,
      };
    } catch (error) {
      this.logger.error("Erreur lors de la recuperation secteur-cc:", error);
      return null;
    }
  }

  private async getCommune(codeInsee: string): Promise<InfoCommune | null> {
    try {
      const result = await this.apiCartoGpuService.getMunicipalityInfo(codeInsee);

      if (!result.success || !result.data) {
        return null;
      }

      return {
        insee: result.data.insee,
        name: result.data.name,
        is_rnu: result.data.is_rnu,
      };
    } catch (error) {
      this.logger.error("Erreur lors de la recuperation commune:", error);
      return null;
    }
  }
}
