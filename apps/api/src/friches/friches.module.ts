import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { FrichesController } from "./controller/friches.controller";
import { OrchestrateurService } from "./services/orchestrateur.service";
import { EnrichissementService } from "./services/enrichissement.service";
import { CalculService } from "./services/calcul.service";
import { CadastreService } from "./services/external/cadastre/cadastre.service";
import { BdnbService } from "./services/external/bdnb/bdnb.service";
import { EnedisService } from "./services/external/enedis/enedis.service";
import { DatabaseService } from "../shared/database/database.service";
import { EvaluationRepository } from "./repository/evaluation.repository";
import { LogsEnrichissementRepository } from "./repository/logs-enrichissement.repository";
import { RgaService } from "./services/external/georisques/rga/rga.service";

@Module({
  imports: [HttpModule],
  controllers: [FrichesController],
  providers: [
    // Database & Repositories
    DatabaseService,
    EvaluationRepository,
    LogsEnrichissementRepository,
    // Services principaux
    OrchestrateurService,
    EnrichissementService,
    CalculService,
    // Services externes
    CadastreService,
    BdnbService,
    EnedisService,
    RgaService,
  ],
  exports: [OrchestrateurService],
})
export class FrichesModule {}
