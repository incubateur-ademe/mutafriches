import { Module } from "@nestjs/common";
import { DatabaseModule } from "../shared/database/database.module";
import { EnrichissementModule } from "../enrichissement/enrichissement.module";
import { EvaluationModule } from "../evaluation/evaluation.module";
import { PartenairesController } from "./partenaires.controller";
import { PartenairesService } from "./partenaires.service";
import { PartenaireRepository } from "./repositories/partenaire.repository";
import { CnigExportService } from "./export/cnig-export.service";

@Module({
  imports: [DatabaseModule, EnrichissementModule, EvaluationModule],
  controllers: [PartenairesController],
  providers: [PartenairesService, PartenaireRepository, CnigExportService],
  exports: [PartenaireRepository],
})
export class PartenairesModule {}
