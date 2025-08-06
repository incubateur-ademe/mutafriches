import {
  Body,
  Controller,
  Get,
  Post,
  Res,
  Session,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { SimpleResponse } from '../shared/types/common.types';
import { UiEnrichmentResultDto } from './dto/ui-enrichment-result.dto';
import { ParcelleEnrichmentService } from 'src/friches/services/parcelle-enrichment.service';
import { MutabilityCalculationService } from 'src/friches/services/mutability-calculation.service';
import { SessionWithFormData } from './interfaces/form-session.interfaces';
import { UiService } from './services/ui.service';
import { FormSessionService } from './services/form-session.service';
import { UiParcelleDto } from './dto/ui-parcelle.dto';
import { extractNumbers, safeString } from './lib/ui.utils';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller('analyse')
export class UiController {
  constructor(
    private readonly uiService: UiService,
    private readonly formSessionService: FormSessionService,
    private readonly parcelleEnrichmentService: ParcelleEnrichmentService,
    private readonly mutabilityService: MutabilityCalculationService,
  ) {}

  /**
   * Étape 1 : Localisation et enrichissement
   */
  @Get('localisation')
  getLocationStep(
    @Res() res: SimpleResponse,
    @Session() session: SessionWithFormData,
  ): void {
    // Initialiser la session si nécessaire
    this.formSessionService.initializeSession(session);

    const html = this.uiService.renderFormStep(1);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  /**
   * Étape 2 : Données complémentaires
   */
  @Get('donnees-complementaires')
  getDonneesComplementairesStep(
    @Res() res: SimpleResponse,
    @Session() session: SessionWithFormData,
  ): void {
    // Vérifier que l'utilisateur peut accéder à cette étape
    if (!this.formSessionService.canAccessStep(session, 2)) {
      throw new ForbiddenException("Vous devez compléter l'étape précédente");
    }

    const formData = this.formSessionService.getSessionData(session);
    const html = this.uiService.renderFormStep(2, undefined, formData);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  /**
   * Étape 3 : Résultats avec mutabilité
   */
  @Get('resultats')
  getResultatsStep(
    @Res() res: SimpleResponse,
    @Session() session: SessionWithFormData,
  ): void {
    console.log('=== DEBUG RESULTATS ===');

    // Vérifier l'accès
    const canAccess = this.formSessionService.canAccessStep(session, 3);
    console.log('Peut accéder étape 3:', canAccess);

    if (!canAccess) {
      throw new ForbiddenException(
        'Vous devez compléter les étapes précédentes',
      );
    }

    try {
      const formData = this.formSessionService.getSessionData(session);
      console.log('FormData récupérée:', !!formData);

      // Debug du calcul de mutabilité
      const mutabilityInput =
        this.formSessionService.compileMutabilityInput(session);
      console.log('MutabilityInput compilé:', !!mutabilityInput);
      console.log('MutabilityInput détail:', mutabilityInput);

      if (mutabilityInput) {
        console.log('Appel calculateMutability...');
        const mutabilityResult =
          this.mutabilityService.calculateMutability(mutabilityInput);
        console.log('MutabilityResult:', !!mutabilityResult);

        if (mutabilityResult) {
          console.log('Transformation UI...');
          const uiData =
            this.uiService.transformMutabilityForUI(mutabilityResult);
          console.log('UiData transformée:', !!uiData);

          this.formSessionService.saveMutabilityResult(session, uiData);

          console.log('Rendu HTML...');
          const html = this.uiService.renderFormStep(3, uiData, formData);
          console.log('HTML généré, longueur:', html.length);

          res.setHeader('Content-Type', 'text/html');
          res.send(html);
        } else {
          console.error('Résultat mutabilité null');
          throw new Error('Impossible de calculer la mutabilité');
        }
      } else {
        console.error('Input mutabilité null');
        throw new Error('Données insuffisantes pour calculer la mutabilité');
      }
    } catch (error) {
      console.error('Erreur dans getResultatsStep:', error);
      const formData = this.formSessionService.getSessionData(session);
      const html = this.uiService.renderFormStep(3, undefined, formData);
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    }
  }

  /**
   * API : Enrichissement d'une parcelle (Étape 1)
   */
  @Post('enrichir-parcelle')
  async enrichirParcelle(
    @Body('identifiantParcelle') identifiantParcelle: string,
    @Session() session: SessionWithFormData,
  ): Promise<UiEnrichmentResultDto> {
    if (!identifiantParcelle) {
      throw new BadRequestException('Identifiant de parcelle requis');
    }

    try {
      // Enrichissement via l'API externe
      const enrichmentResult =
        await this.parcelleEnrichmentService.enrichFromDataSources(
          identifiantParcelle,
        );

      // Transformation pour l'affichage
      const uiResult =
        this.uiService.transformEnrichmentResultForUI(enrichmentResult);

      if (uiResult.success && uiResult.data) {
        // Sauvegarde des données d'enrichissement en session
        const enrichmentData = this.transformUiDataToEnrichmentFormat(
          uiResult.data,
        );
        this.formSessionService.saveEnrichmentData(
          session,
          identifiantParcelle,
          enrichmentData,
        );
      }

      return uiResult;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return this.uiService.createEnrichmentErrorForUI(errorMessage);
    }
  }

  /**
   * API : Sauvegarde des données manuelles (Étape 2)
   */
  @Post('sauvegarder-donnees')
  sauvegarderDonnees(
    @Body() manualData: Record<string, string>,
    @Session() session: SessionWithFormData,
  ): { success: boolean; message?: string; nextStep?: number } {
    try {
      // Vérifier que l'utilisateur peut sauvegarder à cette étape
      if (!this.formSessionService.canAccessStep(session, 2)) {
        throw new ForbiddenException("Vous devez compléter l'étape précédente");
      }

      // Sauvegarder les données manuelles
      this.formSessionService.saveManualData(session, manualData);

      return {
        success: true,
        message: 'Données sauvegardées avec succès',
        nextStep: 3,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * API : Informations de session pour le debug/monitoring
   */
  @Get('session-info')
  getSessionInfo(@Session() session: SessionWithFormData): {
    step: number;
    completion: number;
    quality: number;
    hasResults: boolean;
  } {
    return this.formSessionService.getSessionSummary(session);
  }

  /**
   * API : Réinitialiser la session
   */
  @Post('reset-session')
  resetSession(@Session() session: SessionWithFormData): { success: boolean } {
    this.formSessionService.resetSession(session);
    return { success: true };
  }

  @Get('debug-compile-input')
  debugCompileInput(@Session() session: SessionWithFormData): any {
    try {
      const mutabilityInput =
        this.formSessionService.compileMutabilityInput(session);
      return {
        success: true,
        input: mutabilityInput,
        hasInput: !!mutabilityInput,
      };
    } catch (error) {
      return {
        success: false,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        error: error.message,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        stack: error.stack,
      };
    }
  }

  /**
   * Transforme les données UI en format d'enrichissement pour la session
   */
  private transformUiDataToEnrichmentFormat(
    uiData: UiParcelleDto,
  ): Record<string, string> {
    return {
      commune: safeString(uiData.commune),
      surfaceParcelle: extractNumbers(uiData.surfaceParcelle),
      surfaceBatie: extractNumbers(uiData.surfaceBatie),
      connectionElectricite: safeString(uiData.connectionElectricite),
      centreVille: safeString(uiData.centreVille),
      proximiteCommerces: safeString(uiData.proximiteCommerces),
      risquesTechno: safeString(uiData.risquesTechno),
      // Ajout d'autres champs disponibles dans UiParcelleDto
      typeProprietaire: safeString(uiData.typeProprietaire),
      ancienneActivite: safeString(uiData.ancienneActivite),
      identifiantParcelle: safeString(uiData.identifiantParcelle),
      distanceAutoroute: safeString(uiData.distanceAutoroute),
      distanceTrain: safeString(uiData.distanceTrain),
      distanceRaccordement: safeString(uiData.distanceRaccordement),
      tauxLV: safeString(uiData.tauxLV),
      risquesNaturels: safeString(uiData.risquesNaturels),
      zonageEnviro: safeString(uiData.zonageEnviro),
      zonageUrba: safeString(uiData.zonageUrba),
      zonagePatrimonial: safeString(uiData.zonagePatrimonial),
      tvb: safeString(uiData.tvb),
      potentielEcologique: safeString(uiData.potentielEcologique),
    };
  }
}
