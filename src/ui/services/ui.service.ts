import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Component, Page, StepConfigMap } from '../ui.types';
import { replaceVariables } from '../ui.utils';
import { EnrichmentResultDto } from 'src/friches/dto/enrichment-result.dto';
import { MutabilityResultDto } from 'src/friches/dto/mutability-result.dto';
import { UiEnrichmentResultDto } from '../dto/ui-enrichment-result.dto';
import { UiMutabilityResultDto } from '../dto/ui-mutability-result.dto';
import { UiParcelleDto } from '../dto/ui-parcelle.dto';
import { FormSessionData } from '../dto/form-session.dto';
import { safeStringify } from '../lib/ui.utils';

@Injectable()
export class UiService {
  private readonly stepUrls: Record<1 | 2 | 3, string> = {
    1: '/analyse/localisation',
    2: '/analyse/donnees-complementaires',
    3: '/analyse/resultats',
  };

  private getBasePath(): string {
    if (process.env.NODE_ENV !== 'production') {
      return join(process.cwd(), 'src', 'ui');
    }
    // En production, les fichiers sont dans dist/src/ui/
    return join(process.cwd(), 'dist', 'src', 'ui');
  }

  private loadLayout(layoutName: string): string {
    const layoutPath = join(
      this.getBasePath(),
      'layouts',
      `${layoutName}.html`,
    );
    return readFileSync(layoutPath, 'utf8');
  }

  private loadComponent(componentName: string): string {
    const componentPath = join(
      this.getBasePath(),
      'components',
      `${componentName}.html`,
    );
    return readFileSync(componentPath, 'utf8');
  }

  private loadPage(pageName: string): string {
    const pagePath = join(this.getBasePath(), 'pages', `${pageName}.html`);
    return readFileSync(pagePath, 'utf8');
  }

  // Méthode principale pour le rendu de la page complète
  renderBasePage(
    title: string,
    components: Component[],
    pages: Page[],
  ): string {
    // 1. Charger le layout de base
    let html = this.loadLayout('base');

    // 2. Rendu de tous les composants
    const renderedComponents = components
      .map((comp) => {
        const componentHtml = this.loadComponent(comp.name);
        return replaceVariables(componentHtml, comp.data);
      })
      .join('\n');

    // 3. Rendu de toutes les pages
    const renderedPages = pages
      .map((page) => {
        const pageHtml = this.loadPage(page.name);
        return replaceVariables(pageHtml, page.data);
      })
      .join('\n');

    // 4. Combiner composants + pages
    const content = renderedComponents + '\n' + renderedPages;

    // 5. Injecter dans le layout de base
    html = replaceVariables(html, { title, content });

    return html;
  }

