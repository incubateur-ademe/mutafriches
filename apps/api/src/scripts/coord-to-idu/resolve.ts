import {
  parcelleAvecPrefixe,
  parseNumParcelle,
  segmentsIllisibles,
  PREFIXE_COM_ABS_DEFAUT,
  sanitizeCodeInsee,
  sanitizeCommuneName,
  sanitizeParcelIdForApi,
} from "@mutafriches/shared-types";
import { lambert93ToWgs84 } from "./lambert";
import { parcelleByAttributes, parcellesByAttributes, parcelleByPoint } from "./apicarto.client";
import { communeVersInsee } from "./commune-insee.client";

// Les valeurs renvoyées par l'API cadastre sont écrites dans des fichiers TS/JSON générés : on les
// valide via les utilitaires partagés avant tout usage (garde-fou injection, cf. CodeQL
// js/http-to-file-access). sanitizeParcelIdForApi valide + normalise l'IDU ; sanitizeCommuneName
// restreint le nom de commune à un jeu de caractères sûr.
function iduSur(idu: string | undefined): string | null {
  return idu ? sanitizeParcelIdForApi(idu) : null;
}

export interface SiteInput {
  id: string;
  nom: string;
  commune: string;
  /** Code INSEE. Absent, il est résolu depuis `commune` + `departement`. */
  insee?: string;
  /** Département (2-3 car.), requis seulement quand `insee` est absent. */
  departement?: string;
  numParcelle: string;
  x?: number; // Lambert-93, optionnel : contre-vérification par coordonnées
  y?: number; // Lambert-93, optionnel
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

// Résout l'IDU d'une référence. Avec un préfixe COM_ABS explicite (commune nouvelle), on
// départage les parcelles homonymes des communes absorbées au lieu de prendre la première.
async function resoudreParcelle(
  insee: string,
  section: string,
  numero: string,
  prefixe: string,
): Promise<{ idu: string | null; commune?: string }> {
  if (prefixe === PREFIXE_COM_ABS_DEFAUT) {
    const found = await parcelleByAttributes(insee, section, numero);
    return { idu: iduSur(found?.idu), commune: sanitizeCommuneName(found?.commune) ?? undefined };
  }

  const reponse = await parcellesByAttributes(insee, section, numero);
  const found = reponse ? parcelleAvecPrefixe(reponse, prefixe) : null;
  return { idu: iduSur(found?.idu), commune: sanitizeCommuneName(found?.commune) ?? undefined };
}

// Résout tous les IDU d'un site : par attributs (exhaustif) + contre-check par coordonnées.
export async function resolveSite(site: SiteInput): Promise<SiteResolution> {
  const refs = parseNumParcelle(site.numParcelle);
  const messages: string[] = [];

  if (refs.length === 0) {
    messages.push(`Champ num_parcelle illisible : "${site.numParcelle}"`);
  }

  // Un segment écarté par le parseur est une parcelle perdue : le signaler plutôt que de la
  // laisser disparaître silencieusement de l'inventaire.
  const illisibles = segmentsIllisibles(site.numParcelle);
  if (illisibles.length > 0) {
    messages.push(`Segments de parcelle ignorés : ${illisibles.join(", ")}`);
  }

  // Code INSEE : fourni par la source (validé, il part dans une URL), sinon résolu depuis le
  // nom de commune.
  let insee = sanitizeCodeInsee(site.insee) ?? "";
  if (site.insee && !insee) {
    messages.push(`Code INSEE invalide dans l'inventaire : "${site.insee}"`);
  }
  if (!insee) {
    const resolue = site.departement
      ? await communeVersInsee(site.commune, site.departement)
      : null;
    // Seconde barrière, au point où une valeur réseau entre dans le pipeline : `insee` part
    // ensuite dans une URL apicarto et dans les fichiers générés (CodeQL js/http-to-file-access).
    const inseeResolu = sanitizeCodeInsee(resolue?.codeInsee);
    if (inseeResolu) {
      insee = inseeResolu;
    } else {
      messages.push(
        `Code INSEE introuvable pour "${site.commune}" (département ${site.departement ?? "?"})`,
      );
      return {
        id: site.id,
        nom: site.nom,
        commune: site.commune,
        insee: "",
        parcelles: [],
        idusValides: [],
        pointIdu: null,
        pointDansSite: false,
        statut: "ECHEC",
        messages,
      };
    }
  }

  const parcelles: ResolvedParcelle[] = [];
  for (const ref of refs) {
    const { idu, commune } = await resoudreParcelle(insee, ref.section, ref.numero, ref.prefixe);
    const prefixeAffiche = ref.prefixe === PREFIXE_COM_ABS_DEFAUT ? "" : ref.prefixe;
    parcelles.push({ ref: `${prefixeAffiche}${ref.section}${ref.numero}`, idu, commune });
    if (!idu) {
      messages.push(
        `Parcelle introuvable ou IDU invalide : ${insee} ${ref.prefixe} ${ref.section} ${ref.numero}`,
      );
    }
  }

  const idusValides = parcelles.map((p) => p.idu).filter((idu): idu is string => idu !== null);

  // Contre-vérification par coordonnées (best-effort, seulement si la source en fournit).
  let pointIdu: string | null = null;
  let pointDansSite = false;
  if (site.x !== undefined && site.y !== undefined) {
    const { longitude, latitude } = lambert93ToWgs84(site.x, site.y);
    const pointParcelle = await parcelleByPoint(longitude, latitude);
    pointIdu = iduSur(pointParcelle?.idu);
    pointDansSite = pointIdu !== null && idusValides.includes(pointIdu);

    if (!pointIdu) {
      messages.push("Contre-vérification par coordonnées indisponible (aucune parcelle au point)");
    } else if (!pointDansSite) {
      messages.push(
        `IDU au point (${pointIdu}) absent des parcelles résolues — à vérifier manuellement`,
      );
    }
  }

  let statut: StatutResolution;
  if (idusValides.length === 0) {
    statut = "ECHEC";
  } else if (idusValides.length < refs.length || illisibles.length > 0) {
    // Un segment illisible ne figure pas dans `refs` : sans ce test, un site amputé d'une
    // parcelle ressortirait « OK ».
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
    insee,
    parcelles,
    idusValides,
    pointIdu,
    pointDansSite,
    statut,
    messages,
  };
}
