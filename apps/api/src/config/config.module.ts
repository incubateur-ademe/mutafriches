import { Global, Module } from "@nestjs/common";
import { AppConfig } from "./app.config";

// Module global : AppConfig est injectable partout sans réimport.
@Global()
@Module({
  providers: [AppConfig],
  exports: [AppConfig],
})
export class ConfigModule {}
