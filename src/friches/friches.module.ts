import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ParcelleEnrichmentService } from './services/parcelle-enrichment.service';
import { MutabilityCalculationService } from './services/mutability-calculation.service';
import { FrichesController } from './controller/friches.controller';
import { MockModule } from '../mock/mock.module';
import { CadastreService } from './services/external-apis/cadastre/cadastre.service';

@Module({
  imports: [HttpModule, MockModule],
  controllers: [FrichesController],
  providers: [
    CadastreService,
    ParcelleEnrichmentService,
    MutabilityCalculationService,
  ],
  exports: [
    CadastreService,
    ParcelleEnrichmentService,
    MutabilityCalculationService,
  ],
})
export class FrichesModule {}
