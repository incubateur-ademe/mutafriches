import { SourceEnrichissement } from "../enrichissement";
import { InformationMetadata } from "./recapitulatif.types";

/**
 * Registre des données enrichies affichées à titre informatif, hors algorithme.
 *
 * Pendant de CRITERES_METADATA pour tout ce que l'on restitue à l'utilisateur sans le
 * faire peser sur l'indice de mutabilité. Rendues après les critères de leur section,
 * dans le formulaire comme dans le récapitulatif et son export.
 */
export const INFORMATIONS_METADATA: Record<string, InformationMetadata> = {
  ilotChaleurUrbain: {
    key: "ilotChaleurUrbain",
    label: "Site concerné par un îlot de chaleur",
    section: "site-bati",
    source: SourceEnrichissement.ICU,
    ordre: 1,
  },
};

/** Liste ordonnée des données informatives */
export const INFORMATIONS_METADATA_LIST: InformationMetadata[] = Object.values(
  INFORMATIONS_METADATA,
).sort((a, b) => a.ordre - b.ordre);
