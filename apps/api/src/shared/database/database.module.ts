import { Global, Module } from "@nestjs/common";
import { DatabaseService } from "./database.service";

/**
 * Module global pour la gestion de la base de données.
 * Le décorateur @Global() permet d'exporter DatabaseService
 * vers tous les modules sans avoir à réimporter DatabaseModule partout.
 */
@Global()
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
