import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { ApiStandardErrors } from "../shared/swagger";
import {
  DeclarationIntegrateurDto,
  DeclarationIntegrateurOutputDto,
} from "./dto/declaration-integrateur.dto";
import { IntegrateursService } from "./integrateurs.service";

@ApiTags("Intégrateurs")
@Controller("api/integrateurs")
export class IntegrateursController {
  constructor(private readonly integrateursService: IntegrateursService) {}

  // Route ouverte (formulaires du site et extension QGIS) : la limite de débit est la seule
  // protection, d'où un plafond serré par IP.
  @Post("declarations")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  @ApiOperation({
    summary: "Déclarer une utilisation de Mutafriches",
    description: `
    Déclare une structure pour l'un des quatre canaux.

    - \`api\` et \`qgis\` : le domaine déclaré est autorisé **tout de suite** dans l'en-tête
      \`Origin\` des appels à \`POST /enrichissement\` et \`POST /evaluation/calculer\`.
    - \`page\` et \`iframe\` : la demande est enregistrée en attente, l'équipe vous recontacte.

    Déclarer deux fois le même domaine ne crée rien (\`dejaDeclare: true\`). L'adresse e-mail sert
    à vous informer des évolutions du service ; elle n'est pas stockée dans notre base.
    Limite : 5 déclarations par heure et par adresse IP.
    `,
  })
  @ApiOkResponse({ type: DeclarationIntegrateurOutputDto })
  @ApiStandardErrors()
  async declarer(
    @Body() declaration: DeclarationIntegrateurDto,
  ): Promise<DeclarationIntegrateurOutputDto> {
    return this.integrateursService.declarer(declaration);
  }
}
