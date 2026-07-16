import {
  ApicartoCadastreResponse,
  apicartoCadastreUrl,
  ParcelleCadastre,
  premiereParcelle,
} from "@mutafriches/shared-types";

// Frontière I/O navigateur : les conventions apicarto vivent dans shared-types.
export async function fetchCadastre(
  params: Record<string, string>,
): Promise<ParcelleCadastre | null> {
  const res = await fetch(apicartoCadastreUrl(params));
  if (!res.ok) return null;
  return premiereParcelle((await res.json()) as ApicartoCadastreResponse);
}
