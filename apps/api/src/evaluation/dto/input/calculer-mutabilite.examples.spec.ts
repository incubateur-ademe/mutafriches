import { describe, expect, it } from "vitest";
import {
  CHAMPS_COMPLEMENTAIRES_REQUIS,
  EtatBatiInfrastructure,
  PresenceEspecesProtegees,
  PresencePollution,
  PresenceZoneHumide,
  QualitePaysage,
  QualiteVoieDesserte,
  TrameVerteEtBleue,
  TypeProprietaire,
  ValeurArchitecturale,
  listerChampsComplementairesManquants,
} from "@mutafriches/shared-types";
import { CALCULER_MUTABILITE_BODY_EXAMPLES } from "./calculer-mutabilite.examples";

// Un exemple Swagger est copié tel quel par les intégrateurs : il doit être un payload valide
const VALEURS_ATTENDUES: Record<string, string[]> = {
  typeProprietaire: Object.values(TypeProprietaire),
  etatBatiInfrastructure: Object.values(EtatBatiInfrastructure),
  presencePollution: Object.values(PresencePollution),
  valeurArchitecturaleHistorique: Object.values(ValeurArchitecturale),
  qualitePaysage: Object.values(QualitePaysage),
  qualiteVoieDesserte: Object.values(QualiteVoieDesserte),
  trameVerteEtBleue: Object.values(TrameVerteEtBleue),
  presenceEspecesProtegees: Object.values(PresenceEspecesProtegees),
  presenceZoneHumide: Object.values(PresenceZoneHumide),
};

const exemples = Object.entries(CALCULER_MUTABILITE_BODY_EXAMPLES);

describe("CALCULER_MUTABILITE_BODY_EXAMPLES", () => {
  it.each(exemples)("l'exemple %s fournit les 9 champs requis", (_nom, exemple) => {
    expect(listerChampsComplementairesManquants(exemple.value.donneesComplementaires)).toEqual([]);
  });

  it.each(exemples)("l'exemple %s n'utilise que des valeurs d'enum existantes", (_nom, exemple) => {
    const donnees = exemple.value.donneesComplementaires as Record<string, string>;

    for (const champ of CHAMPS_COMPLEMENTAIRES_REQUIS) {
      expect(VALEURS_ATTENDUES[champ]).toContain(donnees[champ]);
    }
  });
});
