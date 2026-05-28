import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsArray, ArrayMaxSize, ArrayMinSize } from "class-validator";
import { EnrichirSiteInputDto as IEnrichirSiteInput } from "@mutafriches/shared-types";

const FORMAT_CADASTRAL_DESCRIPTION = `Format : 14 caractères \`DDDCCCSSNNNNPP\` (département 3 chiffres, commune 3 chiffres, section 2 caractères, numéro 4 chiffres, parcelle 2 chiffres). Cas particuliers : Corse (\`2A\`/\`2B\`), DOM-TOM (départements \`971\`–\`976\`).`;

/**
 * DTO Swagger pour l'enrichissement d'un site (mono ou multi-parcelle)
 *
 * Rétro-compatible : accepte `identifiant` (mono) ou `identifiants` (multi)
 * Si les deux sont fournis, `identifiants` est prioritaire.
 */
export class EnrichirSiteSwaggerDto implements IEnrichirSiteInput {
  @ApiProperty({
    description: `Identifiant cadastral unique d'une parcelle (mode mono-parcelle, rétro-compatible). ${FORMAT_CADASTRAL_DESCRIPTION}`,
    example: "25056000HZ0346",
    pattern: "^[0-9]{3}[0-9]{3}[0-9A-Z]{2}[0-9]{4}[0-9]{2}$",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "L'identifiant cadastral doit être une chaîne de caractères" })
  identifiant?: string;

  @ApiProperty({
    description: `Liste d'identifiants cadastraux pour un site multi-parcelle (1 à 20). Prioritaire sur \`identifiant\` si les deux sont fournis. ${FORMAT_CADASTRAL_DESCRIPTION}`,
    example: ["25056000HZ0346", "25056000HZ0347"],
    required: false,
    type: [String],
    minItems: 1,
    maxItems: 20,
  })
  @IsOptional()
  @IsArray({ message: "Les identifiants doivent être un tableau" })
  @ArrayMinSize(1, { message: "Au moins un identifiant cadastral est requis" })
  @ArrayMaxSize(20, { message: "Maximum 20 parcelles par site" })
  @IsString({ each: true, message: "Chaque identifiant doit être une chaîne de caractères" })
  identifiants?: string[];
}

/**
 * Exemples de payloads pour le bouton "Try it out" de Swagger UI.
 * Référencés depuis l'`@ApiBody` du controller.
 */
export const ENRICHIR_SITE_BODY_EXAMPLES = {
  monoParcelle: {
    summary: "Mono-parcelle (cas le plus courant)",
    description:
      "Enrichit une seule parcelle cadastrale. Utiliser ce format pour la majorité des cas (intégration Benefriches notamment).",
    value: {
      identifiant: "25056000HZ0346",
    },
  },
  multiParcelles: {
    summary: "Multi-parcelles (site composé de plusieurs parcelles contiguës)",
    description:
      "Enrichit un site composé de plusieurs parcelles. Le résultat agrège les surfaces et choisit une parcelle prédominante pour les attributs non-additifs (zonages, risques).",
    value: {
      identifiants: ["25056000HZ0346", "25056000HZ0347"],
    },
  },
  retrocompatible: {
    summary: "Les deux champs (rétro-compatibilité)",
    description:
      "Si les deux champs sont fournis, `identifiants` est prioritaire et `identifiant` est ignoré. Utile uniquement pendant une migration côté intégrateur.",
    value: {
      identifiant: "25056000HZ0346",
      identifiants: ["25056000HZ0346", "25056000HZ0347"],
    },
  },
} as const;
