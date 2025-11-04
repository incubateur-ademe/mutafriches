import { Module } from "@nestjs/common";
import { FrichesController } from "./friches.controller";
import { EnrichissementModule } from "../enrichissement/enrichissement.module";
import { EvaluationModule } from "../evaluation/evaluation.module";

/**
 * Module de compatibilité Friches
 * Maintient les routes /friches/* pour rétrocompatibilité
 * Redirige vers les nouveaux modules Enrichissement et Evaluation
 */
@Module({
  imports: [EnrichissementModule, EvaluationModule],
  controllers: [FrichesController],
})
export class FrichesModule {}
