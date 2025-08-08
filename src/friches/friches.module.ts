import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ParcelleEnrichmentService } from './services/parcelle-enrichment.service';
import { MutabilityCalculationService } from './services/mutability-calculation.service';
import { FrichesController } from './controller/friches.controller';
import { MockModule } from '../mock/mock.module';
import { CadastreService } from './services/external-apis/cadastre/cadastre.service';
import { BdnbService } from './services/external-apis/bdnb/bdnb.service';

@Module({
  imports: [HttpModule, MockModule],
  controllers: [FrichesController],
  providers: [
    CadastreService,
    BdnbService,
    ParcelleEnrichmentService,
    MutabilityCalculationService,
  ],
  exports: [
    CadastreService,
    BdnbService,
    ParcelleEnrichmentService,
    MutabilityCalculationService,
  ],
})
export class FrichesModule {}
