import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  Component,
  StepConfig,
  StepConfigMap,
  MockDataResponse,
} from './types';

@Injectable()
export class TemplateService {
  private loadTemplate(templateName: string): string {
    const templatePath = join(__dirname, `${templateName}.html`);

    // En développement, ne pas mettre en cache
    if (process.env.NODE_ENV !== 'production') {
      return readFileSync(templatePath, 'utf8');
    }

    return readFileSync(templatePath, 'utf8');
  }

  private loadComponent(componentName: string): string {
    const componentPath = join(
      __dirname,
      'components',
      `${componentName}.html`,
    );
    return readFileSync(componentPath, 'utf8');
  }

  private loadStepComponent(stepComponentName: string): string {
    const stepPath = join(
      __dirname,
      'components',
      'steps',
      `${stepComponentName}.html`,
    );
    return readFileSync(stepPath, 'utf8');
  }

  private renderComponent(
    componentName: string,
    data: Record<string, any>,
  ): string {
    let html: string;

    // Vérifier si c'est un composant d'étape
    if (componentName.startsWith('step') && componentName !== 'stepper') {
      html = this.loadStepComponent(componentName);
    } else {
      html = this.loadComponent(componentName);
    }

    Object.keys(data).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, String(data[key] ?? ''));
    });

    return html;
  }

  renderIframePage(title: string, components: Component[]): string {
    let html = this.loadTemplate('iframe');

    const content = components
      .map((comp) => this.renderComponent(comp.name, comp.data))
      .join('\n');

    html = html.replace('{{title}}', title);
    html = html.replace('{{content}}', content);

    return html;
  }

  renderFormStep(stepNumber: number, formData: MockDataResponse = {}): string {
    const stepConfig: StepConfigMap = {
      1: {
        title: 'Choix de la parcelle',
        nextTitle: 'Données automatiques',
        component: 'step1-map',
      },
      2: {
        title: 'Données récupérées',
        nextTitle: 'Saisie manuelle',
        component: 'step2-auto-data',
      },
      3: {
        title: 'Informations complémentaires',
        nextTitle: 'Résultats',
        component: 'step3-manual-form',
      },
      4: {
        title: 'Analyse de mutabilité',
        nextTitle: 'Terminé',
        component: 'step4-podium',
      },
    };

    const config: StepConfig = stepConfig[stepNumber];
    if (!config) {
      throw new Error(`Invalid step number: ${stepNumber}`);
    }
    const components = [
      {
        name: 'stepper',
        data: {
          currentStep: stepNumber,
          totalSteps: 4,
          currentStepTitle: config.title,
          nextStepTitle: stepNumber < 4 ? config.nextTitle : 'Analyse terminée',
        },
      },
      {
        name: config.component,
        data: {
          ...formData,
          currentStep: stepNumber,
          showPrevious: stepNumber > 1,
          showNext: stepNumber < 4,
          previousStep: stepNumber - 1,
          nextStep: stepNumber + 1,
        },
      },
    ];

    return this.renderIframePage(`Mutafriches - ${config.title}`, components);
  }
}
