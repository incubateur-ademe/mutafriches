import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'Mutafriches',
    };
  }

  @Get('iframe')
  getIframe(@Res() res: Response) {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Mutafriches - Hello World</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                padding: 20px; 
                text-align: center;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                margin: 0;
                height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-direction: column;
            }
            h1 { margin-bottom: 20px; }
            p { font-size: 18px; opacity: 0.9; }
        </style>
    </head>
    <body>
        <div>
            <h1>Mutafriches</h1>
            <p>API pour l'analyse de mutabilité des friches</p>
            <p><em>Hello World - Iframe fonctionnelle !</em></p>
        </div>
    </body>
    </html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }
}
