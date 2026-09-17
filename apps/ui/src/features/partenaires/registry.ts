import type { PartnerConfig } from "./core/types";
import { CCI92_CONFIG } from "./partners/cci92";
import { AURA_CONFIG } from "./partners/aura";
import { CCPEIDF_CONFIG } from "./partners/ccpeidf";
import { DDT_VOSGES_CONFIG } from "./partners/ddt-vosges";
import { PETR_SOLOGNE_CONFIG } from "./partners/petr-sologne";
import { SCET_CONFIG } from "./partners/scet";

// Source unique de vérité des partenaires. Ajouter un partenaire = ajouter une entrée ici.
export const PARTNERS: PartnerConfig[] = [
  CCI92_CONFIG,
  AURA_CONFIG,
  DDT_VOSGES_CONFIG,
  SCET_CONFIG,
  PETR_SOLOGNE_CONFIG,
  CCPEIDF_CONFIG,
];

export function getPartnerBySlug(slug: string | undefined): PartnerConfig | undefined {
  if (!slug) return undefined;
  return PARTNERS.find((p) => p.slug === slug);
}
