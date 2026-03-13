import { Injectable, Logger } from "@nestjs/common";
import { DiagnosticZonages, SourceEnrichissement } from "@mutafriches/shared-types";

import { Site } from "../../../evaluation/entities/site.entity";
import { isProduction } from "../../../shared/utils/environment.utils";
import { ParcelleGeometry } from "../shared/geometry.types";
import { ZonageEnvironnementalService } from "./zonage-environnemental/zonage-environnemental.service";
import { ZonagePatrimonialService } from "./zonage-patrimonial/zonage-patrimonial.service";
import { ZonageReglementaireService } from "./zonage-reglementaire/zonage-reglementaire.service";
import { ResultatEnrichissementZonage } from "./zonage-orchestrator.types";

/**
 * Orchestrateur des services de zonage
 *
 * Responsabilités :
 * - Coordonner les 3 services de zonage (environnemental, patrimonial, réglementaire)
 * - Appeler les services en parallèle pour optimiser les performances
 * - Agréger les résultats et consolider les sources utilisées/échouées
 * - Muter le site avec les zonages calculés
 *
 * Règles multi-parcellaire :
 * - Environnemental et patrimonial utilisent site.geometrie (union)
 * - Réglementaire utilise site.geometrieReglementaire si présente (parcelle prédominante),
 *   sinon fallback sur site.geometrie
 */
@Injectable()
export class ZonageOrchestratorService {
  private readonly logger = new Logger(ZonageOrchestratorService.name);

  constructor(
    private readonly zonageEnvironnementalService: ZonageEnvironnementalService,
    private readonly zonagePatrimonialService: ZonagePatrimonialService,
    private readonly zonageReglementaireService: ZonageReglementaireService,
  ) {}

  /**
   * Enrichit un site avec les 3 zonages (environnemental, patrimonial, réglementaire)
   *
   * Mute site.zonageEnvironnemental, site.zonagePatrimonial, site.zonageReglementaire
   *
   * @param site - Site à enrichir (doit avoir une géométrie et un codeInsee)
   * @returns Résultat de l'enrichissement et données d'évaluation/diagnostic
   */
  async enrichir(site: Site): Promise<ResultatEnrichissementZonage> {
    if (!site.geometrie || !site.codeInsee) {
      this.logger.warn(
        `Pas de géométrie ou codeInsee pour les zonages - site ${site.identifiantParcelle}`,
      );
      return {
        result: {
          success: false,
          sourcesUtilisees: [],
          sourcesEchouees: [
            SourceEnrichissement.API_CARTO_NATURE,
            SourceEnrichissement.API_CARTO_GPU,
          ],
        },
        zonageEnvironnemental: null as any,
        zonagePatrimonial: null as any,
        zonageReglementaire: null as any,
        evaluations: {
          environnemental: null as any,
          patrimonial: null as any,
          reglementaire: null as any,
        },
      };
    }

    // Réglementaire : géométrie prédominante si multi-parcellaire, sinon géométrie du site
    const geometrieReglementaire = site.geometrieReglementaire ?? site.geometrie;

    const result = await this.executeZonageEnrichment(
      site.geometrie, // Environnemental : union
      site.geometrie, // Patrimonial : union
      geometrieReglementaire, // Réglementaire : prédominante ou union
      site.codeInsee,
    );

    // Muter le site avec les zonages calculés
    site.zonageEnvironnemental = result.zonageEnvironnemental;
    site.zonagePatrimonial = result.zonagePatrimonial;
    site.zonageReglementaire = result.zonageReglementaire;

    return result;
  }

