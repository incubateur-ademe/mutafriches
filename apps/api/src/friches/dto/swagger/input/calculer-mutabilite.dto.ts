import { ApiProperty } from "@nestjs/swagger";
import {
  CalculerMutabiliteInputDto as ICalculerMutabiliteInput,
  EnrichissementOutputDto,
  DonneesComplementairesInputDto,
} from "@mutafriches/shared-types";
import { EnrichissementSwaggerDto } from "../output/enrichissement.dto";
import { DonneesComplementairesSwaggerDto } from "./donnees-complementaires.dto";

/**
 * DTO Swagger pour le calcul de mutabilité
 * Dupliqué depuis @mutafriches/shared-types pour ajouter les décorateurs Swagger
 */
export class CalculerMutabiliteSwaggerDto implements ICalculerMutabiliteInput {
  @ApiProperty({
    description: "Données obtenues via l'enrichissement automatique",
    type: EnrichissementSwaggerDto,
  })
  donneesEnrichies: EnrichissementOutputDto;

  @ApiProperty({
    description: "Données complémentaires saisies par l'utilisateur",
    type: DonneesComplementairesSwaggerDto,
  })
  donneesComplementaires: DonneesComplementairesInputDto;
}
