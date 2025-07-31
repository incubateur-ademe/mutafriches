import { Module } from '@nestjs/common';
import { ParcelleEnrichmentService } from './services/parcelle-enrichment.service';
import { FrichesController } from './controller/friches.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [FrichesController],
  providers: [ParcelleEnrichmentService],
  exports: [ParcelleEnrichmentService],
})
export class FrichesModule {}
