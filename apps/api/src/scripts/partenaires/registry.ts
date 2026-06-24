import { SitePrefetch } from "./types";
import { CCI92_SITES } from "./cci92";
import { AURA_SITES } from "./aura";

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
};
