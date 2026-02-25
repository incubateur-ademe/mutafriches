import { Module } from "@nestjs/common";
import { MetabaseController } from "./metabase.controller";
import { MetabaseService } from "./metabase.service";

@Module({
  controllers: [MetabaseController],
  providers: [MetabaseService],
})
export class MetabaseModule {}
