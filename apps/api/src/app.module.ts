import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { DatabaseService } from "./shared/database/database.service";
import { FrichesModule } from "./friches/friches.module";
import { EvenementsModule } from "./evenements/evenements.module";

@Module({
  imports: [FrichesModule, EvenementsModule],
  controllers: [AppController],
  providers: [DatabaseService],
})
export class AppModule {}
