import { normalizeParcelId, parseNumParcelle } from "@mutafriches/shared-types";
import { lambert93ToWgs84 } from "./lambert";
import { parcelleByAttributes, parcelleByPoint } from "./apicarto.client";

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
    parcelles.push({
      ref: `${ref.section}${ref.numero}`,
      idu: found ? normalizeParcelId(found.idu) : null,
      commune: found?.commune,
    });
    if (!found) {
      messages.push(`Parcelle introuvable : ${site.insee} ${ref.section} ${ref.numero}`);
    }
  }

  const idusValides = parcelles.map((p) => p.idu).filter((idu): idu is string => idu !== null);

  // Contre-vérification par coordonnées (best-effort).
  const { longitude, latitude } = lambert93ToWgs84(site.x, site.y);
  const pointParcelle = await parcelleByPoint(longitude, latitude);
  const pointIdu = pointParcelle ? normalizeParcelId(pointParcelle.idu) : null;
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
