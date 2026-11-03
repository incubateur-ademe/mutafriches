import { Module } from "@nestjs/common";
import { EvaluationController } from "./evaluation.controller";
import { OrchestrateurService } from "./services/orchestrateur.service";
import { CalculService } from "./services/calcul.service";
import { FiabiliteCalculator } from "./services/algorithme/fiabilite.calculator";
import { EvaluationRepository } from "./repositories/evaluation.repository";
import { DatabaseModule } from "../shared/database/database.module";
import { EnrichissementModule } from "../enrichissement/enrichissement.module";
import { AttributaireCoreModule } from "../attributaire/attributaire-core.module";

@Module({
  imports: [DatabaseModule, EnrichissementModule, AttributaireCoreModule],
  controllers: [EvaluationController],
  providers: [OrchestrateurService, CalculService, FiabiliteCalculator, EvaluationRepository],
  exports: [OrchestrateurService, CalculService],
})
export class EvaluationModule {}
