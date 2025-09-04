import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { UiService } from "./ui/services/ui.service";
import { AnalyticsService } from "./analytics/analytics.service";
import { DatabaseService } from "./shared/database/database.service";
import { UiController } from "./ui/ui.controller";
import { FrichesModule } from "./friches/friches.module";
import { MockModule } from "./mock/mock.module";
import { FormSessionService } from "./ui/services/form-session.service";
import { CadastreTestController } from "./test-controllers/cadastre-test.controller";
import { BdnbTestController } from "./test-controllers/bdnb-test.controller";
import { EnedisTestController } from "./test-controllers/enedis-test.controller";

@Module({
  imports: [FrichesModule, MockModule],
  controllers: [
    AppController,
    UiController,
    CadastreTestController,
    BdnbTestController,
    EnedisTestController,
  ],
  providers: [UiService, AnalyticsService, DatabaseService, FormSessionService],
})
export class AppModule {}
