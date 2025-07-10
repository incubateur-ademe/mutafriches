import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  decimal,
} from 'drizzle-orm/pg-core';

// Table pour stocker les résultats de mutabilité
export const mutabilityResults = pgTable('mutability_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: varchar('session_id', { length: 255 }).notNull(),

  // Indices de mutabilité par usage
  indiceResidentiel: integer('indice_residentiel').notNull(),
  indiceEquipements: integer('indice_equipements').notNull(),
  indiceCulture: integer('indice_culture').notNull(),
  indiceTertiaire: integer('indice_tertiaire').notNull(),
  indiceIndustrie: integer('indice_industrie').notNull(),
  indiceRenaturation: integer('indice_renaturation').notNull(),
  indicePhotovoltaique: integer('indice_photovoltaique').notNull(),

  // Fiabilité
  fiabilite: decimal('fiabilite', { precision: 3, scale: 1 }).notNull(),

  // Pertinence des résultats pour l'utilisateur
  pertinenceReponse: varchar('pertinence_reponse', { length: 10 }), // 'OUI', 'NON', ou null

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Potentiellement d'autres tables liées à la mutabilité
// export const fricheInputs = pgTable('friche_inputs', { ... });
// export const algorithmVersions = pgTable('algorithm_versions', { ... });
