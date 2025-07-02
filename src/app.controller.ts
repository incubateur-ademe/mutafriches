import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { TemplateService } from './templates/template.service';

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
  getIframe(@Res() res: Response) {
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
}
