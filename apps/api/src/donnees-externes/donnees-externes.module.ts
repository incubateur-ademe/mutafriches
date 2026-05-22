import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { DonneesExternesController } from "./donnees-externes.controller";
import { ImportsService } from "./imports.service";
import { ApiMonitoringService } from "./api-monitoring.service";

@Module({
  imports: [HttpModule.register({ timeout: 5000 })],
  controllers: [DonneesExternesController],
  providers: [ImportsService, ApiMonitoringService],
})
export class DonneesExternesModule {}
