import { Module } from "@nestjs/common";
import { DatabaseModule } from "../shared/database/database.module";
import { PartenairesController } from "./partenaires.controller";
import { PartenairesService } from "./partenaires.service";
import { PartenaireRepository } from "./repositories/partenaire.repository";

@Module({
  imports: [DatabaseModule],
  controllers: [PartenairesController],
  providers: [PartenairesService, PartenaireRepository],
  exports: [PartenaireRepository],
})
export class PartenairesModule {}
