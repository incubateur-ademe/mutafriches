import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { UiService } from './ui/ui.service';
import { AnalyticsService } from './analytics/analytics.service';
import { DatabaseService } from './shared/database/database.service';
import { MockService } from './mocks/mock.service';
import { UiController } from './ui/ui.controller';

@Module({
  imports: [],
  controllers: [AppController, UiController],
  providers: [UiService, AnalyticsService, DatabaseService, MockService],
})
export class AppModule {}
