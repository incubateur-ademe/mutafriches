import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";

import { EnrichissementController } from "./enrichissement.controller";
import { EnrichissementService } from "./services/enrichissement.service";
import { EnrichissementRepository } from "./repositories/enrichissement.repository";
import { DatabaseModule } from "../shared/database/database.module";

// Import des services externes
import { CadastreService } from "./services/external/cadastre/cadastre.service";
import { BdnbService } from "./services/external/bdnb/bdnb.service";
import { EnedisService } from "./services/external/enedis/enedis.service";
// Import tous les services GeoRisques
import { RgaService } from "./services/external/georisques/rga/rga.service";
import { CatnatService } from "./services/external/georisques/catnat/catnat.service";
import { TriService } from "./services/external/georisques/tri/tri.service";
import { TriZonageService } from "./services/external/georisques/tri-zonage/tri-zonage.service";
import { MvtService } from "./services/external/georisques/mvt/mvt.service";
import { ZonageSismiqueService } from "./services/external/georisques/zonage-sismique/zonage-sismique.service";
import { CavitesService } from "./services/external/georisques/cavites/cavites.service";
import { OldService } from "./services/external/georisques/old/old.service";
import { SisService } from "./services/external/georisques/sis/sis.service";
import { IcpeService } from "./services/external/georisques/icpe/icpe.service";
import { AziService } from "./services/external/georisques/azi/azi.service";
import { PapiService } from "./services/external/georisques/papi/papi.service";
import { PprService } from "./services/external/georisques/ppr/ppr.service";

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
