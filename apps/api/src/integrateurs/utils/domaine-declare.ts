import { PREFIXE_CLIENT_QGIS, CanalIntegrateur } from "@mutafriches/shared-types";
import { ORIGINES_DASHBOARDS_ADEME, ORIGINES_MUTAFRICHES } from "../../shared/utils";

const SCHEMA = /^[a-z][a-z0-9+.-]*:\/\//i;
const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;
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
// dans l'en-tête Origin. Retourne null si le domaine ne peut pas être déclaré : schéma autre
// que https, hôte local, adresse IP, port explicite ou domaine réservé.
export function normaliserDomaineDeclare(valeur: string): string | null {
  const brut = valeur.trim();
  if (!brut) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(SCHEMA.test(brut) ? brut : `https://${brut}`);
  } catch {
    return null;
  }

  const hote = url.hostname;
  const estLocal = !hote.includes(".") || SUFFIXES_LOCAUX.some((suffixe) => hote.endsWith(suffixe));
  const estIp = IPV4.test(hote) || hote.startsWith("[");
  const estReserve = HOTES_RESERVES.has(hote) || hote.endsWith(SUFFIXE_RESERVE);

  if (url.protocol !== "https:" || url.port || url.username || url.password) {
    return null;
  }
  if (estLocal || estIp || estReserve) {
    return null;
  }

  return url.origin;
}

// Valeur écrite dans la colonne `integrateur` des tables d'usage pour une origine déclarée,
// identique à ce que produit OrigineDetectionService.
export function cleStatsPourOrigine(canal: CanalIntegrateur, origine: string): string {
  const hote = new URL(origine).hostname;
  return canal === CanalIntegrateur.QGIS ? `${PREFIXE_CLIENT_QGIS}:${hote}` : hote;
}
