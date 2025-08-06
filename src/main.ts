import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import * as session from 'express-session';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Configuration de la validation
  app.useGlobalPipes(new ValidationPipe());

  // Configuration Swagger
  const config = new DocumentBuilder()
    .setTitle('Mutafriches API')
    .setDescription('API pour analyser la mutabilité des friches urbaines')
    .setVersion('1.0')
    .addTag('friches', 'Opérations sur les friches urbaines')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  });

  // Configuration de express-session
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'mutafriches-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 heures
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      },
    }),
  );

  // Assets DSFR - chemin adaptatif selon l'environnement
  const isProduction = process.env.NODE_ENV === 'production';
  const dsfrPath = isProduction
    ? join(__dirname, '..', '..', 'node_modules/@gouvfr/dsfr/dist') // Production
    : join(process.cwd(), 'node_modules/@gouvfr/dsfr/dist'); // Développement

  app.useStaticAssets(dsfrPath, {
    prefix: '/dsfr/',
  });

  // Assets publics (images, etc.) - chemin adaptatif selon l'environnement
  const publicPath = isProduction
    ? join(__dirname, '..', 'public') // Production (dist/public)
    : join(process.cwd(), 'public'); // Développement (public)

  app.useStaticAssets(publicPath);

  const port = process.env.PORT || 3000;
  const host = isProduction ? '0.0.0.0' : 'localhost';

  await app.listen(port, host);
  console.log(`Application lancée sur : http://${host}:${port}`);
  console.log(`Documentation swagger sur : http://${host}:${port}/api`);
}

bootstrap().catch((err) => {
  console.error("Erreur lors du démarrage de l'application:", err);
  process.exit(1);
});
