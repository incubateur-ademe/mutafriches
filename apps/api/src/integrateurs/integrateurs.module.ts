import { Global, Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { BrevoContactsService } from "./adapters/brevo/brevo-contacts.service";
import { IntegrateursController } from "./integrateurs.controller";
import { IntegrateursRegistreService } from "./integrateurs-registre.service";
import { IntegrateursService } from "./integrateurs.service";
import { IntegrateurRepository } from "./repositories/integrateur.repository";

// Global : `IntegrateurOriginGuard` est instancié dans chaque module qui l'utilise et doit y
// trouver le registre.
@Global()
@Module({
  imports: [HttpModule],
  controllers: [IntegrateursController],
  providers: [
    IntegrateurRepository,
    IntegrateursRegistreService,
    IntegrateursService,
    BrevoContactsService,
  ],
  exports: [IntegrateursRegistreService],
})
export class IntegrateursModule {}
