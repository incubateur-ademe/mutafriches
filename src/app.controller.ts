import { Controller, Get, Res, Param } from '@nestjs/common';
import { Response } from 'express';
import { TemplateService } from './templates/template.service';
import { MockDataResponse, UsageResult } from './templates/types';

@Controller()
export class AppController {
  constructor(private readonly templateService: TemplateService) {}

  @Get()
  getHello() {
    return { message: 'Mutafriches API is running!' };
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'Mutafriches API',
    };
  }

  @Get('iframe')
  getIframe(@Res() res: Response): void {
    const components = [
      {
        name: 'hero',
        data: {
          title: 'Mutafriches',
          subtitle: "API pour l'analyse de mutabilité des friches urbaines",
        },
      },
      {
        name: 'callout',
        data: {
          title: 'Mutafriches - Iframe',
          text: "Cette iframe utilise le Système de Design de l'État français (DSFR).",
          buttonText: "Commencer l'analyse",
          buttonAction: 'goToForm(1)',
        },
      },
    ];

    const html = this.templateService.renderIframePage(
      'Mutafriches - Analyse des friches',
      components,
    );

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  @Get('form/:step')
  getFormStep(@Param('step') step: string, @Res() res: Response): void {
    const stepNumber = parseInt(step, 10);

    if (stepNumber < 1 || stepNumber > 4 || isNaN(stepNumber)) {
      res.status(400).send('Étape invalide');
      return;
    }

    const mockData: MockDataResponse = this.getMockDataForStep(stepNumber);

    const html = this.templateService.renderFormStep(stepNumber, mockData);

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  private getMockDataForStep(step: number): MockDataResponse {
    switch (step) {
      case 1:
        return {};
      case 2:
        return {
          surfaceParcelle: '42 780 m²',
          surfaceBatie: '6 600 m²',
          typeProprietaire: 'Privé',
          ancienneActivite: 'Manufacture',
          centreVille: 'Oui',
          distanceAutoroute: 'Entre 1 et 2km',
          distanceTrain: 'Moins de 500m',
          proximiteCommerces: 'Oui',
          distanceRaccordement: 'Moins de 1km',
          tauxLV: '4,9%',
          risquesTechno: 'Non',
          risquesNaturels: 'Faible',
          potentielEcologique: 'Moyen',
          zonageEnviro: 'Hors zone',
          zonageUrba: 'Zone urbaine – U',
          zonagePatrimonial: 'Non concerné',
          tvb: 'Hors trame',
        };
      case 3:
        return {};
      case 4: {
        const results: UsageResult[] = [
          {
            usage: 'Résidentiel ou mixte',
            indice: 68,
            classement: 7,
            potentiel: 'Très favorable',
          },
          {
            usage: 'Équipements publics',
            indice: 63,
            classement: 6,
            potentiel: 'Favorable',
          },
          {
            usage: 'Culture, tourisme',
            indice: 56,
            classement: 4,
            potentiel: 'Modéré',
          },
          {
            usage: 'Tertiaire',
            indice: 60,
            classement: 5,
            potentiel: 'Modéré',
          },
          {
            usage: 'Industrie',
            indice: 54,
            classement: 3,
            potentiel: 'Modéré',
          },
          {
            usage: 'Renaturation',
            indice: 41,
            classement: 1,
            potentiel: 'Peu favorable',
          },
          {
            usage: 'Photovoltaïque au sol',
            indice: 47,
            classement: 2,
            potentiel: 'Peu favorable',
          },
        ];
        return {
          results,
          fiabilite: 9.5,
        };
      }
      default:
        return {};
    }
  }
}
