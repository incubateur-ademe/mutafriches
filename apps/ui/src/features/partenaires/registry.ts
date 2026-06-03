import type { PartnerConfig } from "./core/types";
import { CCI92_CONFIG } from "./partners/cci92";
import { AURA_CONFIG } from "./partners/aura";

// Source unique de vérité des partenaires. Ajouter un partenaire = ajouter une entrée ici.
// TODO(aura) : AURA est en données PLACEHOLDER (cf. partners/aura) en attendant ses vrais IDU.
export const PARTNERS: PartnerConfig[] = [CCI92_CONFIG, AURA_CONFIG];

export function getPartnerBySlug(slug: string | undefined): PartnerConfig | undefined {
  if (!slug) return undefined;
  return PARTNERS.find((p) => p.slug === slug);
}
