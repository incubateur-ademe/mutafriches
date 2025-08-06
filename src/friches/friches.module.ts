import { Module } from '@nestjs/common';
import { ParcelleEnrichmentService } from './services/parcelle-enrichment.service';
import { MutabilityCalculationService } from './services/mutability-calculation.service';
import { FrichesController } from './controller/friches.controller';
import { HttpModule } from '@nestjs/axios';
import { MockModule } from '../mock/mock.module';

@Module({
  imports: [HttpModule, MockModule],
  controllers: [FrichesController],
  providers: [ParcelleEnrichmentService, MutabilityCalculationService],
  exports: [ParcelleEnrichmentService, MutabilityCalculationService],
})
export class FrichesModule {}
