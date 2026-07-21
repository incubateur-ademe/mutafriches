/**
 * Découpe un texte collé en une liste d'identifiants cadastraux.
 *
 * Accepte les séparateurs courants (retour ligne, virgule, point-virgule, espace, tabulation).
 * Chaque identifiant est considéré comme un site mono-parcelle.
 *
 * @returns un tableau de sites (chaque site = liste d'une seule parcelle)
 */
export function parseIdentifiantsColles(texte: string): string[][] {
  return texte
    .split(/[\s,;]+/)
    .map((token) => token.trim().toUpperCase())
    .filter((token) => token.length > 0)
    .map((token) => [token]);
}
