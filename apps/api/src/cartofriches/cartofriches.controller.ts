import { Controller, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import type {
  CartofrichesCommuneResult,
  CartofrichesRechercheResult,
} from "@mutafriches/shared-types";
import { CartofrichesService } from "./cartofriches.service";
import { RechercheCartofrichesQueryDto } from "./dto/recherche-cartofriches.query.dto";
import { CommuneCartofrichesQueryDto } from "./dto/commune-cartofriches.query.dto";

/**
 * Endpoint de diagnostic : relaie l'API Cartofriches du Cerema pour comparer ses données
 * sources à l'enrichissement Mutafriches. Évite les problèmes CORS et centralise le matching.
 */
@ApiTags("cartofriches")
@Controller("api/cartofriches")
export class CartofrichesController {
  constructor(private readonly cartofrichesService: CartofrichesService) {}

  @Get("recherche")
  @ApiOperation({
    summary: "Recherche une friche Cartofriches par identifiant cadastral",
    description:
      "Récupère les friches de la commune via l'API Cerema (fields=all) et retourne celle dont la référence cadastrale correspond à l'identifiant demandé.",
  })
  @ApiResponse({ status: 200, description: "Résultat de la recherche Cartofriches" })
  async rechercher(
    @Query() query: RechercheCartofrichesQueryDto,
  ): Promise<CartofrichesRechercheResult> {
    return this.cartofrichesService.rechercher(query.identifiant, query.codeInsee);
  }

  @Get("commune")
  @ApiOperation({
    summary: "Liste les friches Cartofriches d'une commune (avec emprises)",
    description:
      "Récupère les friches d'une commune via l'API geofriches du Cerema (GeoJSON, fields=all), pour l'affichage carte + liste.",
  })
  @ApiResponse({ status: 200, description: "Friches de la commune" })
  async getCommune(
    @Query() query: CommuneCartofrichesQueryDto,
  ): Promise<CartofrichesCommuneResult> {
    return this.cartofrichesService.getFrichesCommune(query.codeInsee);
  }
}
