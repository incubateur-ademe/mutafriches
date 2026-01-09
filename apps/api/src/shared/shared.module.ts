import { Global, Module } from "@nestjs/common";
import { OrigineDetectionService } from "./services/origine-detection.service";

@Global()
@Module({
  providers: [OrigineDetectionService],
  exports: [OrigineDetectionService],
})
export class SharedModule {}
