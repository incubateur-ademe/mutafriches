import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { join } from "path";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { Request, Response, NextFunction } from "express";
import { ValidationPipe, Logger } from "@nestjs/common";
import packageJson from "./../../../package.json";

async function bootstrap() {
  const logger = new Logger("Bootstrap");

  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    // TODO : Revoir la configuration CORS
    app.enableCors();

    // Configuration de la validation
    app.useGlobalPipes(new ValidationPipe());

    // Configuration Swagger
    const config = new DocumentBuilder()
      .setTitle("Mutafriches API")
      .setDescription("API pour analyser la mutabilité des friches urbaines")
      .setVersion(packageJson.version)
      .addTag("enrichissement", "Module d'enrichissement des parcelles")
      .addTag("evaluation", "Module d'évaluation de la mutabilité")
      .addTag("friches", "Routes de compatibilité (deprecated)")
      .addTag("evenements", "Tracking des événements utilisateur")
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api", app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
      },
    });

    // Trust proxy pour Scalingo et autres environnements
    if (process.env.NODE_ENV === "production") {
      app.set("trust proxy", 1);
      logger.log("Proxy configuré pour l'environnement de production");
    }

    // Configuration CORS pour le développement
    if (process.env.NODE_ENV !== "production") {
      app.enableCors({
        origin: "http://localhost:5173",
        credentials: true,
      });
      logger.log("CORS configuré pour le développement (http://localhost:5173)");
    }

    const isProduction = process.env.NODE_ENV === "production";
    if (isProduction) {
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
          req.path.startsWith("/friches") || // Legacy
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

    const port = process.env.PORT || 3000;
    const host = isProduction ? "0.0.0.0" : "localhost";

    await app.listen(port, host);

    logger.log(`Application lancée sur : http://${host}:${port}`);
    logger.log(`Documentation Swagger sur : http://${host}:${port}/api`);

    if (!isProduction) {
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
