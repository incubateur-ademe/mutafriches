/**
 * Utilitaires de référence cadastrale : reconstruire des identifiants parcellaires (IDU)
 * à partir d'un champ « numéro de parcelle » libre fourni par un partenaire.
 *
 * Contexte : certains inventaires de friches ne fournissent pas l'IDU normalisé mais un
 * champ compact du type "AB160/161/163" (une section, plusieurs numéros) ou "AC578/ZB580"
 * (plusieurs sections). Ces fonctions le décomposent en références (préfixe, section,
 * numéro) et construisent un IDU candidat. L'IDU réel doit ensuite être confirmé via l'API
 * cadastre, qui seule fait foi sur l'existence de la parcelle.
 */

/** Préfixe COM_ABS par défaut : commune sans commune absorbée. */
export const PREFIXE_COM_ABS_DEFAUT = "000";

export interface ReferenceParcelle {
  prefixe: string; // préfixe COM_ABS (3 chiffres), "000" hors commune absorbée
  section: string; // section cadastrale (1-2 lettres, ex. "A", "AB", "ZI")
  numero: string; // numéro brut sans zéros de tête (ex. "13", "578")
}

// Un segment par forme rencontrée dans les inventaires partenaires. L'ordre compte :
// la forme préfixée est testée avant la section paddée (aucune ne peut matcher l'autre,
// le préfixe faisant 3 chiffres).
const SEGMENT_PREFIXE = /^(\d{3})([A-Z]{1,2})(\d+)$/; // "267B18"  → COM_ABS 267, section B
const SEGMENT_SECTION_PADDEE = /^0([A-Z])(\d+)$/; // "0F1444" → section F (paddée "0F")
const SEGMENT_SIMPLE = /^([A-Z]{1,2})(\d+)$/; // "AH13"   → section AH
const SEGMENT_NUMERO_SEUL = /^(\d+)$/; // "161"    → hérite de la section précédente

/**
 * Décompose un champ « numéro de parcelle » partenaire en références parcellaires.
 *
 * Règles :
 * - séparateur : "/"
 * - un segment avec des lettres définit une nouvelle section (ex. "ZB580")
 * - un segment sans lettre hérite de la section (et du préfixe) précédents (ex. "161")
 * - un segment préfixé de 3 chiffres porte un COM_ABS de commune absorbée (ex. "267B18")
 * - une section peut être écrite paddée à 2 caractères (ex. "0F1444" = section F)
 *
 * Exemples :
 * - "AH13"                 → [{ 000, AH, 13 }]
 * - "AB160/161/163"        → [{ 000, AB, 160 }, { 000, AB, 161 }, { 000, AB, 163 }]
 * - "AC578/ZB580"          → [{ 000, AC, 578 }, { 000, ZB, 580 }]
 * - "267B18/ 267B21"       → [{ 267, B, 18 }, { 267, B, 21 }]
 * - "0F1444/ 0F1445"       → [{ 000, F, 1444 }, { 000, F, 1445 }]
 */
export function parseNumParcelle(champ: string): ReferenceParcelle[] {
  if (!champ || typeof champ !== "string") return [];

  const segments = champ
    .toUpperCase()
    .split("/")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const result: ReferenceParcelle[] = [];
  let prefixeCourant = PREFIXE_COM_ABS_DEFAUT;
  let sectionCourante: string | null = null;

  for (const segment of segments) {
    const prefixe = SEGMENT_PREFIXE.exec(segment);
    if (prefixe) {
      prefixeCourant = prefixe[1];
      sectionCourante = prefixe[2];
      result.push({ prefixe: prefixeCourant, section: sectionCourante, numero: prefixe[3] });
      continue;
    }

    const paddee = SEGMENT_SECTION_PADDEE.exec(segment);
    if (paddee) {
      prefixeCourant = PREFIXE_COM_ABS_DEFAUT;
      sectionCourante = paddee[1];
      result.push({ prefixe: prefixeCourant, section: sectionCourante, numero: paddee[2] });
      continue;
    }

    const simple = SEGMENT_SIMPLE.exec(segment);
    if (simple) {
      prefixeCourant = PREFIXE_COM_ABS_DEFAUT;
      sectionCourante = simple[1];
      result.push({ prefixe: prefixeCourant, section: sectionCourante, numero: simple[2] });
      continue;
    }

    const numeroSeul = SEGMENT_NUMERO_SEUL.exec(segment);
    if (numeroSeul && sectionCourante) {
      result.push({ prefixe: prefixeCourant, section: sectionCourante, numero: numeroSeul[1] });
    }
    // Tout autre segment est illisible : ignoré ici, rapporté par l'appelant.
  }

  return result;
}

/**
 * Construit un IDU candidat (14 car.) à partir d'un code INSEE et d'une référence
 * parcellaire. Candidat seulement : l'IDU réel doit être confirmé par l'API cadastre, qui
 * seule connaît le COM_ABS exact quand la source ne le porte pas.
 *
 * - section paddée à 2 caractères ("A" → "0A")
 * - numéro paddé à 4 caractères ("13" → "0013")
 */
export function buildIduCandidate(
  codeInsee: string,
  section: string,
  numero: string,
  prefixe: string = PREFIXE_COM_ABS_DEFAUT,
): string {
  const sectionPad = section.toUpperCase().padStart(2, "0");
  const numeroPad = numero.padStart(4, "0");
  return `${codeInsee}${prefixe}${sectionPad}${numeroPad}`;
}

/**
 * Préfixe COM_ABS porté par un IDU (positions 5 à 8, après le code INSEE).
 * Accepte les deux longueurs renvoyées par l'API Carto : section paddée (14) ou non (13).
 */
export function prefixeDeIdu(idu: string | undefined): string | null {
  if (!idu || (idu.length !== 13 && idu.length !== 14)) return null;
  return idu.substring(5, 8);
}
