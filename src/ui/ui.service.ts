import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Component, Page, StepConfigMap } from './ui.types';
import { MockData } from '../mocks/mock.types';
import { replaceVariables } from './ui.utils';

@Injectable()
export class UiService {
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

    const config = stepConfig[stepNumber];
    if (!config) {
      throw new Error(`Invalid step number: ${stepNumber}`);
    }

    const components = [
      {
        name: 'form-header',
        data: {
          currentStep: stepNumber,
          totalSteps: 3,
          currentStepTitle: config.title,
          nextStepTitle: stepNumber < 3 ? config.nextTitle : 'Analyse terminée',
        },
      },
    ];

    const pages = [
      {
        name: config.page,
        data: {
          // Spread des données mockées (sera aplati par replaceVariables)
          ...(formData || {}),
          currentStep: stepNumber,
          showPrevious: stepNumber > 1,
          showNext: stepNumber < 3,
          previousStep: stepNumber - 1,
          nextStep: stepNumber + 1,
        },
      },
    ];

    return this.renderBasePage(
      `Mutafriches - ${config.title}`,
      components,
      pages,
    );
  }
}
