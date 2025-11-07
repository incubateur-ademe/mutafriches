import { Injectable, Logger } from '@nestjs/common';
import { SourceEnrichissement } from '@mutafriches/shared-types';
import { ParcelleGeometry } from '../shared/geometry.types';
import { ZonageEnvironnementalService } from './zonage-environnemental/zonage-environnemental.service';
import { ZonagePatrimonialService } from './zonage-patrimonial/zonage-patrimonial.service';
import { ZonageReglementaireService } from './zonage-reglementaire/zonage-reglementaire.service';
import { ResultatEnrichissementZonage } from './zonage-orchestrator.types';

/**
 * Orchestrateur des services de zonage
 *
 * Responsabilités :
 * - Coordonner les 3 services de zonage (environnemental, patrimonial, réglementaire)
 * - Appeler les services en parallèle pour optimiser les performances
 * - Agréger les résultats et consolider les sources utilisées/échouées
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
   * Enrichit avec tous les zonages (environnemental, patrimonial, réglementaire)
   *
   * @param geometry - Géométrie de la parcelle
   * @param codeInsee - Code INSEE de la commune (pour le zonage réglementaire)
   * @returns Résultat complet de l'enrichissement zonage
   */
  async enrichirZonages(
    geometry: ParcelleGeometry,
    codeInsee: string,
  ): Promise<ResultatEnrichissementZonage> {
    const startTime = Date.now();

    // Appeler les 3 services en parallèle
    const [environnementalResult, patrimonialResult, reglementaireResult] =
      await Promise.allSettled([
        this.zonageEnvironnementalService.enrichir(geometry),
        this.zonagePatrimonialService.enrichir(geometry),
        this.zonageReglementaireService.enrichir(geometry, codeInsee),
      ]);

    // Consolider les sources utilisées et échouées
    const sourcesUtilisees = new Set<string>();
    const sourcesEchouees = new Set<string>();

    // Traiter le résultat environnemental
    let evalEnvironnemental = null;
    let zonageEnvironnementalFinal = null;

    if (
      environnementalResult.status === 'fulfilled' &&
      environnementalResult.value
    ) {
      const envResult = environnementalResult.value;
      evalEnvironnemental = envResult.evaluation;
      zonageEnvironnementalFinal = envResult.evaluation.zonageFinal;

      envResult.result.sourcesUtilisees.forEach((s) => sourcesUtilisees.add(s));
      envResult.result.sourcesEchouees.forEach((s) => sourcesEchouees.add(s));

      this.logger.debug(
        `Zonage environnemental: ${zonageEnvironnementalFinal}`,
      );
    } else {
      this.logger.warn('Échec enrichissement zonage environnemental');
      sourcesEchouees.add(SourceEnrichissement.API_CARTO_NATURE);
    }

    // Traiter le résultat patrimonial
    let evalPatrimonial = null;
    let zonagePatrimonialFinal = null;

    if (patrimonialResult.status === 'fulfilled' && patrimonialResult.value) {
      const patriResult = patrimonialResult.value;
      evalPatrimonial = patriResult.evaluation;
      zonagePatrimonialFinal = patriResult.evaluation.zonageFinal;

      patriResult.result.sourcesUtilisees.forEach((s) =>
        sourcesUtilisees.add(s),
      );
      patriResult.result.sourcesEchouees.forEach((s) => sourcesEchouees.add(s));

      this.logger.debug(`Zonage patrimonial: ${zonagePatrimonialFinal}`);
    } else {
      this.logger.warn('Échec enrichissement zonage patrimonial');
      sourcesEchouees.add(SourceEnrichissement.API_CARTO_GPU);
    }

    // Traiter le résultat réglementaire
    let evalReglementaire = null;
    let zonageReglementaireFinal = null;

    if (
      reglementaireResult.status === 'fulfilled' &&
      reglementaireResult.value
    ) {
      const reglResult = reglementaireResult.value;
      evalReglementaire = reglResult.evaluation;
      zonageReglementaireFinal = reglResult.evaluation.zonageFinal;

      reglResult.result.sourcesUtilisees.forEach((s) =>
        sourcesUtilisees.add(s),
      );
      reglResult.result.sourcesEchouees.forEach((s) => sourcesEchouees.add(s));

      this.logger.debug(`Zonage réglementaire: ${zonageReglementaireFinal}`);
    } else {
      this.logger.warn('Échec enrichissement zonage réglementaire');
      sourcesEchouees.add(SourceEnrichissement.API_CARTO_GPU);
    }

    const responseTime = Date.now() - startTime;

    this.logger.log(
      `Enrichissement zonages terminé en ${responseTime}ms - ` +
        `Env: ${zonageEnvironnementalFinal}, Patri: ${zonagePatrimonialFinal}, Regl: ${zonageReglementaireFinal}`,
    );

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
    };
  }
}
