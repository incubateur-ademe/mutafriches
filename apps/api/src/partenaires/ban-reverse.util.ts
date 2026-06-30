// Nom de la rue la plus proche d'un point (BAN reverse). Best-effort : retourne null
// en cas d'erreur ou d'absence de résultat. Cf. ADR-0021.
export async function reverseRueProche(
  latitude: number,
  longitude: number,
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api-adresse.data.gouv.fr/reverse/?lon=${longitude}&lat=${latitude}`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      features?: { properties?: { name?: string; street?: string } }[];
    };
    const props = data.features?.[0]?.properties;
    return props?.street ?? props?.name ?? null;
  } catch {
    return null;
  }
}
