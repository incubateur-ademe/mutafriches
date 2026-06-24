import type { PartnerConfig } from "./core/types";
import { CCI92_CONFIG } from "./partners/cci92";
import { AURA_CONFIG } from "./partners/aura";

// Source unique de vérité des partenaires. Ajouter un partenaire = ajouter une entrée ici.
export const PARTNERS: PartnerConfig[] = [CCI92_CONFIG, AURA_CONFIG];

export function getPartnerBySlug(slug: string | undefined): PartnerConfig | undefined {
  if (!slug) return undefined;
  return PARTNERS.find((p) => p.slug === slug);
}
