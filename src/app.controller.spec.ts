import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { UiService } from './ui/ui.service';
import { DatabaseService } from './services/database.service';
import { MockService } from './mocks/mock.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        { provide: UiService, useValue: {} },
        { provide: DatabaseService, useValue: {} },
        { provide: MockService, useValue: {} },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('should be defined', () => {
    expect(appController).toBeDefined();
  });
});
