import { SitePrefetch } from "./types";
import { CCI92_SITES } from "./cci92";
import { AURA_SITES } from "./aura";
import { DDT_VOSGES_SITES } from "./ddt-vosges";
import { SCET_SITES } from "./scet";

/**
 * Registre des partenaires à pré-chauffer, keyé par slug (identique au slug UI dans
 * apps/ui/src/features/partenaires/partners/<slug>/index.ts).
 *
 * Ajouter un partenaire = créer un fichier ./<slug>.ts puis ajouter une entrée ici.
 *
 * Note : n'ajouter ici qu'un partenaire dont les IDU sont réels. Un partenaire avec des
 * identifiants fictifs (placeholder) ferait échouer le pré-chauffe et l'alarme du cron.
 */
export const PARTENAIRES_PREFETCH: Record<string, SitePrefetch[]> = {
  "cci-92": CCI92_SITES,
  aura: AURA_SITES,
  "ddt-vosges": DDT_VOSGES_SITES,
  scet: SCET_SITES,
};

/** Métadonnées d'un partenaire pour le seed en base (db:partenaires:seed). */
export interface PartenaireMeta {
  nom: string;
  description: string;
  departement: string;
}

/**
 * Métadonnées par slug, utilisées par le seed. Le prefetch n'en a pas besoin.
 * Doit rester cohérent avec les configs UI (partners/<slug>/index.ts) tant que
 * l'UI lit encore le registre statique (cf. ADR-0021).
 */
export const PARTENAIRES_META: Record<string, PartenaireMeta> = {
  "cci-92": {
    nom: "CCI Hauts-de-Seine (92)",
    description:
      "POC de qualification et mutabilité des friches sur le territoire de la CCI 92 (Colombes, Gennevilliers, Nanterre).",
    departement: "92",
  },
  aura: {
    nom: "Agence d'urbanisme de la région angevine",
    description:
      "Qualification et mutabilité des friches sur le territoire de l'AURA (Maine-et-Loire).",
    departement: "49",
  },
  "ddt-vosges": {
    nom: "DDT des Vosges (88)",
    description:
      "Qualification et mutabilité des friches du département des Vosges, base de la DDT 88.",
    departement: "88",
  },
  scet: {
    nom: "SCET – Banque des Territoires",
    description:
      "Qualification et mutabilité des friches de la CC du Pays de Montereau (77), inventaire du SCET (groupe Caisse des Dépôts).",
    departement: "77",
  },
};
