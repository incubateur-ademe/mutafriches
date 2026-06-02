import { pgTable, varchar, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { BesoinMultisites } from "@mutafriches/shared-types";
import { pgEnum } from "drizzle-orm/pg-core";

export const besoinMultisitesEnum = pgEnum(
  "besoin_multisites_enum",
  Object.values(BesoinMultisites) as [string, ...string[]],
);

// Demandes de mise en relation multisites (modale "Etre contacte")
export const demandes_contact = pgTable(
  "demandes_contact",
  {
    id: varchar("id", { length: 50 }).primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    besoin: besoinMultisitesEnum("besoin").notNull(),
    evaluationId: varchar("evaluation_id", { length: 50 }),
    sessionId: varchar("session_id", { length: 100 }),
    integrateur: varchar("integrateur", { length: 255 }),
    mailConfirmationEnvoye: boolean("mail_confirmation_envoye").notNull().default(false),
    dateCreation: timestamp("date_creation").notNull().defaultNow(),
  },
  (table) => [
    index("idx_demandes_contact_date").on(table.dateCreation),
    index("idx_demandes_contact_besoin").on(table.besoin),
  ],
);