  /**
   * Exécute l'enrichissement des 3 zonages en parallèle
   *
   * @param geometrieEnvironnemental - Géométrie pour le zonage environnemental
   * @param geometriePatrimonial - Géométrie pour le zonage patrimonial
   * @param geometrieReglementaire - Géométrie pour le zonage réglementaire
   * @param codeInsee - Code INSEE de la commune
   */
  private async executeZonageEnrichment(
    geometrieEnvironnemental: ParcelleGeometry,
    geometriePatrimonial: ParcelleGeometry,
    geometrieReglementaire: ParcelleGeometry,
    codeInsee: string,
  ): Promise<ResultatEnrichissementZonage> {
    const startTime = Date.now();

    // Appeler les 3 services en parallèle
    const [environnementalResult, patrimonialResult, reglementaireResult] =
      await Promise.allSettled([
        this.zonageEnvironnementalService.enrichir(geometrieEnvironnemental),
        this.zonagePatrimonialService.enrichir(geometriePatrimonial),
        this.zonageReglementaireService.enrichir(geometrieReglementaire, codeInsee),
      ]);

    // Consolider les sources utilisées et échouées
    const sourcesUtilisees = new Set<string>();
    const sourcesEchouees = new Set<string>();

    // Traiter le résultat environnemental
    let evalEnvironnemental = null;
    let zonageEnvironnementalFinal = null;

    if (environnementalResult.status === "fulfilled" && environnementalResult.value) {
      const envResult = environnementalResult.value;
      evalEnvironnemental = envResult.evaluation;
      zonageEnvironnementalFinal = envResult.evaluation.zonageFinal;

      envResult.result.sourcesUtilisees.forEach((s) => sourcesUtilisees.add(s));
      envResult.result.sourcesEchouees.forEach((s) => sourcesEchouees.add(s));

      this.logger.debug(`Zonage environnemental: ${zonageEnvironnementalFinal}`);
    } else {
      this.logger.warn("Échec enrichissement zonage environnemental");
      sourcesEchouees.add(SourceEnrichissement.API_CARTO_NATURE);
    }

    // Traiter le résultat patrimonial
    let evalPatrimonial = null;
    let zonagePatrimonialFinal = null;

    if (patrimonialResult.status === "fulfilled" && patrimonialResult.value) {
      const patriResult = patrimonialResult.value;
      evalPatrimonial = patriResult.evaluation;
      zonagePatrimonialFinal = patriResult.evaluation.zonageFinal;

      patriResult.result.sourcesUtilisees.forEach((s) => sourcesUtilisees.add(s));
      patriResult.result.sourcesEchouees.forEach((s) => sourcesEchouees.add(s));

      this.logger.debug(`Zonage patrimonial: ${zonagePatrimonialFinal}`);
    } else {
      this.logger.warn("Échec enrichissement zonage patrimonial");
      sourcesEchouees.add(SourceEnrichissement.API_CARTO_GPU);
    }

    // Traiter le résultat réglementaire
    let evalReglementaire = null;
    let zonageReglementaireFinal = null;

    if (reglementaireResult.status === "fulfilled" && reglementaireResult.value) {
      const reglResult = reglementaireResult.value;
      evalReglementaire = reglResult.evaluation;
      zonageReglementaireFinal = reglResult.evaluation.zonageFinal;

      reglResult.result.sourcesUtilisees.forEach((s) => sourcesUtilisees.add(s));
      reglResult.result.sourcesEchouees.forEach((s) => sourcesEchouees.add(s));

      this.logger.debug(`Zonage réglementaire: ${zonageReglementaireFinal}`);
    } else {
      this.logger.warn("Échec enrichissement zonage réglementaire");
      sourcesEchouees.add(SourceEnrichissement.API_CARTO_GPU);
    }

    const responseTime = Date.now() - startTime;

    this.logger.log(
      `Enrichissement zonages terminé en ${responseTime}ms - ` +
        `Env: ${zonageEnvironnementalFinal}, Patri: ${zonagePatrimonialFinal}, Regl: ${zonageReglementaireFinal}`,
    );

    // Assembler les données de diagnostic (hors production)
    let diagnosticZonages: DiagnosticZonages | undefined;
    if (!isProduction()) {
      diagnosticZonages = {
        reglementaire:
          reglementaireResult.status === "fulfilled" && reglementaireResult.value
            ? (reglementaireResult.value.diagnosticReglementaire ?? null)
            : null,
        environnemental: evalEnvironnemental
          ? {
              natura2000: evalEnvironnemental.natura2000,
              znieff: evalEnvironnemental.znieff,
              parcNaturel: evalEnvironnemental.parcNaturel,
              reserveNaturelle: evalEnvironnemental.reserveNaturelle,
              zonageFinal: evalEnvironnemental.zonageFinal,
            }
          : null,
        patrimonial: evalPatrimonial
          ? {
              ac1: evalPatrimonial.ac1,
              ac2: evalPatrimonial.ac2,
              ac4: evalPatrimonial.ac4,
              zonageFinal: evalPatrimonial.zonageFinal,
            }
          : null,
      };
    }

    return {
      result: {
        success: sourcesUtilisees.size > 0,
        sourcesUtilisees: Array.from(sourcesUtilisees),
        sourcesEchouees: Array.from(sourcesEchouees),
      },
      zonageEnvironnemental: zonageEnvironnementalFinal as any,
      zonagePatrimonial: zonagePatrimonialFinal as any,
      zonageReglementaire: zonageReglementaireFinal as any,
      evaluations: {
        environnemental: evalEnvironnemental as any,
        patrimonial: evalPatrimonial as any,
        reglementaire: evalReglementaire as any,
      },
      diagnosticZonages,
    };
  }
}
