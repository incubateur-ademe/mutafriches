import { Module } from "@nestjs/common";
import { MockTransportService } from "./services/mock-transport.service";
import { MockOverpassService } from "./services/mock-overpass.service";
import { MockLovacService } from "./services/mock-lovac.service";

/**
 * Module contenant tous les services mock pour les APIs externes
 * Utilisé en développement et pour les tests
 *
 */
@Module({
  providers: [
    // Services mock implémentant les mêmes interfaces que les vrais services
    MockTransportService,
    MockOverpassService,
    MockLovacService,
  ],
  exports: [
    // Export pour injection dans le module friches
    MockTransportService,
    MockOverpassService,
    MockLovacService,
  ],
})
export class MockModule {}
