// src/ui/ui.controller.ts
import { Body, Controller, Get, Post, Res, Query } from '@nestjs/common';
import { UiService } from './ui.service';
import { MockService } from '../mocks/mock.service';
import { SimpleResponse } from '../shared/types/common.types';
import { ParcelleEnrichmentService } from 'src/friches/services/parcelle-enrichment.service';
import { EnrichmentResultDto } from 'src/friches/dto/enrichment-result.dto';
import { MockInfosParcelle } from 'src/mocks/mock.types';

@Controller('analyse')
export class UiController {
  constructor(
    private readonly uiService: UiService,
    private readonly mockService: MockService,
    private readonly enrichmentService: ParcelleEnrichmentService,
  ) {}

  // Méthode commune pour rendre les étapes (avec données mockées pour l'instant)
  private renderStep(stepNumber: number, res: SimpleResponse): void {
    const mockData = this.mockService.getDataForStep(stepNumber);
    const html = this.uiService.renderFormStep(stepNumber, mockData);

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  // Étape 1 : Localisation (sans identifiant = données mockées, avec identifiant = données enrichies)
  @Get('localisation')
  async getLocationStep(
    @Res() res: SimpleResponse,
    @Query('identifiant') identifiant?: string,
  ): Promise<void> {
    if (identifiant) {
      // Cas avec identifiant : utiliser l'enrichissement
      try {
        const enrichmentResult =
          await this.enrichmentService.enrichFromDataSources(identifiant);
        const enrichedData =
          this.transformEnrichmentToMockFormat(enrichmentResult);
        const html = this.uiService.renderFormStep(1, enrichedData);

        res.setHeader('Content-Type', 'text/html');
        res.send(html);
      } catch (error) {
        console.error('Erreur enrichissement:', error);
        // Fallback vers les données mockées en cas d'erreur
        this.renderStep(1, res);
      }
    } else {
      // Cas sans identifiant : données mockées
      this.renderStep(1, res);
    }
  }

  // Étape 2 : Données complémentaires
  @Get('donnees-complementaires')
  getDonneesComplementairesStep(@Res() res: SimpleResponse): void {
    this.renderStep(2, res);
  }

  // Étape 3 : Résultats
  @Get('resultats')
  getResultatsStep(@Res() res: SimpleResponse): void {
    this.renderStep(3, res);
  }

  // API pour l'enrichissement depuis le formulaire
  @Post('parcelle/enrichir')
  async enrichirParcelle(@Body('identifiant') identifiant: string) {
    try {
      const result =
        await this.enrichmentService.enrichFromDataSources(identifiant);

      // Transformer les données pour l'UI
      const enrichedData = this.transformEnrichmentToMockFormat(result);

      return {
        success: true,
        data: enrichedData,
        sources: result.sourcesUtilisees,
        fiabilite: result.fiabilite,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  @Post('parcelle/test-enrichment')
  async testEnrichment(@Body('identifiant') identifiant: string) {
    const result =
      await this.enrichmentService.enrichFromDataSources(identifiant);
    return JSON.stringify(result, null, 2);
  }

  /**
   * Transforme les données d'enrichissement au format attendu par l'UI
   */
  private transformEnrichmentToMockFormat(
    enrichmentResult: EnrichmentResultDto,
  ): MockInfosParcelle {
    const parcelle = enrichmentResult.parcelle;

    return {
      // Données de base
      surfaceParcelle: `${parcelle.surfaceSite?.toLocaleString() || 'Non renseigné'} m²`,
      surfaceBatie: `${parcelle.surfaceBati?.toLocaleString() || 'Non renseigné'} m²`,
      typeProprietaire: parcelle.typeProprietaire || 'Non renseigné',
      ancienneActivite: parcelle.ancienneActivite || 'Non renseignée',

      // Informations parcelle
      commune: parcelle.commune || 'Non renseignée',
      identifiantParcelle: parcelle.identifiantParcelle || 'Non renseigné',
      connectionElectricite: parcelle.connectionReseauElectricite
        ? 'Oui'
        : 'Non',

      // Environnement
      centreVille: parcelle.siteEnCentreVille ? 'Oui' : 'Non',
      distanceAutoroute: this.formatDistance(parcelle.distanceAutoroute, 'km'),
      distanceTrain: this.formatDistance(parcelle.distanceTransportCommun, 'm'),
      proximiteCommerces: parcelle.proximiteCommercesServices ? 'Oui' : 'Non',
      distanceRaccordement: this.formatDistance(
        parcelle.distanceRaccordementElectrique,
        'km',
      ),
      tauxLV: `${parcelle.tauxLogementsVacants || 'Non renseigné'}%`,

      // Risques et zonage
      risquesTechno: parcelle.presenceRisquesTechnologiques ? 'Oui' : 'Non',
      risquesNaturels:
        parcelle.presenceRisquesNaturels?.toString() || 'Non renseigné',
      zonageEnviro:
        parcelle.zonageEnvironnemental?.toString() || 'Non renseigné',
      zonageUrba: parcelle.zonageReglementaire || 'Non renseigné',
      zonagePatrimonial:
        parcelle.zonagePatrimonial?.toString() || 'Non renseigné',
      tvb: parcelle.trameVerteEtBleue?.toString() || 'Non renseigné',

      // Données techniques
      potentielEcologique: 'À calculer', // TODO: implémenter le calcul
    };
  }

  /**
   * Formate les distances pour l'affichage
   */
  private formatDistance(distance: number | undefined, unit: string): string {
    if (!distance) return 'Non renseigné';

    if (unit === 'km') {
      if (distance < 1) {
        return 'Moins de 1km';
      } else if (distance <= 2) {
        return 'Entre 1 et 2km';
      } else {
        return `Plus de 2km (${distance}km)`;
      }
    }

    if (unit === 'm') {
      if (distance < 500) {
        return 'Moins de 500m';
      } else if (distance <= 1000) {
        return 'Entre 500m et 1km';
      } else {
        return `Plus de 1km (${Math.round(distance)}m)`;
      }
    }

    return `${distance} ${unit}`;
  }
}
