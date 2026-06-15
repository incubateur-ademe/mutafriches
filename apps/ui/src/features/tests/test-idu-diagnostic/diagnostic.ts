import { isValidParcelId, normalizeParcelId, padParcelleSection } from "@mutafriches/shared-types";
import {
  fetchParcelByRef,
  fetchSectionParcels,
} from "@shared/services/cadastre/api.cadastre.service";

export type DiagnosticStatut =
  | "trouvee"
  | "format-invalide"
  | "commune-inconnue"
  | "section-absente"
  | "numero-introuvable"
  | "erreur";

export interface IduParts {
  departement: string;
  codeInsee: string;
  prefixe: string;
  section: string;
  numero: string;
}

export interface DiagnosticResult {
  iduSaisi: string;
  iduNormalise?: string;
  parts?: IduParts;
  commune?: string;
  statut: DiagnosticStatut;
  message: string;
  voisins?: string[]; // numéros voisins présents (cas numero-introuvable)
  contenance?: number; // surface en m² (cas trouvee)
}

/**
 * Découpe un IDU normalisé (section paddée à 2 car.) en composants.
 * Gère métropole (dépt 2 car.), DOM (97x, 3 car.) et Corse (2A/2B).
 */
export function parseIdu(iduPad: string): IduParts {
  let departement: string;
  if (/^97\d/.test(iduPad)) departement = iduPad.slice(0, 3);
  else if (/^2[AB]/i.test(iduPad)) departement = iduPad.slice(0, 2);
  else departement = iduPad.slice(0, 2);

  const rest = iduPad.slice(departement.length); // commune(3) + préfixe(3) + section(2) + numéro(4)
  const commune = rest.slice(0, 3);
  const prefixe = rest.slice(3, 6);
  const numero = rest.slice(-4);
  const section = rest.slice(6, rest.length - 4);

  return { departement, codeInsee: departement + commune, prefixe, section, numero };
}

async function fetchCommuneNom(codeInsee: string): Promise<string | null> {
  try {
    const res = await fetch(`https://geo.api.gouv.fr/communes/${codeInsee}?fields=nom`);
    if (!res.ok) return null;
    const data = (await res.json()) as { nom?: string };
    return data?.nom ?? null;
  } catch {
    return null;
  }
}

/**
 * Diagnostique un IDU : format, commune, section, existence de la parcelle.
 * Source : API Carto IGN (cadastre actuel) + geo.api.gouv.fr pour le nom de commune.
 */
export async function diagnostiquerIdu(iduSaisi: string): Promise<DiagnosticResult> {
  const idu = iduSaisi.trim();

  if (!isValidParcelId(idu)) {
    return {
      iduSaisi,
      statut: "format-invalide",
      message:
        "Format d'IDU invalide (attendu : département + commune + préfixe + section + numéro).",
    };
  }

  const iduNormalise = padParcelleSection(normalizeParcelId(idu));
  const parts = parseIdu(iduNormalise);
  const commune = await fetchCommuneNom(parts.codeInsee);

  let exact;
  try {
    exact = await fetchParcelByRef(parts.codeInsee, parts.section, parts.numero);
  } catch {
    exact = null;
  }
  if (exact === null) {
    return {
      iduSaisi,
      iduNormalise,
      parts,
      commune: commune ?? undefined,
      statut: "erreur",
      message: "Erreur lors de l'appel au cadastre (API Carto).",
    };
  }

  if (exact.features.length > 0) {
    const props = exact.features[0].properties;
    return {
      iduSaisi,
      iduNormalise,
      parts,
      commune: commune ?? props.nom_com,
      statut: "trouvee",
      message: "Parcelle trouvée dans le cadastre actuel.",
      contenance: props.contenance,
    };
  }

  // Pas trouvée : on inspecte la section pour qualifier le problème
  const section = await fetchSectionParcels(parts.codeInsee, parts.section);
  const features = section?.features ?? [];

  if (!commune && features.length === 0) {
    return {
      iduSaisi,
      iduNormalise,
      parts,
      statut: "commune-inconnue",
      message: `Code commune ${parts.codeInsee} introuvable dans le cadastre.`,
    };
  }

  if (features.length === 0) {
    return {
      iduSaisi,
      iduNormalise,
      parts,
      commune: commune ?? undefined,
      statut: "section-absente",
      message: `Section ${parts.section} absente du cadastre pour ${commune ?? parts.codeInsee}.`,
    };
  }

  // Section peuplée mais numéro absent : on cherche les voisins (signe d'un redécoupage)
  const cible = parseInt(parts.numero, 10);
  const voisins = features
    .map((f) => f.properties.numero)
    .filter((n): n is string => typeof n === "string")
    .filter((n) => Math.abs(parseInt(n, 10) - cible) <= 3)
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

  return {
    iduSaisi,
    iduNormalise,
    parts,
    commune: commune ?? undefined,
    statut: "numero-introuvable",
    message: voisins.length
      ? `Numéro ${parts.numero} absent — voisins présents (${voisins.join(", ")}) : parcelle vraisemblablement redécoupée ou renumérotée.`
      : `Numéro ${parts.numero} absent de la section ${parts.section}.`,
    voisins,
  };
}
