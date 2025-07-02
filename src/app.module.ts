import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { TemplateService } from './templates/template.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [TemplateService],
})
export class AppModule {}
