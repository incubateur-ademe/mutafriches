import { IsEnum, IsOptional, IsString, MaxLength, Matches, IsObject } from "class-validator";
import { TypeEvenement, EvenementInputDto as IEvenementInput } from "@mutafriches/shared-types";

export class EvenementInputDto implements IEvenementInput {
  @IsEnum(TypeEvenement, {
    message: "Type evenement invalide",
  })
  typeEvenement: TypeEvenement;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Matches(/^eval-[a-z0-9-]+$/, {
    message: "Format evaluationId invalide",
  })
  evaluationId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^[0-9A-Z]+$/, {
    message: "identifiantCadastral doit être alphanumérique majuscule",
  })
  identifiantCadastral?: string;

  @IsOptional()
  @IsObject()
  donnees?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-z0-9_-]+$/, {
    message: "sessionId contient des caractères non autorisés",
  })
  sessionId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  sourceUtilisation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ref?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  integrateur?: string;
}