  /**
   * Méthode pour le rendu d'une étape de formulaire avec support des sessions
   */
  renderFormStep(
    stepNumber: number,
    mutabilityData?: UiMutabilityResultDto,
    sessionData?: FormSessionData | null,
  ): string {
    // Validation du numéro d'étape
    if (stepNumber < 1 || stepNumber > 3) {
      throw new Error(
        `Invalid step number: ${stepNumber}. Must be between 1 and 3.`,
      );
    }

    const validStepNumber = stepNumber as 1 | 2 | 3;
    const stepConfig: StepConfigMap = {
      1: {
        title: 'Votre site en friche',
        nextTitle: 'Données complémentaires',
        page: 'step1-map',
      },
      2: {
        title: 'Données complémentaires',
        nextTitle: 'Usages les plus appropriés',
        page: 'step2-manual-form',
      },
      3: {
        title: 'Usages les plus appropriés',
        nextTitle: 'Terminé',
        page: 'step3-podium',
      },
    };

    const config = stepConfig[validStepNumber];
    if (!config) {
      throw new Error(`Invalid step number: ${validStepNumber}`);
    }

    // Données de session pour l'affichage
    const sessionInfo = this.extractSessionDisplayData(sessionData);

    const components = [
      {
        name: 'form-header',
        data: {
          currentStep: validStepNumber,
          totalSteps: 3,
          currentStepTitle: config.title,
          nextStepTitle:
            validStepNumber < 3 ? config.nextTitle : 'Analyse terminée',
          // Ajout des informations de session
          completionPercentage: sessionInfo.completion,
          dataQualityScore: sessionInfo.quality,
          hasData: sessionInfo.hasData,
        },
      },
    ];

    // Helper functions pour un accès sécurisé aux URLs
    const getPreviousUrl = (): string | null => {
      const prevStep = (validStepNumber - 1) as 0 | 1 | 2;
      return prevStep >= 1 ? this.stepUrls[prevStep as 1 | 2] : null;
    };

    const getNextUrl = (): string | null => {
      const nextStep = (validStepNumber + 1) as 2 | 3 | 4;
      return nextStep <= 3 ? this.stepUrls[nextStep as 2 | 3] : null;
    };

    // Données pour la page
    const pageData = {
      currentStep: validStepNumber,
      showPrevious: validStepNumber > 1,
      showNext: validStepNumber < 3,
      previousStep: validStepNumber - 1,
      nextStep: validStepNumber + 1,
      // URLs pour la navigation
      previousUrl: getPreviousUrl(),
      nextUrl: getNextUrl(),
      currentUrl: this.stepUrls[validStepNumber],
      // Données de session transformées pour l'affichage
      ...sessionInfo.displayData,
      // Fusionner avec les données de mutabilité si présentes
      ...(mutabilityData || {}),
    };

    const pages = [
      {
        name: config.page,
        data: pageData,
      },
    ];

    return this.renderBasePage(
      `Mutafriches - ${config.title}`,
      components,
      pages,
    );
  }

  /**
   * Extrait les données de session pour l'affichage
   */
  private extractSessionDisplayData(sessionData?: FormSessionData | null): {
    completion: number;
    quality: number;
    hasData: boolean;
    displayData: Record<string, any>;
  } {
    if (!sessionData) {
      return {
        completion: 0,
        quality: 0,
        hasData: false,
        displayData: {},
      };
    }

    // Transformer les données de parcelle en format d'affichage
    const displayData: Record<string, any> = {};

    // Parcourir les données de parcelle et les transformer
    Object.entries(sessionData.parcelleData).forEach(
      ([key, dataWithSource]) => {
        if (
          dataWithSource.value !== undefined &&
          dataWithSource.value !== null
        ) {
          // Formatage spécifique selon le type de donnée
          displayData[key] = this.formatValueForDisplay(
            key,
            dataWithSource.value,
          );
          displayData[`${key}_source`] = dataWithSource.source;
          displayData[`${key}_confidence`] = dataWithSource.confidence;
        }
      },
    );

    // Ajouter l'identifiant de parcelle
    if (sessionData.identifiantParcelle) {
      displayData.identifiantParcelle = sessionData.identifiantParcelle;
    }

    return {
      completion: sessionData.metadata.completionPercentage,
      quality: sessionData.metadata.dataQualityScore,
      hasData: Object.keys(sessionData.parcelleData).length > 0,
      displayData,
    };
  }

  /**
   * Formate une valeur pour l'affichage selon son type
   */
  private formatValueForDisplay(key: string, value: unknown): string {
    if (value === null || value === undefined) {
      return 'Non renseigné';
    }

    // Formatage spécifique selon la clé
    switch (key) {
      case 'surfaceSite':
      case 'surfaceBati':
        if (typeof value === 'number') {
          return `${value.toLocaleString()} m²`;
        }
        return safeStringify(value);

      case 'connectionReseauElectricite':
      case 'siteEnCentreVille':
      case 'proximiteCommercesServices':
      case 'presenceRisquesTechnologiques':
        return value === true ? 'Oui' : 'Non';

      case 'distanceAutoroute':
      case 'distanceRaccordementElectrique':
        return this.formatDistance(value as number, 'km');

      case 'distanceTransportCommun':
        return this.formatDistance(value as number, 'm');

      case 'tauxLogementsVacants':
        if (typeof value === 'number') {
          return `${value}%`;
        }
        return safeStringify(value);

      default:
        return safeStringify(value);
    }
  }

