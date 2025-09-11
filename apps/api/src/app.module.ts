import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { DatabaseService } from "./shared/database/database.service";
import { FrichesModule } from "./friches/friches.module";

@Module({
  imports: [FrichesModule],
  controllers: [AppController],
  providers: [DatabaseService],
})
export class AppModule {}
