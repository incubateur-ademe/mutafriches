import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from "class-validator";
import {
  CANAUX_AVEC_DOMAINE,
  CANAUX_INTEGRATEUR,
  TRANCHES_NB_SITES,
  TYPES_STRUCTURE,
  type CanalIntegrateur,
  type DeclarationIntegrateurInput,
  type DeclarationIntegrateurOutput,
  type StatutIntegrateur,
  type TrancheNbSites,
  type TypeStructure,
} from "@mutafriches/shared-types";

export class DeclarationIntegrateurDto implements DeclarationIntegrateurInput {
  @ApiProperty({ enum: CANAUX_INTEGRATEUR, example: "api" })
  @IsIn(CANAUX_INTEGRATEUR, { message: "Canal invalide" })
  canal: CanalIntegrateur;

  @ApiProperty({ description: "Nom de l'organisation", example: "Métropole de Lyon" })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  structure: string;

  @ApiProperty({ enum: TYPES_STRUCTURE, example: "collectivite" })
  @IsIn(TYPES_STRUCTURE, { message: "Type de structure invalide" })
  typeStructure: TypeStructure;

  @ApiProperty({
    description: "Prénom du déclarant, transmis à l'outil d'e-mailing et jamais stocké en base",
    example: "Camille",
  })
  @IsString()
  @IsNotEmpty({ message: "Le prénom est obligatoire" })
  @MaxLength(100)
  prenom: string;

  @ApiProperty({
    description: "Nom du déclarant, transmis à l'outil d'e-mailing et jamais stocké en base",
    example: "Martin",
  })
  @IsString()
  @IsNotEmpty({ message: "Le nom est obligatoire" })
  @MaxLength(100)
  nom: string;

  @ApiProperty({
    description: "Adresse de contact, transmise à l'outil d'e-mailing et jamais stockée en base",
    example: "sig@exemple.fr",
  })
  @IsEmail({}, { message: "Adresse e-mail invalide" })
  @MaxLength(254)
  email: string;

  @ApiPropertyOptional({
    description: "Domaine envoyé dans l'en-tête Origin (obligatoire sauf pour le canal page)",
    example: "exemple.fr",
  })
  @ValidateIf((dto: DeclarationIntegrateurDto) => CANAUX_AVEC_DOMAINE.includes(dto.canal))
  @IsString()
  @IsNotEmpty({ message: "Le domaine est obligatoire pour ce canal" })
  @MaxLength(255)
  domaine?: string;

  @ApiPropertyOptional({ description: "Code du département (canal page)", example: "88" })
  @IsOptional()
  @Matches(/^(\d{2,3}|2[AB])$/, { message: "Code département invalide" })
  departement?: string;

  @ApiPropertyOptional({ enum: TRANCHES_NB_SITES })
  @IsOptional()
  @IsIn(TRANCHES_NB_SITES, { message: "Tranche de sites invalide" })
  nbSitesEstime?: TrancheNbSites;

  // Champ piège, absent de la documentation : rempli, la déclaration est ignorée.
  @IsOptional()
  @IsString()
  @MaxLength(50)
  telephone?: string;
}

export class DeclarationIntegrateurOutputDto implements DeclarationIntegrateurOutput {
  @ApiProperty({ enum: CANAUX_INTEGRATEUR })
  canal: CanalIntegrateur;

  @ApiProperty({ enum: ["en_attente", "actif", "revoque"] })
  statut: StatutIntegrateur;

  @ApiPropertyOptional({
    description: "Origine à envoyer dans l'en-tête Origin",
    example: "https://exemple.fr",
  })
  origine?: string;

  @ApiProperty({ description: "Vrai si ce domaine était déjà déclaré pour ce canal" })
  dejaDeclare: boolean;
}
