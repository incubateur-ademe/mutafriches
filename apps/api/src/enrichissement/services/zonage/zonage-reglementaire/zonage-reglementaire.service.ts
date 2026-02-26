import { Injectable, Logger } from "@nestjs/common";
import { DiagnosticFeature, DiagnosticReglementaire, SourceEnrichissement } from "@mutafriches/shared-types";
import { isProduction } from "../../../../shared/utils/environment.utils";
import { ApiCartoGpuService } from "../../../adapters/api-carto/gpu/api-carto-gpu.service";
import { ParcelleGeometry } from "../../shared/geometry.types";
import { selectionnerFeatureDominante } from "../../shared/geometry.utils";
import { EnrichmentResult } from "../../shared/enrichissement.types";
import { ZonageReglementaireCalculator } from "./zonage-reglementaire.calculator";
import {
  EvaluationZonageReglementaire,
  ResultatZoneUrba,
  ResultatSecteurCC,
  InfoCommune,
} from "./zonage-reglementaire.types";

// TODO: supprimer apres analyse
interface ResultatAvecDiagnostic<T> {
  result: T;
  rawFeatures: DiagnosticFeature[];
}

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
    // TODO: supprimer apres analyse
    diagnosticReglementaire?: DiagnosticReglementaire;
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

    // TODO: supprimer apres analyse - collecter les features brutes
    let rawZoneUrbaFeatures: DiagnosticFeature[] = [];
    let rawSecteurCCFeatures: DiagnosticFeature[] = [];

    // 1. Traiter zone-urba (PLU)
    if (zoneUrbaResult.status === "fulfilled" && zoneUrbaResult.value) {
      zoneUrbaData = zoneUrbaResult.value.result;
      rawZoneUrbaFeatures = zoneUrbaResult.value.rawFeatures;
      sourcesUtilisees.push(SourceEnrichissement.API_CARTO_GPU);
      this.logger.debug(
        `Zone-urba: ${zoneUrbaData.present ? `${zoneUrbaData.typezone} - ${zoneUrbaData.libelle}` : "aucune"}`,
      );
    } else {
      sourcesEchouees.push(SourceEnrichissement.API_CARTO_GPU);
    }

    // 2. Traiter secteur-cc (carte communale)
    if (secteurCCResult.status === "fulfilled" && secteurCCResult.value) {
      secteurCCData = secteurCCResult.value.result;
      rawSecteurCCFeatures = secteurCCResult.value.rawFeatures;
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

    // TODO: supprimer apres analyse - construire le diagnostic réglementaire
    let diagnosticReglementaire: DiagnosticReglementaire | undefined;
    if (!isProduction()) {
      diagnosticReglementaire = {
        zoneUrba: zoneUrbaData?.present
          ? { totalFeatures: zoneUrbaData.nombreZones, features: rawZoneUrbaFeatures }
          : null,
        secteurCC: secteurCCData?.present
          ? { totalFeatures: secteurCCData.nombreSecteurs, features: rawSecteurCCFeatures }
          : null,
        commune: communeData,
        zoneDominante: zoneUrbaData?.present
          ? {
              index: zoneUrbaData.indexZoneDominante ?? 0,
              surfaceIntersection: zoneUrbaData.surfaceIntersection,
              typezone: zoneUrbaData.typezone,
              libelle: zoneUrbaData.libelle,
              libelong: zoneUrbaData.libelong,
              destdomi: zoneUrbaData.destdomi,
              formdomi: undefined,
            }
          : null,
        zonageFinal,
      };
    }

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
      diagnosticReglementaire,
    };
  }

  /**
   * Récupère les zones d'urbanisme (PLU) et sélectionne la zone dominante
   */
  private async getZoneUrba(
    geometry: ParcelleGeometry,
  ): Promise<ResultatAvecDiagnostic<ResultatZoneUrba | null>> {
    try {
      const result = await this.apiCartoGpuService.getZoneUrba(geometry);

      // TODO: supprimer apres analyse - extraire les features brutes (sans géométrie)
      const rawFeatures: DiagnosticFeature[] = (result.data?.features ?? []).map((f) => ({
        id: f.id,
        properties: f.properties as Record<string, unknown>,
      }));

      if (!result.success || !result.data || result.data.totalFeatures === 0) {
        return { result: { present: false, nombreZones: 0 }, rawFeatures };
      }

      // Sélectionner la zone dominante par surface d'intersection
      const dominante = selectionnerFeatureDominante(geometry, result.data.features);
      const properties = dominante.feature.properties;

      if (dominante.nombreFeatures > 1) {
        this.logger.debug(
          `Zone-urba : ${dominante.nombreFeatures} zones, ` +
            `dominante [${dominante.index}] "${properties?.libelle}" ` +
            `(${dominante.surfaceIntersection ?? "?"} m²)`,
        );
      }

      return {
        result: {
          present: true,
          nombreZones: result.data.totalFeatures,
          typezone: properties?.typezone as string,
          libelle: properties?.libelle as string,
          libelong: properties?.libelong as string,
          destdomi: properties?.destdomi as string,
          indexZoneDominante: dominante.index,
          surfaceIntersection: dominante.surfaceIntersection ?? undefined,
        },
        rawFeatures,
      };
    } catch (error) {
      this.logger.error("Erreur lors de la récupération zone-urba:", error);
      return { result: null, rawFeatures: [] };
    }
  }

  /**
   * Récupère les secteurs de carte communale
   */
  private async getSecteurCC(
    geometry: ParcelleGeometry,
  ): Promise<ResultatAvecDiagnostic<ResultatSecteurCC | null>> {
    try {
      const result = await this.apiCartoGpuService.getSecteurCC(geometry);

      // TODO: supprimer apres analyse - extraire les features brutes (sans géométrie)
      const rawFeatures: DiagnosticFeature[] = (result.data?.features ?? []).map((f) => ({
        id: f.id,
        properties: f.properties as Record<string, unknown>,
      }));

      if (!result.success || !result.data || result.data.totalFeatures === 0) {
        return { result: { present: false, nombreSecteurs: 0 }, rawFeatures };
      }

      const feature = result.data.features[0];
      const properties = feature.properties;

      return {
        result: {
          present: true,
          nombreSecteurs: result.data.totalFeatures,
          typesect: properties?.typesect as string,
          libelle: properties?.libelle as string,
        },
        rawFeatures,
      };
    } catch (error) {
      this.logger.error("Erreur lors de la récupération secteur-cc:", error);
      return { result: null, rawFeatures: [] };
    }
  }

  /**
   * Récupère les informations de la commune (RNU)
   */
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
      this.logger.error("Erreur lors de la récupération commune:", error);
      return null;
    }
  }
}
