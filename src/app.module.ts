import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { UiService } from './ui/ui.service';
import { AnalyticsService } from './services/analytics.service';
import { DatabaseService } from './services/database.service';
import { MockService } from './mocks/mock.service';
import { UiController } from './ui/ui.controller';

@Module({
  imports: [],
  controllers: [AppController, UiController],
  providers: [UiService, AnalyticsService, DatabaseService, MockService],
})
export class AppModule {}
