import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, Type, Provider } from "@nestjs/common";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";

export interface TestAppConfig {
  controller: Type<unknown>;
  providers: Provider[];
}

/**
 * Cree une application NestJS de test avec le throttler configure
 * Limite basse (5 req/min) pour faciliter les tests de rate limiting
 */
export async function createThrottledTestApp(config: TestAppConfig): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      ThrottlerModule.forRoot([
        {
          ttl: 60000, // 1 minute
          limit: 5, // Limite basse pour les tests
        },
      ]),
    ],
    controllers: [config.controller],
    providers: [
      {
        provide: APP_GUARD,
        useClass: ThrottlerGuard,
      },
      ...config.providers,
    ],
  }).compile();

  const app = moduleFixture.createNestApplication();
  await app.init();

  return app;
}
