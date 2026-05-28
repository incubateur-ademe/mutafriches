import { Module } from "@nestjs/common";
import { ImportStatusController } from "./import-status.controller";
import { ImportStatusService } from "./import-status.service";

@Module({
  controllers: [ImportStatusController],
  providers: [ImportStatusService],
})
export class ImportStatusModule {}
