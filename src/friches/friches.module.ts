import { Module } from '@nestjs/common';
import { ParcelleEnrichmentService } from './services/parcelle-enrichment.service';
import { MutabilityCalculationService } from './services/mutability-calculation.service';
import { FrichesController } from './controller/friches.controller';
import { HttpModule } from '@nestjs/axios';
import { FrichesMockModule } from '../friches-mock/friches-mock.module';

@Module({
  imports: [HttpModule, FrichesMockModule],
  controllers: [FrichesController],
  providers: [ParcelleEnrichmentService, MutabilityCalculationService],
  exports: [ParcelleEnrichmentService, MutabilityCalculationService],
})
export class FrichesModule {}
