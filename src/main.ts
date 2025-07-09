import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Assets DSFR - chemin adaptatif selon l'environnement
  const isProduction = process.env.NODE_ENV === 'production';
  const dsfrPath = isProduction
    ? join(__dirname, '..', '..', 'node_modules/@gouvfr/dsfr/dist') // Production
    : join(process.cwd(), 'node_modules/@gouvfr/dsfr/dist'); // Développement

  app.useStaticAssets(dsfrPath, {
    prefix: '/dsfr/',
  });

  const port = process.env.PORT || 3000;
  const host = isProduction ? '0.0.0.0' : 'localhost';

  await app.listen(port, host);
  console.log(`Application running on: http://${host}:${port}`);
}

bootstrap().catch((err) => {
  console.error("Erreur lors du démarrage de l'application:", err);
  process.exit(1);
});
