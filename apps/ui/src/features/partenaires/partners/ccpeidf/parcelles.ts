import type { PartnerParcelle } from "../../core/types";

// Fichier généré par resolve-idu-partenaire — ne pas éditer à la main.
// Source : inventaire EODD 2025 (friches de la CCPEIDF, Eure-et-Loir), IDU résolus via
// API Carto Cadastre.
//
// TODO : vide tant que la résolution des IDU n'a pas été lancée. L'inventaire source ne porte
// ni IDU ni coordonnées (cf. data/ccpeidf.input.json) :
//   pnpm --filter api build:nest
//   PARTENAIRE=ccpeidf pnpm partenaires:resolve-idu
// Le partenaire n'est volontairement inscrit dans aucun registre avant cette étape, pour ne
// pas publier une page vide.
export const PARCELLES_CCPEIDF: PartnerParcelle[] = [];
