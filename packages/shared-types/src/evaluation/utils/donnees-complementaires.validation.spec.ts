import { describe, expect, it } from "vitest";
import {
  CHAMPS_COMPLEMENTAIRES_REQUIS,
  listerChampsComplementairesManquants,
} from "./donnees-complementaires.validation";
import { CRITERES_METADATA } from "../../recapitulatif/criteres.metadata";
import { DonneesComplementairesInputDto } from "../dto/donnees-complementaires-input.dto";
import {
  EtatBatiInfrastructure,
  PresenceEspecesProtegees,
  PresencePollution,
  PresenceZoneHumide,
  QualitePaysage,
  QualiteVoieDesserte,
  TypeProprietaire,
  ValeurArchitecturale,
} from "../enums";
import { TrameVerteEtBleue } from "../../enrichissement";

const DONNEES_COMPLETES: DonneesComplementairesInputDto = {
  typeProprietaire: TypeProprietaire.PRIVE,
  etatBatiInfrastructure: EtatBatiInfrastructure.DEGRADATION_HETEROGENE,
  presencePollution: PresencePollution.NE_SAIT_PAS,
  valeurArchitecturaleHistorique: ValeurArchitecturale.INTERET_REMARQUABLE,
  qualitePaysage: QualitePaysage.ORDINAIRE,
  qualiteVoieDesserte: QualiteVoieDesserte.ACCESSIBLE,
  trameVerteEtBleue: TrameVerteEtBleue.HORS_TRAME,
  presenceEspecesProtegees: PresenceEspecesProtegees.NON,
  presenceZoneHumide: PresenceZoneHumide.NON,
};

describe("CHAMPS_COMPLEMENTAIRES_REQUIS", () => {
  it("couvre les critères manuels de CRITERES_METADATA, hors raccordementEau dérivé", () => {
    const criteresManuels = Object.values(CRITERES_METADATA)
      .filter((critere) => critere.saisie === "MANUELLE")
      .map((critere) => critere.key)
      .filter((key) => key !== "raccordementEau")
      .sort();

    expect([...CHAMPS_COMPLEMENTAIRES_REQUIS].sort()).toEqual(criteresManuels);
  });

  it("n'exige pas raccordementEau, dérivé de la surface bâtie", () => {
    expect(CHAMPS_COMPLEMENTAIRES_REQUIS).not.toContain("raccordementEau");
  });
});

describe("listerChampsComplementairesManquants", () => {
  it("ne signale rien sur un payload complet", () => {
    expect(listerChampsComplementairesManquants(DONNEES_COMPLETES)).toEqual([]);
  });

  it("signale tous les champs si le bloc est absent", () => {
    expect(listerChampsComplementairesManquants(undefined)).toEqual([
      ...CHAMPS_COMPLEMENTAIRES_REQUIS,
    ]);
    expect(listerChampsComplementairesManquants(null)).toEqual([...CHAMPS_COMPLEMENTAIRES_REQUIS]);
  });

  it("signale les champs du payload partenaire en échec du 28/07/2026", () => {
    const payloadPartenaire = {
      typeProprietaire: TypeProprietaire.PRIVE,
      etatBatiInfrastructure: EtatBatiInfrastructure.DEGRADATION_HETEROGENE,
      presencePollution: PresencePollution.NE_SAIT_PAS,
      valeurArchitecturaleHistorique: ValeurArchitecturale.INTERET_REMARQUABLE,
      qualitePaysage: QualitePaysage.ORDINAIRE,
      qualiteVoieDesserte: QualiteVoieDesserte.ACCESSIBLE,
    };

    expect(listerChampsComplementairesManquants(payloadPartenaire)).toEqual([
      "trameVerteEtBleue",
      "presenceEspecesProtegees",
      "presenceZoneHumide",
    ]);
  });

  it("traite null, undefined et chaîne vide comme manquants", () => {
    const donnees = {
      ...DONNEES_COMPLETES,
      qualitePaysage: null,
      trameVerteEtBleue: undefined,
      presenceZoneHumide: "",
    } as unknown as Partial<DonneesComplementairesInputDto>;

    expect(listerChampsComplementairesManquants(donnees)).toEqual([
      "qualitePaysage",
      "trameVerteEtBleue",
      "presenceZoneHumide",
    ]);
  });

  it("accepte ne-sait-pas comme réponse valide", () => {
    const donnees = {
      ...DONNEES_COMPLETES,
      presenceEspecesProtegees: PresenceEspecesProtegees.NE_SAIT_PAS,
      presenceZoneHumide: PresenceZoneHumide.NE_SAIT_PAS,
    };

    expect(listerChampsComplementairesManquants(donnees)).toEqual([]);
  });
});