  /**
   * Transforme les données d'enrichissement au format UI typé
   */
  transformEnrichmentForUI(
    enrichmentResult: EnrichmentResultDto,
  ): UiParcelleDto {
    return {
      // Données de base
      surfaceParcelle: `${enrichmentResult.surfaceSite?.toLocaleString() || 'Non renseigné'} m²`,
      surfaceBatie: `${enrichmentResult.surfaceBati?.toLocaleString() || 'Non renseigné'} m²`,
      typeProprietaire: 'Non renseigné', // Plus dans enrichmentResult, sera dans les données manuelles
      ancienneActivite: enrichmentResult.ancienneActivite || 'Non renseignée',

      // Informations parcelle
      commune: enrichmentResult.commune || 'Non renseignée',
      identifiantParcelle:
        enrichmentResult.identifiantParcelle || 'Non renseigné',
      connectionElectricite: enrichmentResult.connectionReseauElectricite
        ? 'Oui'
        : 'Non',

      // Environnement
      centreVille: enrichmentResult.siteEnCentreVille ? 'Oui' : 'Non',
      distanceAutoroute: this.formatDistance(
        enrichmentResult.distanceAutoroute,
        'km',
      ),
      distanceTrain: this.formatDistance(
        enrichmentResult.distanceTransportCommun,
        'm',
      ),
      proximiteCommerces: enrichmentResult.proximiteCommercesServices
        ? 'Oui'
        : 'Non',
      distanceRaccordement: this.formatDistance(
        enrichmentResult.distanceRaccordementElectrique,
        'km',
      ),
      tauxLV: enrichmentResult.tauxLogementsVacants
        ? `${enrichmentResult.tauxLogementsVacants}%`
        : 'Non renseigné',

      // Risques et zonage
      risquesTechno: enrichmentResult.presenceRisquesTechnologiques
        ? 'Oui'
        : 'Non',
      risquesNaturels:
        enrichmentResult.presenceRisquesNaturels?.toString() || 'Non renseigné',
      zonageEnviro:
        enrichmentResult.zonageEnvironnemental?.toString() || 'Non renseigné',
      zonageUrba: enrichmentResult.zonageReglementaire || 'Non renseigné',
      zonagePatrimonial:
        enrichmentResult.zonagePatrimonial?.toString() || 'Non renseigné',
      tvb: enrichmentResult.trameVerteEtBleue?.toString() || 'Non renseigné',

      // Données techniques
      potentielEcologique: 'À calculer',
    };
  }

  /**
   * Transforme un résultat d'enrichissement complet pour l'UI
   */
  transformEnrichmentResultForUI(
    enrichmentResult: EnrichmentResultDto,
    success: boolean = true,
    error?: string,
  ): UiEnrichmentResultDto {
    if (!success || error) {
      return {
        success: false,
        error: error || "Erreur lors de l'enrichissement",
      };
    }

    return {
      success: true,
      data: this.transformEnrichmentForUI(enrichmentResult),
      sources: enrichmentResult.sourcesUtilisees,
      fiabilite: enrichmentResult.fiabilite,
    };
  }

  /**
   * Crée un résultat d'erreur pour l'UI
   */
  createEnrichmentErrorForUI(error: string): UiEnrichmentResultDto {
    return {
      success: false,
      error,
    };
  }

  /**
   * Transforme les résultats de mutabilité au format UI typé
   */
  transformMutabilityForUI(
    mutabilityResult: MutabilityResultDto,
  ): UiMutabilityResultDto {
    return {
      fiabilite: {
        note: mutabilityResult.fiabilite.note,
        text: mutabilityResult.fiabilite.text,
        description: mutabilityResult.fiabilite.description,
      },
      resultats: mutabilityResult.resultats.map((result) => ({
        rang: result.rang,
        usage: result.usage,
        explication: result.explication,
        indiceMutabilite: result.indiceMutabilite,
        potentiel: result.potentiel,
      })),
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
