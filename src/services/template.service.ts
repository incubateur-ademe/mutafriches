import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  Component,
  StepConfig,
  StepConfigMap,
  MockDataResponse,
} from '../templates/types';

@Injectable()
export class TemplateService {
  private getBasePath(): string {
    // En développement, utiliser src/templates
    if (process.env.NODE_ENV !== 'production') {
      return join(process.cwd(), 'src', 'templates');
    }
    // En production, les templates sont dans dist/templates
    return join(__dirname, '..', '..', 'templates');
  }

  private loadTemplate(templateName: string): string {
    const templatePath = join(this.getBasePath(), `${templateName}.html`);
    return readFileSync(templatePath, 'utf8');
  }

  private loadComponent(componentName: string): string {
    const componentPath = join(
      this.getBasePath(),
      'components',
      `${componentName}.html`,
    );
    return readFileSync(componentPath, 'utf8');
  }

  private loadStepComponent(stepComponentName: string): string {
    const stepPath = join(
      this.getBasePath(),
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
        title: 'Votre site en friche',
        nextTitle: 'Données complémentaires',
        component: 'step1-map',
      },
      2: {
        title: 'Données complémentaires',
        nextTitle: 'Résultats',
        component: 'step2-manual-form',
      },
      3: {
        title: 'Analyse de mutabilité',
        nextTitle: 'Terminé',
        component: 'step3-podium',
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
          totalSteps: 3,
          currentStepTitle: config.title,
          nextStepTitle: stepNumber < 3 ? config.nextTitle : 'Analyse terminée',
        },
      },
      {
        name: config.component,
        data: {
          ...formData,
          currentStep: stepNumber,
          showPrevious: stepNumber > 1,
          showNext: stepNumber < 3,
          previousStep: stepNumber - 1,
          nextStep: stepNumber + 1,
        },
      },
    ];

    return this.renderIframePage(`Mutafriches - ${config.title}`, components);
  }
}
