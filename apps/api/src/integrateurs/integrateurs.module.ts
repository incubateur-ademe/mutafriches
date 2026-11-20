import { Global, Module } from "@nestjs/common";
import { IntegrateursRegistreService } from "./integrateurs-registre.service";
import { IntegrateurRepository } from "./repositories/integrateur.repository";

// Global : `IntegrateurOriginGuard` est instancié dans chaque module qui l'utilise et doit y
// trouver le registre.
@Global()
@Module({
  providers: [IntegrateurRepository, IntegrateursRegistreService],
  exports: [IntegrateursRegistreService],
})
export class IntegrateursModule {}
