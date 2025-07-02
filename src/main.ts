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

  const port = 3000;
  await app.listen(port);
  console.log('\n🚀 Application is running on: http://localhost:3000');
}

bootstrap();
