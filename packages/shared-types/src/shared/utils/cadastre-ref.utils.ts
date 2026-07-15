/**
 * Utilitaires de référence cadastrale : reconstruire des identifiants parcellaires (IDU)
 * à partir d'un champ « numéro de parcelle » libre fourni par un partenaire.
 *
 * Contexte : certains inventaires de friches ne fournissent pas l'IDU normalisé mais un
 * champ compact du type "AB160/161/163" (une section, plusieurs numéros) ou "AC578/ZB580"
 * (plusieurs sections). Ces fonctions le décomposent en couples (section, numéro) et
 * construisent un IDU candidat. L'IDU réel doit ensuite être confirmé via l'API cadastre
 * (le préfixe COM_ABS n'est pas déductible du champ source).
 */

export interface ReferenceParcelle {
  section: string; // section cadastrale (1-2 lettres, ex. "A", "AB", "ZI")
  numero: string; // numéro brut sans zéros de tête (ex. "13", "578")
}

/**
 * Décompose un champ « numéro de parcelle » partenaire en couples (section, numéro).
 *
 * Règles :
 * - séparateur : "/"
 * - un segment avec des lettres définit une nouvelle section (ex. "ZB580")
 * - un segment sans lettre hérite de la dernière section rencontrée (ex. "161")
 *
 * Exemples :
 * - "AH13"                 → [{ AH, 13 }]
 * - "AB160/161/163"        → [{ AB, 160 }, { AB, 161 }, { AB, 163 }]
 * - "AC578/ZB580"          → [{ AC, 578 }, { ZB, 580 }]
 */
export function parseNumParcelle(champ: string): ReferenceParcelle[] {
  if (!champ || typeof champ !== "string") return [];

  const segments = champ
    .toUpperCase()
    .split("/")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const result: ReferenceParcelle[] = [];
  let sectionCourante: string | null = null;

  for (const segment of segments) {
    const match = /^([A-Z]*)(\d+)$/.exec(segment);
    if (!match) continue; // segment illisible, ignoré (rapporté en amont)

    const [, lettres, numero] = match;
    if (lettres.length > 0) {
      sectionCourante = lettres;
    }
    if (!sectionCourante) continue; // numéro avant toute section, illisible

    result.push({ section: sectionCourante, numero });
  }

  return result;
}

/**
 * Construit un IDU candidat (14-15 car.) à partir d'un code INSEE, d'une section et d'un
 * numéro. Le préfixe COM_ABS est fixé à "000" (cas courant sans commune absorbée) ; l'IDU
 * réel doit être confirmé par l'API cadastre, qui renvoie le COM_ABS exact.
 *
 * - section paddée à 2 caractères ("A" → "0A")
 * - numéro paddé à 4 caractères ("13" → "0013")
 */
export function buildIduCandidate(codeInsee: string, section: string, numero: string): string {
  const sectionPad = section.toUpperCase().padStart(2, "0");
  const numeroPad = numero.padStart(4, "0");
  return `${codeInsee}000${sectionPad}${numeroPad}`;
}
