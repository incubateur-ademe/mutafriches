// Borne la charge sur les APIs externes : au plus `taille` appels simultanés, ordre préservé.
// Une erreur interrompt le traitement, comme Promise.all.
export async function mapParLots<T, R>(
  elements: readonly T[],
  taille: number,
  traiter: (element: T) => Promise<R>,
): Promise<R[]> {
  const resultats: R[] = [];
  for (let debut = 0; debut < elements.length; debut += taille) {
    const lot = await Promise.all(elements.slice(debut, debut + taille).map(traiter));
    resultats.push(...lot);
  }
  return resultats;
}
