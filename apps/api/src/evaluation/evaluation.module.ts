import { Module } from "@nestjs/common";
import { EvaluationController } from "./evaluation.controller";
import { OrchestrateurService } from "./services/orchestrateur.service";
import { CalculService } from "./services/calcul.service";
import { EvaluationRepository } from "./repositories/evaluation.repository";
import { DatabaseModule } from "../shared/database/database.module";
import { EnrichissementModule } from "../enrichissement/enrichissement.module";

@Module({
  imports: [
    DatabaseModule,
    EnrichissementModule, // Import pour utiliser EnrichissementService dans OrchestrateurService
  ],
  controllers: [EvaluationController],
  providers: [
    OrchestrateurService,
    CalculService,
    EvaluationRepository,
  ],
  exports: [OrchestrateurService], // Export si besoin ailleurs
})
export class EvaluationModule {}
