import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ParcelleEnrichmentService } from "./services/parcelle-enrichment/parcelle-enrichment.service";
import { MutabilityCalculationService } from "./services/mutability/mutability-calculation.service";
import { FrichesController } from "./controller/friches.controller";
import { MockModule } from "../mock/mock.module";
import { CadastreService } from "./services/external-apis/cadastre/cadastre.service";
import { BdnbService } from "./services/external-apis/bdnb/bdnb.service";
import { EnedisService } from "./services/external-apis/enedis/enedis.service";

@Module({
  imports: [HttpModule, MockModule],
  controllers: [FrichesController],
  providers: [
    CadastreService,
    BdnbService,
    EnedisService,
    ParcelleEnrichmentService,
    MutabilityCalculationService,
  ],
  exports: [
    CadastreService,
    BdnbService,
    EnedisService,
    ParcelleEnrichmentService,
    MutabilityCalculationService,
  ],
})
export class FrichesModule {}
