import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { EnrichissementModule } from "./enrichissement/enrichissement.module";
import { EvaluationModule } from "./evaluation/evaluation.module";
import { FrichesModule } from "./friches/friches.module";
import { EvenementsModule } from "./evenements/evenements.module";
import { DatabaseModule } from "./shared/database/database.module";

@Module({
  imports: [
    DatabaseModule,
    EnrichissementModule,
    EvaluationModule,
    FrichesModule, // Module de compatibilité (proxy)
    EvenementsModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
