import { Module } from '@nestjs/common';
import { MockBdnbService } from './services/mock-bdnb.service';
import { MockCadastreService } from './services/mock-cadastre.service';
import { MockTransportService } from './services/mock-transport.service';
import { MockEnedisService } from './services/mock-enedis.service';
import { MockOverpassService } from './services/mock-overpass.service';
import { MockLovacService } from './services/mock-lovac.service';
import { MockMutabilityService } from './services/mock-mutability.service';

/**
 * Module contenant tous les services mock pour les APIs externes
 * Utilisé en développement et pour les tests
 *
 * Usage:
 * - En développement: USE_MOCK_APIS=true dans .env
 * - En production: USE_MOCK_APIS=false (utilise les vraies APIs)
 */
@Module({
  providers: [
    // Services mock implémentant les mêmes interfaces que les vrais services
    MockBdnbService,
    MockCadastreService,
    MockTransportService,
    MockEnedisService,
    MockOverpassService,
    MockLovacService,
    MockMutabilityService,
  ],
  exports: [
    // Export pour injection dans le module friches
    MockBdnbService,
    MockCadastreService,
    MockTransportService,
    MockEnedisService,
    MockOverpassService,
    MockLovacService,
    MockMutabilityService,
  ],
})
export class FrichesMockModule {}
