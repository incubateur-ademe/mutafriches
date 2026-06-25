import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { CartofrichesController } from "./cartofriches.controller";
import { CartofrichesService } from "./cartofriches.service";
import { CartofrichesAdapter } from "./cartofriches.adapter";

/**
 * Module de comparaison avec Cartofriches (API Cerema).
 * Outil de diagnostic : relaie l'API libre du Cerema pour confronter ses données sources
 * à l'enrichissement Mutafriches.
 */
@Module({
  imports: [HttpModule],
  controllers: [CartofrichesController],
  providers: [CartofrichesService, CartofrichesAdapter],
  exports: [CartofrichesService],
})
export class CartofrichesModule {}
