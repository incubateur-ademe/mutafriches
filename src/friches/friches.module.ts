// src/friches/friches.module.ts
import { Module } from '@nestjs/common';
import { ParcelleEnrichmentService } from './services/parcelle-enrichment.service';
import { FrichesController } from './controller/friches.controller';
import { HttpModule } from '@nestjs/axios';
import { FrichesMockModule } from '../friches-mock/friches-mock.module';

// Import des services mock
import { MockCadastreService } from '../friches-mock/services/mock-cadastre.service';
import { MockBdnbService } from '../friches-mock/services/mock-bdnb.service';
import { MockEnedisService } from '../friches-mock/services/mock-enedis.service';
import { MockTransportService } from '../friches-mock/services/mock-transport.service';
import { MockOverpassService } from '../friches-mock/services/mock-overpass.service';
import { MockLovacService } from '../friches-mock/services/mock-lovac.service';

@Module({
  imports: [HttpModule, FrichesMockModule],
  controllers: [FrichesController],
  providers: [
    ParcelleEnrichmentService,
    // Providers qui lient les tokens aux services mock
    {
      provide: 'CADASTRE_SERVICE',
      useExisting: MockCadastreService,
    },
    {
      provide: 'BDNB_SERVICE',
      useExisting: MockBdnbService,
    },
    {
      provide: 'ENEDIS_SERVICE',
      useExisting: MockEnedisService,
    },
    {
      provide: 'TRANSPORT_SERVICE',
      useExisting: MockTransportService,
    },
    {
      provide: 'OVERPASS_SERVICE',
      useExisting: MockOverpassService,
    },
    {
      provide: 'LOVAC_SERVICE',
      useExisting: MockLovacService,
    },
  ],
  exports: [ParcelleEnrichmentService],
})
export class FrichesModule {}
