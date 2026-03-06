import { Injectable, Logger } from "@nestjs/common";
import {
  SourceEnrichissement,
  DiagnosticFeature,
  DiagnosticReglementaire,
} from "@mutafriches/shared-types";

import { ApiCartoGpuService } from "../../../adapters/api-carto/gpu/api-carto-gpu.service";
import { ParcelleGeometry } from "../../shared/geometry.types";
import { selectionnerFeatureDominante } from "../../shared/geometry.utils";
import { EnrichmentResult } from "../../shared/enrichissement.types";
import { isProduction } from "../../../../shared/utils/environment.utils";
import { ZonageReglementaireCalculator } from "./zonage-reglementaire.calculator";
import {
  EvaluationZonageReglementaire,
  ResultatZoneUrba,
  ResultatSecteurCC,
  InfoCommune,
} from "./zonage-reglementaire.types";

/**
 * Résultat interne de getZoneUrba avec les features brutes pour le diagnostic
 */
interface ZoneUrbaAvecDiagnostic {
  processed: ResultatZoneUrba | null;
  rawFeatures: DiagnosticFeature[];
  totalFeatures: number;
}

/**
 * Résultat interne de getSecteurCC avec les features brutes pour le diagnostic
 */
interface SecteurCCAvecDiagnostic {
  processed: ResultatSecteurCC | null;
  rawFeatures: DiagnosticFeature[];
  totalFeatures: number;
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

    // Données de diagnostic
    let zoneUrbaRawFeatures: DiagnosticFeature[] = [];
    let zoneUrbaTotalFeatures = 0;
    let secteurCCRawFeatures: DiagnosticFeature[] = [];
    let secteurCCTotalFeatures = 0;

    // 1. Traiter zone-urba (PLU)
    if (zoneUrbaResult.status === "fulfilled" && zoneUrbaResult.value) {
      const urbaResult = zoneUrbaResult.value;
      zoneUrbaData = urbaResult.processed;
      zoneUrbaRawFeatures = urbaResult.rawFeatures;
      zoneUrbaTotalFeatures = urbaResult.totalFeatures;
      sourcesUtilisees.push(SourceEnrichissement.API_CARTO_GPU);
      this.logger.debug(
        `Zone-urba: ${zoneUrbaData?.present ? `${zoneUrbaData.typezone} - ${zoneUrbaData.libelle}` : "aucune"}`,
      );
    } else {
      sourcesEchouees.push(SourceEnrichissement.API_CARTO_GPU);
    }

    // 2. Traiter secteur-cc (carte communale)
    if (secteurCCResult.status === "fulfilled" && secteurCCResult.value) {
      const ccResult = secteurCCResult.value;
      secteurCCData = ccResult.processed;
      secteurCCRawFeatures = ccResult.rawFeatures;
      secteurCCTotalFeatures = ccResult.totalFeatures;
      if (!sourcesUtilisees.includes(SourceEnrichissement.API_CARTO_GPU)) {
        sourcesUtilisees.push(SourceEnrichissement.API_CARTO_GPU);
      }
      this.logger.debug(
        `Secteur-CC: ${secteurCCData?.present ? `${secteurCCData.typesect}` : "aucun"}`,
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

    // 5. Construire le diagnostic (hors production)
    let diagnosticReglementaire: DiagnosticReglementaire | undefined;
    if (!isProduction()) {
      diagnosticReglementaire = {
        zoneUrba:
          zoneUrbaTotalFeatures > 0
            ? { totalFeatures: zoneUrbaTotalFeatures, features: zoneUrbaRawFeatures }
            : null,
        secteurCC:
          secteurCCTotalFeatures > 0
            ? { totalFeatures: secteurCCTotalFeatures, features: secteurCCRawFeatures }
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
   * Retourne aussi les features brutes (sans géométrie) pour le diagnostic
   */
  private async getZoneUrba(geometry: ParcelleGeometry): Promise<ZoneUrbaAvecDiagnostic> {
    try {
      const result = await this.apiCartoGpuService.getZoneUrba(geometry);

      if (!result.success || !result.data || result.data.totalFeatures === 0) {
        return {
          processed: { present: false, nombreZones: 0 },
          rawFeatures: [],
          totalFeatures: 0,
        };
      }

      // Extraire les features brutes sans géométrie pour le diagnostic
      const rawFeatures: DiagnosticFeature[] = result.data.features.map((f) => ({
        id: String(f.id ?? ""),
        properties: { ...(f.properties as Record<string, unknown>) },
      }));

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
        processed: {
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
        totalFeatures: result.data.totalFeatures,
      };
    } catch (error) {
      this.logger.error("Erreur lors de la récupération zone-urba:", error);
      return { processed: null, rawFeatures: [], totalFeatures: 0 };
    }
  }

  /**
   * Récupère les secteurs de carte communale
   * Retourne aussi les features brutes (sans géométrie) pour le diagnostic
   */
  private async getSecteurCC(geometry: ParcelleGeometry): Promise<SecteurCCAvecDiagnostic> {
    try {
      const result = await this.apiCartoGpuService.getSecteurCC(geometry);

      if (!result.success || !result.data || result.data.totalFeatures === 0) {
        return {
          processed: { present: false, nombreSecteurs: 0 },
          rawFeatures: [],
          totalFeatures: 0,
        };
      }

      // Extraire les features brutes sans géométrie pour le diagnostic
      const rawFeatures: DiagnosticFeature[] = result.data.features.map((f) => ({
        id: String(f.id ?? ""),
        properties: { ...(f.properties as Record<string, unknown>) },
      }));

      const feature = result.data.features[0];
      const properties = feature.properties;

      return {
        processed: {
          present: true,
          nombreSecteurs: result.data.totalFeatures,
          typesect: properties?.typesect as string,
          libelle: properties?.libelle as string,
        },
        rawFeatures,
        totalFeatures: result.data.totalFeatures,
      };
    } catch (error) {
      this.logger.error("Erreur lors de la récupération secteur-cc:", error);
      return { processed: null, rawFeatures: [], totalFeatures: 0 };
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
