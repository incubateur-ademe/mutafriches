import { Controller, Get, Res } from '@nestjs/common';
import { UiService } from './ui.service';
import { MockService } from '../mocks/mock.service';
import { SimpleResponse } from '../shared/types/common.types';

@Controller('analyse')
export class UiController {
  constructor(
    private readonly uiService: UiService,
    private readonly mockService: MockService,
  ) {}

  // Méthode commune pour rendre les étapes
  private renderStep(stepNumber: number, res: SimpleResponse): void {
    const mockData = this.mockService.getDataForStep(stepNumber);
    const html = this.uiService.renderFormStep(stepNumber, mockData);

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  // Étape 1 : Localisation
  @Get('localisation')
  getLocationStep(@Res() res: SimpleResponse): void {
    this.renderStep(1, res);
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
}
