import { isValidParcelId, normalizeParcelId, parseNumParcelle } from "@mutafriches/shared-types";
import { lambert93ToWgs84 } from "./lambert";
import { parcelleByAttributes, parcelleByPoint } from "./apicarto.client";

// Les valeurs renvoyées par l'API cadastre sont écrites dans des fichiers TS/JSON générés :
// on les valide strictement avant tout usage (garde-fou injection, cf. CodeQL js/http-to-file-access).
const IDU_AUTORISE = /^[0-9A-Z]{13,15}$/; // IDU normalisé : uniquement chiffres + lettres majuscules
const COMMUNE_AUTORISEE = /^[A-Za-zÀ-ÿ0-9 '’()\-.]{1,80}$/;

// Normalise et valide un IDU réseau ; retourne null si le format n'est pas celui attendu.
export function iduSur(idu: string | undefined): string | null {
  if (!idu || !isValidParcelId(idu)) return null;
  const normalise = normalizeParcelId(idu);
  return IDU_AUTORISE.test(normalise) ? normalise : null;
}

// Ne conserve un nom de commune réseau que s'il ne contient que des caractères attendus.
export function communeSure(commune: string | undefined): string | undefined {
  return commune && COMMUNE_AUTORISEE.test(commune) ? commune : undefined;
}

export interface SiteInput {
  id: string;
  nom: string;
  commune: string;
  insee: string;
  numParcelle: string;
  x: number; // Lambert-93
  y: number; // Lambert-93
}

export interface ResolvedParcelle {
  ref: string; // référence source, ex. "AH13"
  idu: string | null; // IDU réel renvoyé par l'API, null si introuvable
  commune?: string;
}

export type StatutResolution = "OK" | "PARTIEL" | "MISMATCH" | "ECHEC";

export interface SiteResolution {
  id: string;
  nom: string;
  commune: string;
  insee: string;
  parcelles: ResolvedParcelle[];
  idusValides: string[];
  pointIdu: string | null; // IDU de la parcelle contenant le centroïde (contre-vérification)
  pointDansSite: boolean;
  statut: StatutResolution;
  messages: string[];
}

// Résout tous les IDU d'un site : par attributs (exhaustif) + contre-check par coordonnées.
export async function resolveSite(site: SiteInput): Promise<SiteResolution> {
  const refs = parseNumParcelle(site.numParcelle);
  const messages: string[] = [];

  if (refs.length === 0) {
    messages.push(`Champ num_parcelle illisible : "${site.numParcelle}"`);
  }

  const parcelles: ResolvedParcelle[] = [];
  for (const ref of refs) {
    const found = await parcelleByAttributes(site.insee, ref.section, ref.numero);
    const idu = iduSur(found?.idu);
    parcelles.push({
      ref: `${ref.section}${ref.numero}`,
      idu,
      commune: communeSure(found?.commune),
    });
    if (!idu) {
      messages.push(
        `Parcelle introuvable ou IDU invalide : ${site.insee} ${ref.section} ${ref.numero}`,
      );
    }
  }

  const idusValides = parcelles.map((p) => p.idu).filter((idu): idu is string => idu !== null);

  // Contre-vérification par coordonnées (best-effort).
  const { longitude, latitude } = lambert93ToWgs84(site.x, site.y);
  const pointParcelle = await parcelleByPoint(longitude, latitude);
  const pointIdu = iduSur(pointParcelle?.idu);
  const pointDansSite = pointIdu !== null && idusValides.includes(pointIdu);

  if (!pointIdu) {
    messages.push("Contre-vérification par coordonnées indisponible (aucune parcelle au point)");
  } else if (!pointDansSite) {
    messages.push(
      `IDU au point (${pointIdu}) absent des parcelles résolues — à vérifier manuellement`,
    );
  }

  let statut: StatutResolution;
  if (idusValides.length === 0) {
    statut = "ECHEC";
  } else if (idusValides.length < refs.length) {
    statut = "PARTIEL";
  } else if (pointIdu && !pointDansSite) {
    statut = "MISMATCH";
  } else {
    statut = "OK";
  }

  return {
    id: site.id,
    nom: site.nom,
    commune: site.commune,
    insee: site.insee,
    parcelles,
    idusValides,
    pointIdu,
    pointDansSite,
    statut,
    messages,
  };
}
