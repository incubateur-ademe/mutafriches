import { Controller, Get, Res, Param } from '@nestjs/common';
import { Response } from 'express';
import { UiService } from './ui.service';
import { MockService } from '../mocks/mock.service';

@Controller('form')
export class UiController {
  constructor(
    private readonly uiService: UiService,
    private readonly mockService: MockService,
  ) {}

  @Get(':step')
  getStep(@Param('step') step: string, @Res() res: Response): void {
    const stepNumber = parseInt(step, 10);

    if (stepNumber < 1 || stepNumber > 3 || isNaN(stepNumber)) {
      res.status(400).send('Étape invalide');
      return;
    }

    const mockData = this.mockService.getDataForStep(stepNumber);
    const html = this.uiService.renderFormStep(stepNumber, mockData);

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }
}
