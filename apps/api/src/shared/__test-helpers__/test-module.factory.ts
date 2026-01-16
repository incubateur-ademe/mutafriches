import { Test, TestingModule } from "@nestjs/testing";
import { Type } from "@nestjs/common";
import { vi } from "vitest";

/**
 * Type helper pour extraire les types des méthodes mockées
 */
type MockFactory<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? ReturnType<typeof vi.fn> : T[K];
};

/**
 * Configuration pour un service à mocker
 */
interface ServiceMockConfig<T> {
  provide: Type<T>;
  mock: Partial<MockFactory<T>>;
}

/**
 * Résultat de la création du module de test
 */
interface TestModuleResult<Controller, Services> {
  module: TestingModule;
  controller: Controller;
  mocks: Services;
}

/**
 * Crée un TestingModule NestJS avec des mocks de services
 *
 * @example
 * const { controller, mocks } = await createTestingModuleWithMocks(
 *   EvaluationController,
 *   [
 *     { provide: OrchestrateurService, mock: createMockOrchestrateurService() }
 *   ]
 * );
 */
export async function createTestingModuleWithMocks<
  Controller,
  Services extends Record<string, any>,
>(
  controller: Type<Controller>,
  services: ServiceMockConfig<any>[],
): Promise<TestModuleResult<Controller, Services>> {
  const mocks: Record<string, any> = {};
  const providers: any[] = [];

  for (const { provide, mock } of services) {
    const serviceName = provide.name;
    mocks[serviceName] = mock;

    providers.push({
      provide,
      useValue: mock,
    });
  }

  const module = await Test.createTestingModule({
    controllers: [controller],
    providers,
  }).compile();

  const controllerInstance = module.get<Controller>(controller);

  return {
    module,
    controller: controllerInstance,
    mocks: mocks as Services,
  };
}

/**
 * Crée automatiquement un mock pour toutes les méthodes d'un service
 *
 * @example
 * const mock = createAutoMock(EnrichissementService);
 */
export function createAutoMock<T>(ServiceClass: Type<T>): MockFactory<T> {
  const mockService = {} as MockFactory<T>;
  const prototype = ServiceClass.prototype;

  for (const methodName of Object.getOwnPropertyNames(prototype)) {
    if (methodName !== "constructor" && typeof prototype[methodName] === "function") {
      (mockService as any)[methodName] = vi.fn();
    }
  }

  return mockService;
}

/**
 * Helper pour créer rapidement un module avec un seul service
 *
 * @example
 * const { controller, service } = await createTestingModuleWithService(
 *   EvaluationController,
 *   OrchestrateurService,
 *   createMockOrchestrateurService()
 * );
 */
export async function createTestingModuleWithService<Controller, Service>(
  controller: Type<Controller>,
  serviceClass: Type<Service>,
  serviceMock: Partial<MockFactory<Service>>,
): Promise<{
  module: TestingModule;
  controller: Controller;
  service: Partial<MockFactory<Service>>;
}> {
  const module = await Test.createTestingModule({
    controllers: [controller],
    providers: [
      {
        provide: serviceClass,
        useValue: serviceMock,
      },
    ],
  }).compile();

  const controllerInstance = module.get<Controller>(controller);

  return {
    module,
    controller: controllerInstance,
    service: serviceMock,
  };
}

/**
 * Helper pour creer un module avec deux services
 *
 * @example
 * const { controller, service1, service2 } = await createTestingModuleWithTwoServices(
 *   EvaluationController,
 *   OrchestrateurService,
 *   createMockOrchestrateurService(),
 *   OrigineDetectionService,
 *   createMockOrigineDetectionService(),
 * );
 */
export async function createTestingModuleWithTwoServices<Controller, Service1, Service2>(
  controller: Type<Controller>,
  serviceClass1: Type<Service1>,
  serviceMock1: Partial<MockFactory<Service1>>,
  serviceClass2: Type<Service2>,
  serviceMock2: Partial<MockFactory<Service2>>,
): Promise<{
  module: TestingModule;
  controller: Controller;
  service1: Partial<MockFactory<Service1>>;
  service2: Partial<MockFactory<Service2>>;
}> {
  const module = await Test.createTestingModule({
    controllers: [controller],
    providers: [
      {
        provide: serviceClass1,
        useValue: serviceMock1,
      },
      {
        provide: serviceClass2,
        useValue: serviceMock2,
      },
    ],
  }).compile();

  const controllerInstance = module.get<Controller>(controller);

  return {
    module,
    controller: controllerInstance,
    service1: serviceMock1,
    service2: serviceMock2,
  };
}

/**
 * Réinitialise tous les mocks d'un objet
 *
 * @example
 * clearAllMocks(mocks);
 */
export function clearAllMocks(mocks: Record<string, any>): void {
  for (const service of Object.values(mocks)) {
    if (service && typeof service === "object") {
      for (const method of Object.values(service)) {
        if (typeof method === "function" && "mockClear" in method) {
          (method as ReturnType<typeof vi.fn>).mockClear();
        }
      }
    }
  }
}
