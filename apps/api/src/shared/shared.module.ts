import { Global, Module } from "@nestjs/common";
import { IntegrateurOriginGuard } from "./guards";
import { OrigineDetectionService } from "./services/origine-detection.service";

@Global()
@Module({
  providers: [OrigineDetectionService, IntegrateurOriginGuard],
  exports: [OrigineDetectionService, IntegrateurOriginGuard],
})
export class SharedModule {}
