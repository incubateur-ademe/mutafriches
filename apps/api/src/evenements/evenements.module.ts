import { Module } from "@nestjs/common";
import { EvenementsController } from "./evenements.controller";
import { EvenementRepository } from "./evenement.repository";
import { EvenementService } from "./evenement.service";

@Module({
  controllers: [EvenementsController],
  providers: [EvenementService, EvenementRepository],
})
export class EvenementsModule {}
