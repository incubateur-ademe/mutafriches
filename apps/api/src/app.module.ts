import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { FrichesModule } from "./friches/friches.module";
import { EvenementsModule } from "./evenements/evenements.module";
import { DatabaseModule } from "./shared/database/database.module";

@Module({
  imports: [DatabaseModule, FrichesModule, EvenementsModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
