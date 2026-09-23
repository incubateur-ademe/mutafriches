import { normalizeParcelId } from "@mutafriches/shared-types";

// Parcelles du site que l'enrichissement n'a pas retrouvées au cadastre (renumérotation).
// identifiantsParcelles absent (ancien cache, mono-parcelle) : rien à signaler.
export function parcellesIntrouvables(
  parcellesSite: string[],
  identifiantsEnrichis: string[] | undefined,
): string[] {
  if (!identifiantsEnrichis) return [];
  const trouvees = new Set(identifiantsEnrichis.map(normalizeParcelId));
  return parcellesSite.filter((id) => !trouvees.has(normalizeParcelId(id)));
}
