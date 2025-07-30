import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Component, Page, StepConfigMap } from './ui.types';
import { MockData } from '../mocks/mock.types';
import { replaceVariables } from './ui.utils';

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
    return join(__dirname, '..', '..', 'ui');
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

  // Méthode pour le rendu d'une étape de formulaire
  renderFormStep(stepNumber: number, formData: MockData = undefined): string {
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

    // TODO : Ajouter une validation pour formData si nécessaire

    const components = [
      {
        name: 'form-header',
        data: {
          currentStep: validStepNumber,
          totalSteps: 3,
          currentStepTitle: config.title,
          nextStepTitle:
            validStepNumber < 3 ? config.nextTitle : 'Analyse terminée',
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

    // Données pour la page avec les nouvelles URLs
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
      // Fusionner avec les données mockées
      ...(formData || {}),
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
}
