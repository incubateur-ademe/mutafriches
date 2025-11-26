import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { EnrichissementController } from "./enrichissement.controller";
import { EnrichissementService } from "./services/enrichissement.service";
import { EnrichissementRepository } from "./repositories/enrichissement.repository";

// Services de domaine
import { CadastreEnrichissementService } from "./services/cadastre/cadastre-enrichissement.service";
import { EnergieEnrichissementService } from "./services/energie/energie-enrichissement.service";
import { TransportEnrichissementService } from "./services/transport/transport-enrichissement.service";
import { UrbanismeEnrichissementService } from "./services/urbanisme/urbanisme-enrichissement.service";
import { RisquesNaturelsEnrichissementService } from "./services/risques-naturels/risques-naturels-enrichissement.service";
import { RisquesTechnologiquesEnrichissementService } from "./services/risques-technologiques/risques-technologiques-enrichissement.service";

// Calculators
import { RisquesNaturelsCalculator } from "./services/risques-naturels/risques-naturels.calculator";
import { RisquesTechnologiquesCalculator } from "./services/risques-technologiques/risques-technologiques.calculator";
import { FiabiliteCalculator } from "./services/shared/fiabilite.calculator";

// Services Zonage
import { ZonageOrchestratorService } from "./services/zonage/zonage-orchestrator.service";
import { ZonageEnvironnementalService } from "./services/zonage/zonage-environnemental/zonage-environnemental.service";
import { ZonageEnvironnementalCalculator } from "./services/zonage/zonage-environnemental/zonage-environnemental.calculator";
import { ZonagePatrimonialService } from "./services/zonage/zonage-patrimonial/zonage-patrimonial.service";
import { ZonagePatrimonialCalculator } from "./services/zonage/zonage-patrimonial/zonage-patrimonial.calculator";
import { ZonageReglementaireService } from "./services/zonage/zonage-reglementaire/zonage-reglementaire.service";
import { ZonageReglementaireCalculator } from "./services/zonage/zonage-reglementaire/zonage-reglementaire.calculator";

// Adapters
import { CadastreService } from "./adapters/cadastre/cadastre.service";
import { BdnbService } from "./adapters/bdnb/bdnb.service";
import { EnedisService } from "./adapters/enedis/enedis.service";
import { ServicePublicService } from "./adapters/service-public/service-public.service";
import { IgnWfsService } from "./adapters/ign-wfs/ign-wfs.service";
import { OverpassService } from "./adapters/overpass/overpass.service";

// Adapters GeoRisques
import { GeoRisquesOrchestrator } from "./services/georisques/georisques.orchestrator";
import { GeoRisquesEnrichissementService } from "./services/georisques/georisques-enrichissement.service";
import { CatnatService } from "./adapters/georisques/catnat/catnat.service";
import { RgaService } from "./adapters/georisques/rga/rga.service";
import { TriService } from "./adapters/georisques/tri/tri.service";
import { TriZonageService } from "./adapters/georisques/tri-zonage/tri-zonage.service";
import { AziService } from "./adapters/georisques/azi/azi.service";
import { PapiService } from "./adapters/georisques/papi/papi.service";
import { CavitesService } from "./adapters/georisques/cavites/cavites.service";
import { MvtService } from "./adapters/georisques/mvt/mvt.service";
import { ZonageSismiqueService } from "./adapters/georisques/zonage-sismique/zonage-sismique.service";
import { PprService } from "./adapters/georisques/ppr/ppr.service";
import { SisService } from "./adapters/georisques/sis/sis.service";
import { IcpeService } from "./adapters/georisques/icpe/icpe.service";
import { OldService } from "./adapters/georisques/old/old.service";

// Adapters API Carto
import { ApiCartoNatureService } from "./adapters/api-carto/nature/api-carto-nature.service";
import { ApiCartoGpuService } from "./adapters/api-carto/gpu/api-carto-gpu.service";

// Adapters data.gouv.fr
import { DatagouvLovacService } from "./adapters/datagouv-lovac/datagouv-lovac.service";

@Module({
  imports: [HttpModule],
  controllers: [EnrichissementController],
  providers: [
    // Service principal
    EnrichissementService,
    EnrichissementRepository,

    // Services de domaine
    CadastreEnrichissementService,
    EnergieEnrichissementService,
    TransportEnrichissementService,
    UrbanismeEnrichissementService,
    RisquesNaturelsEnrichissementService,
    RisquesTechnologiquesEnrichissementService,
    ServicePublicService,
    IgnWfsService,
    OverpassService,

    // Calculators
    RisquesNaturelsCalculator,
    RisquesTechnologiquesCalculator,
    FiabiliteCalculator,

    // Services Zonage
    ZonageOrchestratorService,
    ZonageEnvironnementalService,
    ZonageEnvironnementalCalculator,
    ZonagePatrimonialService,
    ZonagePatrimonialCalculator,
    ZonageReglementaireService,
    ZonageReglementaireCalculator,

    // Adapters
    CadastreService,
    BdnbService,
    EnedisService,

    // Adapters GeoRisques
    GeoRisquesOrchestrator,
    GeoRisquesEnrichissementService,
    CatnatService,
    RgaService,
    TriService,
    TriZonageService,
    AziService,
    PapiService,
    CavitesService,
    MvtService,
    ZonageSismiqueService,
    PprService,
    SisService,
    IcpeService,
    OldService,

    // Adapters API Carto
    ApiCartoNatureService,
    ApiCartoGpuService,

    // Adapters data.gouv.fr
    DatagouvLovacService,
  ],
  exports: [EnrichissementService],
})
export class EnrichissementModule {}
