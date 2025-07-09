import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { TemplateService } from './services/template.service';
import { AnalyticsService } from './services/analytics.service';
import { DatabaseService } from './services/database.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [TemplateService, AnalyticsService, DatabaseService],
})
export class AppModule {}
