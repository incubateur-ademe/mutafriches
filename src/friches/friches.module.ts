import { Module } from '@nestjs/common';
import { ParcelleEnrichmentService } from './services/parcelle-enrichment.service';
import { MockService } from '../friches-mock/mock-api.service';
import { FrichesController } from './controller/friches.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [FrichesController],
  providers: [ParcelleEnrichmentService, MockService],
  exports: [ParcelleEnrichmentService],
})
export class FrichesModule {}
