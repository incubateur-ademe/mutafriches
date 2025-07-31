import { Controller, Post, Body } from '@nestjs/common';
import { ParcelleEnrichmentService } from '../services/parcelle-enrichment.service';
import { ParcelleInputDto } from '../dto/parcelle-input.dto';
import { EnrichmentResultDto } from '../dto/enrichment-result.dto';

@Controller('friches')
export class FrichesController {
  constructor(
    private readonly parcelleEnrichmentService: ParcelleEnrichmentService, // Nom corrigé
  ) {}

  /**
   * Enrichit une parcelle depuis ses sources de données
   */
  @Post('parcelle/enrich')
  async enrichParcelle(
    @Body() input: ParcelleInputDto,
  ): Promise<EnrichmentResultDto> {
    console.log(`API: Enrichissement parcelle ${input.identifiantParcelle}`);
    return await this.parcelleEnrichmentService.enrichFromDataSources(
      input.identifiantParcelle,
    );
  }

  /**
   * Test rapide avec identifiant direct
   */
  @Post('parcelle/enrich-test')
  async enrichParcelleTest(
    @Body('identifiant') identifiant: string,
  ): Promise<EnrichmentResultDto> {
    console.log(`API: Test enrichissement ${identifiant}`);
    return await this.parcelleEnrichmentService.enrichFromDataSources(
      identifiant,
    );
  }
}
