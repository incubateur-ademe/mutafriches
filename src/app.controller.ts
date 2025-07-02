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
      service: 'Mutafriches API',
    };
  }

  @Get('iframe')
  getIframe(@Res() res: Response) {
    const html = `
    <!doctype html>
    <html lang="fr" data-fr-scheme="system">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
        <meta name="format-detection" content="telephone=no,date=no,address=no,email=no,url=no">
        
        <meta name="theme-color" content="#000091">
        <link rel="icon" href="/dsfr/favicon/favicon.svg" type="image/svg+xml">
        <link rel="shortcut icon" href="/dsfr/favicon/favicon.ico" type="image/x-icon">
        
        <link rel="stylesheet" href="/dsfr/dsfr.min.css">
        <link rel="stylesheet" href="/dsfr/utility/utility.min.css">
        
        <title>Mutafriches - Analyse des friches</title>
    </head>
    <body>
        <script type="module">
            const e="system",t="dark",c="dark",o="data-fr-theme",a="data-fr-scheme",r=\`:root[\${o}], :root[\${a}]\`,m=()=>{document.documentElement.setAttribute(o,c),document.documentElement.style.colorScheme="dark"},n=()=>{window.matchMedia("(prefers-color-scheme: dark)").matches&&m()};(()=>{if(document.documentElement.matches(r)){const c=(()=>{try{return"localStorage"in window&&null!==window.localStorage}catch(e){return!1}})()?localStorage.getItem("scheme"):"",o=document.documentElement.getAttribute(a);switch(!0){case c===t:m();break;case c===e:n();break;case o===t:m();break;case o===e:n()}}})();
        </script>

        <div class="fr-container fr-py-4w">
            <div class="fr-grid-row fr-grid-row--center">
                <div class="fr-col-12 fr-col-md-8">
                    <h1 class="fr-h1">Mutafriches</h1>
                    <p class="fr-text--lead">API pour l'analyse de mutabilité des friches urbaines</p>
                    
                    <div class="fr-callout">
                        <h3 class="fr-callout__title">Hello World - Iframe fonctionnelle !</h3>
                        <p class="fr-callout__text">
                            Cette iframe utilise maintenant le Système de Design de l'État français (DSFR).
                        </p>
                    </div>
                    
                    <div class="fr-mt-4w">
                        <button class="fr-btn fr-btn--primary fr-btn--icon-left fr-icon-arrow-right-line">
                            Commencer l'analyse
                        </button>
                        <button class="fr-btn fr-btn--secondary fr-ml-2w">
                            En savoir plus
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <script type="module" src="/dsfr/dsfr.module.min.js"></script>
        <script type="text/javascript" nomodule src="/dsfr/dsfr.nomodule.min.js"></script>
    </body>
    </html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }
}
