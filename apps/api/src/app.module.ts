import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AppController } from "./app.controller";
import { EnrichissementModule } from "./enrichissement/enrichissement.module";
import { EvaluationModule } from "./evaluation/evaluation.module";
import { EvenementsModule } from "./evenements/evenements.module";
import { StatsModule } from "./stats/stats.module";
import { MetabaseModule } from "./metabase/metabase.module";
import { DatabaseModule } from "./shared/database/database.module";
import { SharedModule } from "./shared/shared.module";

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requêtes par minute par IP
      },
    ]),
    SharedModule,
    DatabaseModule,
    EnrichissementModule,
    EvaluationModule,
    EvenementsModule,
    StatsModule,
    MetabaseModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
