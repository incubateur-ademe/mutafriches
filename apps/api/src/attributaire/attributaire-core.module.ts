import { Module } from "@nestjs/common";
import { CalculService } from "../evaluation/services/calcul.service";
import { FiabiliteCalculator } from "../evaluation/services/algorithme/fiabilite.calculator";
import { AttributaireService } from "./attributaire.service";
import { AttributaireRepository } from "./repositories/attributaire.repository";
import { SourcesAttributaireRepository } from "./repositories/sources-attributaire.repository";

/**
 * Écriture de la table attributaire, importée par l'évaluation et l'enrichissement.
 *
 * Déclare son propre CalculService (sans état) plutôt que d'importer EvaluationModule :
 * l'évaluation importe ce module, l'inverse créerait un cycle.
 */
@Module({
  providers: [
    AttributaireService,
    AttributaireRepository,
    SourcesAttributaireRepository,
    CalculService,
    FiabiliteCalculator,
  ],
  exports: [AttributaireService],
})
export class AttributaireCoreModule {}
