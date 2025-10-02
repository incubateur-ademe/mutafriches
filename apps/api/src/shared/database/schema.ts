import { evaluations } from "./schemas/evaluations.schema";
import { evenements_utilisateur } from "./schemas/evenements.schema";
import { logs_enrichissement } from "./schemas/logs-enrichissement.schema";

// Export individuel pour drizzle-kit
export { evaluations, evenements_utilisateur, logs_enrichissement };

// Export groupé pour drizzle ORM
export const schema = {
  evaluations,
  evenements_utilisateur,
  logs_enrichissement,
};
