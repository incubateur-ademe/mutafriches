import { Global, Module } from "@nestjs/common";
import { AppConfig, getAppConfig } from "./app.config";

// Module global : AppConfig injectable partout, lié au singleton (même instance
// que getAppConfig() utilisé dans les scripts hors DI).
@Global()
@Module({
  providers: [{ provide: AppConfig, useFactory: getAppConfig }],
  exports: [AppConfig],
})
export class ConfigModule {}
