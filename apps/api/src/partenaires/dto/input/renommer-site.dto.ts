import { IsString, MaxLength } from "class-validator";
import { RenommerSitePartenaireInputDto } from "@mutafriches/shared-types";

export class RenommerSiteDto implements RenommerSitePartenaireInputDto {
  // Chaîne vide autorisée : réinitialise au nom par défaut.
  @IsString()
  @MaxLength(255)
  nom: string;
}
