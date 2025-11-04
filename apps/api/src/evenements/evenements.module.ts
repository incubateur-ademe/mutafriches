import { Module } from "@nestjs/common";
import { EvenementsController } from "./evenements.controller";
import { EvenementService } from "./services/evenement.service";
import { EvenementRepository } from "./repositories/evenement.repository";

@Module({
  controllers: [EvenementsController],
  providers: [EvenementService, EvenementRepository],
})
export class EvenementsModule {}
