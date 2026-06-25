import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AppController } from "./app.controller";
import { EnrichissementModule } from "./enrichissement/enrichissement.module";
import { EvaluationModule } from "./evaluation/evaluation.module";
import { EvenementsModule } from "./evenements/evenements.module";
import { StatsModule } from "./stats/stats.module";
import { PartenairesModule } from "./partenaires/partenaires.module";
import { DonneesExternesModule } from "./donnees-externes/donnees-externes.module";
import { CartofrichesModule } from "./cartofriches/cartofriches.module";
import { MetabaseModule } from "./metabase/metabase.module";
import { DatabaseModule } from "./shared/database/database.module";
import { SharedModule } from "./shared/shared.module";
import { ConfigModule } from "./config";

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requêtes par minute par IP
      },
    ]),
    ConfigModule,
    SharedModule,
    DatabaseModule,
    EnrichissementModule,
    EvaluationModule,
    EvenementsModule,
    StatsModule,
    PartenairesModule,
    DonneesExternesModule,
    CartofrichesModule,
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
