import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { join } from "path";
import { NestExpressApplication } from "@nestjs/platform-express";
import { SwaggerModule } from "@nestjs/swagger";
import { Request, Response, NextFunction } from "express";
import { ValidationPipe, Logger } from "@nestjs/common";
import helmet from "helmet";
import {
  construireOriginesCors,
  estOrigineCorsAutorisee,
  isEnvironnementNonDeclare,
  isProduction,
} from "./shared/utils";
import { buildSwaggerConfig, getSwaggerSetupOptions } from "./shared/swagger";
import { getAppConfig } from "./config";
import { SafeConsoleLogger } from "./shared/logger/safe-console-logger";

async function bootstrap() {
  const logger = new Logger("Bootstrap");

  try {
    // Fail-fast : valide les variables d'environnement avant tout démarrage
    const config = getAppConfig();

    const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });

    // Le calcul renvoie l'enrichissement complet, géométries comprises : un site de 55 parcelles
    // dépasse déjà la limite Express par défaut (100 Ko) dès que le JSON est indenté.
    app.useBodyParser("json", { limit: "2mb" });

    // Logger assainissant : évite de dérouler les objets erreur Axios (flood de logs)
    app.useLogger(new SafeConsoleLogger());

    if (isEnvironnementNonDeclare()) {
      logger.warn(
        "NODE_ENV absent : réglages de production appliqués (guards actifs, CORS restreint). Poser NODE_ENV=development en local.",
      );
    }

    // En-têtes de sécurité (ADR-0051). CSP et frameguard restent désactivés : l'UI est embarquée
    // en iframe par les intégrateurs et charge des tiers (DSFR, tuiles IGN, Metabase, ZCal).
    app.use(
      helmet({
        contentSecurityPolicy: false,
        frameguard: false,
        crossOriginEmbedderPolicy: false,
        crossOriginOpenerPolicy: false,
        crossOriginResourcePolicy: { policy: "cross-origin" },
      }),
    );

    // CORS restreint à nos origines, aux dashboards ADEME et aux intégrateurs déclarés ; toute
    // origine locale est acceptée en développement (port Vite glissant). Une origine hors liste
    // serait de toute façon refusée par les guards : on cesse seulement de refléter « * ».
    const originesCors = construireOriginesCors(config.origins);
    app.enableCors({
      origin: (origine: string | undefined, callback) =>
        callback(null, estOrigineCorsAutorisee(origine, originesCors)),
      exposedHeaders: ["Content-Disposition", "X-Export-Rapport"],
    });

    // Configuration de la validation
    app.useGlobalPipes(new ValidationPipe());

    // Configuration Swagger (voir shared/swagger/swagger.config.ts)
    const document = SwaggerModule.createDocument(app, buildSwaggerConfig());
    SwaggerModule.setup("api", app, document, getSwaggerSetupOptions());

    // Route pour récupérer le document OpenAPI en JSON
    app.use("/api-json", (req: Request, res: Response) => {
      res.json(document);
    });

    // Trust proxy pour Scalingo et autres environnements
    if (isProduction()) {
      app.set("trust proxy", 1);
      logger.log("Proxy configuré pour l'environnement de production");
    }

    if (isProduction()) {
      const uiPath = "/app/apps/dist-ui";
      logger.log(`Configuration UI React en production : ${uiPath}`);

      app.useStaticAssets(uiPath);

      // Catch-all route pour le SPA React
      app.use((req: Request, res: Response, next: NextFunction) => {
        // Ne pas intercepter les routes API et les assets
        if (
          req.path.startsWith("/api") ||
          req.path.startsWith("/enrichissement") ||
          req.path.startsWith("/evaluation") ||
          req.path.startsWith("/evenements") ||
          req.path.startsWith("/health") ||
          req.path.includes(".")
        ) {
          return next();
        }

        // Servir index.html pour toutes les autres routes (SPA)
        res.sendFile(join(uiPath, "index.html"));
      });
    }

    const port = config.runtime.port;
    const host = isProduction() ? "0.0.0.0" : "localhost";

    await app.listen(port, host);

    logger.log(`Application lancee sur : http://${host}:${port}`);
    logger.log(`Documentation Swagger sur : http://${host}:${port}/api`);

    if (!isProduction()) {
      const blue = "\x1b[34m";
      const reset = "\x1b[0m";
      logger.log(`${blue}UI en dev sur : http://localhost:5173${reset}`);
    }
  } catch (err) {
    logger.error("Erreur lors du démarrage de l'application", err as Error);
    process.exit(1);
  }
}

bootstrap();
