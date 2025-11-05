import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";

import { EnrichissementController } from "./enrichissement.controller";
import { EnrichissementService } from "./services/enrichissement.service";
import { EnrichissementRepository } from "./repositories/enrichissement.repository";
import { DatabaseModule } from "../shared/database/database.module";

// Import des services externes
import { BdnbService } from "./adapters/bdnb/bdnb.service";
import { EnedisService } from "./adapters/enedis/enedis.service";
import { CadastreService } from "./adapters/cadastre/cadastre.service";
// Import tous les services GeoRisques
import { RgaService } from "./adapters/georisques/rga/rga.service";
import { CatnatService } from "./adapters/georisques/catnat/catnat.service";
import { TriService } from "./adapters/georisques/tri/tri.service";
import { TriZonageService } from "./adapters/georisques/tri-zonage/tri-zonage.service";
import { MvtService } from "./adapters/georisques/mvt/mvt.service";
import { ZonageSismiqueService } from "./adapters/georisques/zonage-sismique/zonage-sismique.service";
import { CavitesService } from "./adapters/georisques/cavites/cavites.service";
import { OldService } from "./adapters/georisques/old/old.service";
import { SisService } from "./adapters/georisques/sis/sis.service";
import { IcpeService } from "./adapters/georisques/icpe/icpe.service";
import { AziService } from "./adapters/georisques/azi/azi.service";
import { PapiService } from "./adapters/georisques/papi/papi.service";
import { PprService } from "./adapters/georisques/ppr/ppr.service";

@Module({
  imports: [DatabaseModule, HttpModule],
  controllers: [EnrichissementController],
  providers: [
    EnrichissementService,
    EnrichissementRepository,
    // Services externes
    CadastreService,
    BdnbService,
    EnedisService,
    // GeoRisques
    RgaService,
    CatnatService,
    TriService,
    TriZonageService,
    MvtService,
    ZonageSismiqueService,
    CavitesService,
    OldService,
    SisService,
    IcpeService,
    AziService,
    PapiService,
    PprService,
  ],
  exports: [EnrichissementService], // Exporte le service
})
export class EnrichissementModule {}
