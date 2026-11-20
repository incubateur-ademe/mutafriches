import {
  CanalIntegrateur,
  hoteDeDomaineDeclare,
  PREFIXE_CLIENT_QGIS,
} from "@mutafriches/shared-types";
import { ORIGINES_DASHBOARDS_ADEME, ORIGINES_MUTAFRICHES } from "../../shared/utils";

const SUFFIXES_LOCAUX = [".localhost", ".local"];
// Nos propres domaines ne se déclarent pas : ils sont codés, et l'origine partagée des
// anciennes versions de l'extension QGIS reste réservée.
const SUFFIXE_RESERVE = "mutafriches.beta.gouv.fr";
const HOTES_RESERVES = new Set(
  [...ORIGINES_MUTAFRICHES, ...ORIGINES_DASHBOARDS_ADEME].map(
    (origine) => new URL(origine).hostname,
  ),
);

// Ramène une saisie libre (`exemple.fr`, `https://www.exemple.fr/outil`) à l'origine envoyée
// dans l'en-tête Origin. Retourne null si le domaine ne peut pas être déclaré : nom de domaine
// invalide (cf. hoteDeDomaineDeclare), suffixe local ou domaine réservé.
export function normaliserDomaineDeclare(valeur: string): string | null {
  const hote = hoteDeDomaineDeclare(valeur);
  if (!hote) {
    return null;
  }

  const estLocal = SUFFIXES_LOCAUX.some((suffixe) => hote.endsWith(suffixe));
  const estReserve = HOTES_RESERVES.has(hote) || hote.endsWith(SUFFIXE_RESERVE);

  return estLocal || estReserve ? null : `https://${hote}`;
}

// Valeur écrite dans la colonne `integrateur` des tables d'usage pour une origine déclarée,
// identique à ce que produit OrigineDetectionService.
export function cleStatsPourOrigine(canal: CanalIntegrateur, origine: string): string {
  const hote = new URL(origine).hostname;
  return canal === CanalIntegrateur.QGIS ? `${PREFIXE_CLIENT_QGIS}:${hote}` : hote;
}
