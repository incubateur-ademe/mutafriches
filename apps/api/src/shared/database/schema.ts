import { evaluations } from "./schemas/evaluations.schema";
import { evenements_utilisateur, typeEvenementEnum } from "./schemas/evenements.schema";
import { enrichissements } from "./schemas/enrichissements.schema";
import { sites } from "./schemas/sites.schema";
import { rawBpe } from "./schemas/raw-bpe.schema";
import { rawImportsLog } from "./schemas/raw-imports-log.schema";
import { rawTransportStops } from "./schemas/raw-transport-stops.schema";
import { rawAdemeSitesPollues } from "./schemas/raw-ademe-sites-pollues.schema";

// Export individuel pour drizzle-kit
export {
  evaluations,
  evenements_utilisateur,
  typeEvenementEnum,
  enrichissements,
  sites,
  rawBpe,
  rawImportsLog,
  rawTransportStops,
  rawAdemeSitesPollues,
};

// Export groupé pour drizzle ORM
export const schema = {
  evaluations,
  evenements_utilisateur,
  enrichissements,
  sites,
  rawBpe,
  rawImportsLog,
  rawTransportStops,
  rawAdemeSitesPollues,
};
