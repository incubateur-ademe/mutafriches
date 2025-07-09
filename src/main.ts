import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Assets DSFR
  app.useStaticAssets(join(__dirname, '..', 'node_modules/@gouvfr/dsfr/dist'), {
    prefix: '/dsfr/',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log('\nApplication is running on: http://localhost:3000');
}

bootstrap().catch((err) => {
  console.error("Erreur lors du démarrage de l'application:", err);
  process.exit(1);
});
