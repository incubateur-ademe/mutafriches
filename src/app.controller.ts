import { Controller, Get, Res } from '@nestjs/common';
import { DatabaseService } from './shared/database/database.service';
import { UiService } from './ui/ui.service';
import { MockService } from './mocks/mock.service';
import { HealthResponse } from './shared/types/common.types';

interface SimpleResponse {
  setHeader(name: string, value: string): void;
  send(body: string): void;
}

@Controller()
export class AppController {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly uiService: UiService,
    private readonly mockService: MockService,
  ) {}

  @Get('health')
  async healthCheck(): Promise<HealthResponse> {
    const timestamp = new Date().toISOString();

    const health: HealthResponse = {
      status: 'OK',
      timestamp,
      service: 'Mutafriches API',
      checks: {
        api: 'OK',
        database: 'OK',
      },
    };

    // Test de la connexion base de données
    try {
      if (this.databaseService.db) {
        await this.databaseService.db.execute('SELECT 1 as test');
        health.checks.database = 'OK';
      } else {
        health.checks.database = 'DISCONNECTED';
        health.status = 'DEGRADED';
      }
    } catch {
      health.checks.database = 'ERROR';
      health.status = 'DEGRADED';
    }

    return health;
  }

  @Get()
  getHome(@Res() res: SimpleResponse): void {
    // Page d'accueil du formulaire (étape 1) directement sur /
    const mockData = this.mockService.getDataForStep(1);
    const html = this.uiService.renderFormStep(1, mockData);

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }
}
