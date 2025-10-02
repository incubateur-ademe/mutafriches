import { Module } from "@nestjs/common";
import { EvenementsController } from "./evenements.controller";
import { DatabaseService } from "src/shared/database/database.service";
import { EvenementRepository } from "./evenement.repository";
import { EvenementService } from "./evenement.service";

@Module({
  controllers: [EvenementsController],
  providers: [EvenementService, EvenementRepository, DatabaseService],
})
export class EvenementsModule {}
