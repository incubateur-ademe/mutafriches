import { evaluations } from "./schemas/evaluations.schema";
import { evenements_utilisateur, typeEvenementEnum } from "./schemas/evenements.schema";
import { enrichissements } from "./schemas/enrichissements.schema";
import { rawBpe } from "./schemas/raw-bpe.schema";
import { rawImportsLog } from "./schemas/raw-imports-log.schema";
import { rawTransportStops } from "./schemas/raw-transport-stops.schema";

// Export individuel pour drizzle-kit
export {
  evaluations,
  evenements_utilisateur,
  typeEvenementEnum,
  enrichissements,
  rawBpe,
  rawImportsLog,
  rawTransportStops,
};

// Export groupé pour drizzle ORM
export const schema = {
  evaluations,
  evenements_utilisateur,
  enrichissements,
  rawBpe,
  rawImportsLog,
  rawTransportStops,
};
