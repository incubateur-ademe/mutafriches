import { EtatBatiInfrastructure, ValeurArchitecturale } from "@mutafriches/shared-types";

type ChampBati = "etatBatiInfrastructure" | "valeurArchitecturaleHistorique";

type ValeursBati = Partial<Record<ChampBati, string>>;

// "Pas de bâti" sur l'un des deux champs rend l'autre sans objet : on le masque.
export function champBatiMasque(values: ValeursBati): ChampBati | null {
  if (values.valeurArchitecturaleHistorique === ValeurArchitecturale.PAS_DE_BATI) {
    return "etatBatiInfrastructure";
  }
  if (values.etatBatiInfrastructure === EtatBatiInfrastructure.PAS_DE_BATI) {
    return "valeurArchitecturaleHistorique";
  }
  return null;
}

// Aligne le champ masqué sur "Pas de bâti". Appliqué à l'envoi, pas à la saisie, pour
// restituer la réponse précédente si l'utilisateur revient sur "Pas de bâti".
export function normaliserBati<T extends ValeursBati>(values: T): T {
  if (champBatiMasque(values) === null) {
    return values;
  }
  return {
    ...values,
    etatBatiInfrastructure: EtatBatiInfrastructure.PAS_DE_BATI,
    valeurArchitecturaleHistorique: ValeurArchitecturale.PAS_DE_BATI,
  };
}
