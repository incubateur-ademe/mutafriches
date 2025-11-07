/**
 * Normalise un identifiant de parcelle cadastrale selon le format IGN
 *
 * @see Documentation IGN - Parcellaire Express (PCI) v1.0
 * https://geoservices.ign.fr/sites/default/files/2021-07/DC_Parcellaire_Express_(PCI)_1-0.pdf
 * Section 3.1.1 : Format de l'identifiant parcellaire (IDU)
 *
 * Format officiel IGN :
 * - CODE_DEP (2-3 car) : Code département (01-95, 2A/2B, 971-976)
 * - CODE_COM (3 car) : Code commune INSEE
 * - COM_ABS (3 car) : Code commune absorbée (000 si pas de fusion)
 * - SECTION (1-2 car) : Section cadastrale (lettres majuscules A-Z)
 * - NUMERO (4 car) : Numéro de parcelle
 *
 * Longueur totale : 13-15 caractères selon département et longueur de section
 *
 * === CAS PROBLÉMATIQUES IDENTIFIÉS ===
 *
 * Problème utilisateur #1 (Aubenas) :
 * Input: "070190000B2188" → Erreur "Format d'identifiant invalide"
 * Analyse: Section codée "0B" au lieu de "B"
 * Cause: La section officielle fait 1-2 caractères. Quand elle n'a qu'une lettre,
 *        elle est parfois préfixée par '0' pour respecter un format à 2 caractères.
 *
 * Problème utilisateur #2 (Paris) :
 * Input: "75113000DL0052" → Erreur "Format d'identifiant invalide"
 * Analyse: Section "DL" valide (2 lettres), mais validation trop stricte
 * Cause: L'ancien système n'acceptait pas les sections à 2 lettres
 *
 * === RÈGLE MÉTIER DE NORMALISATION ===
 *
 * OBJECTIF : Convertir les sections préfixées "0X" en sections simples "X"
 *           pour obtenir le format normalisé attendu par l'API IGN
 *
 * CONDITIONS :
 * - La section fait exactement 2 caractères
 * - Le premier caractère est '0'
 * - Le second caractère est une lettre majuscule A-Z
 *
 * ACTION : Supprimer le '0' préfixe pour obtenir une section d'1 seule lettre
 *
 * EXEMPLES :
 * - "070190000B2188" (14 car) → "07019000B2188" (13 car) ✅ Section "0B" → "B"
 * - "9720900000O0498" (15 car) → "972090000O0498" (14 car) ✅ Section "0O" → "O"
 * - "75113000DL0052" (14 car) → "75113000DL0052" (inchangé) ✅ Section "DL" déjà correcte
 * - "25056000HZ0346" (14 car) → "25056000HZ0346" (inchangé) ✅ Section "HZ" déjà correcte
 *
 * @param id - L'identifiant parcellaire brut (peut contenir des sections préfixées)
 * @returns L'identifiant normalisé (sections préfixées converties en sections simples)
 */
export function normalizeParcelId(id: string): string {
  if (!id || typeof id !== "string" || id.length < 13) return id;

  // Identifier le département
  let deptLen = 2;
  if (id[0] === "9" && (id[1] === "7" || id[1] === "8")) {
    deptLen = 3;
  } else if ((id[0] === "2" || id[0] === "9") && (id[1] === "A" || id[1] === "B")) {
    deptLen = 2;
  }

  // Extraire les composants
  const dept = id.substring(0, deptLen);
  const commune = id.substring(deptLen, deptLen + 3);
  const parcelle = id.substring(id.length - 4); // 4 derniers caractères
  const comAbsAndSection = id.substring(deptLen + 3, id.length - 4); // COM_ABS (3) + SECTION (1-2)

  // COM_ABS fait toujours 3 caractères
  if (comAbsAndSection.length < 4) return id; // Format invalide

  const comAbs = comAbsAndSection.substring(0, 3);
  const section = comAbsAndSection.substring(3); // 1 ou 2 caractères restants

  // Normaliser si la section est "0X" où X est une lettre unique
  // Pattern: section = "0" suivi d'une seule lettre majuscule
  if (section.length === 2 && section[0] === "0" && /^[A-Z]$/.test(section[1])) {
    // Retirer le '0' préfixe de la section
    const normalizedSection = section[1];
    return dept + commune + comAbs + normalizedSection + parcelle;
  }

  // Sinon retourner inchangé
  return id;
}

/**
 * Vérifie si un identifiant de parcelle cadastrale est valide
 *
 * Format des identifiants cadastraux français :
 * - Code département : 2 ou 3 chiffres (01-95, 2A, 2B, 971-976)
 * - Code commune : 3 chiffres
 * - Code commune absorbée : 3 chiffres (000 si pas de fusion)
 * - Section : 1 ou 2 lettres majuscules
 * - Numéro de parcelle : 4 chiffres
 *
 * Exemples valides (après normalisation) :
 * - 07019000B2188
 * - 250560000HZ0346
 * - 2A00400AC0045
 * - 97209000O0498
 * - 75113000DL0052
 *
 * @param id Le numéro de parcelle au format cadastral (brut ou normalisé)
 * @returns true si l'identifiant est valide après normalisation, false sinon
 */
export function isValidParcelId(id: string): boolean {
  if (!id || typeof id !== "string") return false;

  // Normaliser l'IDU avant validation
  const normalizedId = normalizeParcelId(id);

  // La longueur varie selon le format :
  // - Métropole avec section 1 lettre : 2 + 3 + 3 + 1 + 4 = 13 car
  // - Métropole avec section 2 lettres : 2 + 3 + 3 + 2 + 4 = 14 car
  // - DOM avec section 1 lettre : 3 + 3 + 3 + 1 + 4 = 14 car
  // - DOM avec section 2 lettres : 3 + 3 + 3 + 2 + 4 = 15 car
  // - Corse avec section 1 lettre : 2 + 3 + 3 + 1 + 4 = 13 car
  // - Corse avec section 2 lettres : 2 + 3 + 3 + 2 + 4 = 14 car

  const patterns = [
    // Métropole : dept(2) + commune(3) + comAbs(3) + section(1-2) + parcelle(4) = 13-14 car
    /^[0-9]{2}[0-9]{3}[0-9]{3}[A-Z]{1,2}[0-9]{4}$/,
    // DOM (971-976) : dept(3) + commune(3) + comAbs(3) + section(1-2) + parcelle(4) = 14-15 car
    /^97[1-6][0-9]{3}[0-9]{3}[A-Z]{1,2}[0-9]{4}$/,
    // Corse (2A, 2B) : dept(2) + commune(3) + comAbs(3) + section(1-2) + parcelle(4) = 13-14 car
    /^2[AB][0-9]{3}[0-9]{3}[A-Z]{1,2}[0-9]{4}$/,
  ];

  return patterns.some((pattern) => pattern.test(normalizedId));
}

/**
 * Normalise l'IDU et le retourne formaté pour l'API IGN
 * À utiliser avant tout appel API
 *
 * @param id IDU brut potentiellement mal formaté
 * @returns IDU normalisé et validé, ou null si invalide
 */
export function sanitizeParcelIdForApi(id: string): string | null {
  if (!isValidParcelId(id)) {
    return null;
  }
  return normalizeParcelId(id);
}
