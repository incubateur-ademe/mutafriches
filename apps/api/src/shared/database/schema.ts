import { evaluations } from "./schemas/evaluations.schema";
import { evenements_utilisateur } from "./schemas/evenements.schema";
import { enrichissements } from "./schemas/enrichissements.schema";

// Export individuel pour drizzle-kit
export { evaluations, evenements_utilisateur, enrichissements };

// Export groupé pour drizzle ORM
export const schema = {
  evaluations,
  evenements_utilisateur,
  enrichissements,
};
