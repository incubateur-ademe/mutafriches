import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { DatabaseModule } from "../shared/database/database.module";

// Controller
import { EnrichissementController } from "./enrichissement.controller";

// Repository
import { EnrichissementRepository } from "./repositories/enrichissement.repository";

// Service principal
import { EnrichissementService } from "./services/enrichissement.service";

// Sous-domaines d'enrichissement
import { CadastreEnrichissementService } from "./services/cadastre/cadastre-enrichissement.service";
import { EnergieEnrichissementService } from "./services/energie/energie-enrichissement.service";
import { TransportEnrichissementService } from "./services/transport/transport-enrichissement.service";
import { UrbanismeEnrichissementService } from "./services/urbanisme/urbanisme-enrichissement.service";
import { RisquesNaturelsEnrichissementService } from "./services/risques-naturels/risques-naturels-enrichissement.service";
import { RisquesTechnologiquesEnrichissementService } from "./services/risques-technologiques/risques-technologiques-enrichissement.service";
import { GeoRisquesEnrichissementService } from "./services/georisques/georisques-enrichissement.service";

// Calculators
import { FiabiliteCalculator } from "./services/shared/fiabilite.calculator";
import { RisquesNaturelsCalculator } from "./services/risques-naturels/risques-naturels.calculator";
import { RisquesTechnologiquesCalculator } from "./services/risques-technologiques/risques-technologiques.calculator";

// Orchestrateurs
import { GeoRisquesOrchestrator } from "./services/georisques/georisques.orchestrator";

// Adapters (APIs externes)
import { CadastreService } from "./adapters/cadastre/cadastre.service";
import { BdnbService } from "./adapters/bdnb/bdnb.service";
import { EnedisService } from "./adapters/enedis/enedis.service";
import { RgaService } from "./adapters/georisques/rga/rga.service";
import { CatnatService } from "./adapters/georisques/catnat/catnat.service";
import { TriZonageService } from "./adapters/georisques/tri-zonage/tri-zonage.service";
import { TriService } from "./adapters/georisques/tri/tri.service";
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
  imports: [HttpModule, DatabaseModule],
  controllers: [EnrichissementController],
  providers: [
    // Repository
    EnrichissementRepository,

    // Service principal (orchestrateur)
    EnrichissementService,

    // Sous-domaines d'enrichissement
    CadastreEnrichissementService,
    EnergieEnrichissementService,
    TransportEnrichissementService,
    UrbanismeEnrichissementService,
    RisquesNaturelsEnrichissementService,
    RisquesTechnologiquesEnrichissementService,
    GeoRisquesEnrichissementService,

    // Calculators
    FiabiliteCalculator,
    RisquesNaturelsCalculator,
    RisquesTechnologiquesCalculator,

    // Orchestrateurs
    GeoRisquesOrchestrator,

    // Adapters (APIs externes)
    CadastreService,
    BdnbService,
    EnedisService,
    RgaService,
    CatnatService,
    TriZonageService,
    TriService,
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
  exports: [EnrichissementService],
})
export class EnrichissementModule {}
