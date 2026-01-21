import { describe, it, expect } from "vitest";
import { hasJeNeSaisPas } from "./cache-validator";
import {
  DonneesComplementairesInputDto,
  TypeProprietaire,
  RaccordementEau,
  EtatBatiInfrastructure,
  PresencePollution,
  ValeurArchitecturale,
  QualitePaysage,
  QualiteVoieDesserte,
  TrameVerteEtBleue,
} from "@mutafriches/shared-types";

describe("hasJeNeSaisPas", () => {
  const donneesCompletes: DonneesComplementairesInputDto = {
    typeProprietaire: TypeProprietaire.PRIVE,
    raccordementEau: RaccordementEau.OUI,
    etatBatiInfrastructure: EtatBatiInfrastructure.DEGRADATION_MOYENNE,
    presencePollution: PresencePollution.NON,
    valeurArchitecturaleHistorique: ValeurArchitecturale.ORDINAIRE,
    qualitePaysage: QualitePaysage.ORDINAIRE,
    qualiteVoieDesserte: QualiteVoieDesserte.ACCESSIBLE,
    trameVerteEtBleue: TrameVerteEtBleue.HORS_TRAME,
  };

  it("devrait retourner false si aucun champ n'est 'je ne sais pas'", () => {
    expect(hasJeNeSaisPas(donneesCompletes)).toBe(false);
  });

  it("devrait retourner true si typeProprietaire est 'ne-sait-pas'", () => {
    const donnees = { ...donneesCompletes, typeProprietaire: TypeProprietaire.NE_SAIT_PAS };
    expect(hasJeNeSaisPas(donnees)).toBe(true);
  });

  it("devrait retourner true si raccordementEau est 'ne-sait-pas'", () => {
    const donnees = { ...donneesCompletes, raccordementEau: RaccordementEau.NE_SAIT_PAS };
    expect(hasJeNeSaisPas(donnees)).toBe(true);
  });

  it("devrait retourner true si etatBatiInfrastructure est 'ne-sait-pas'", () => {
    const donnees = {
      ...donneesCompletes,
      etatBatiInfrastructure: EtatBatiInfrastructure.NE_SAIT_PAS,
    };
    expect(hasJeNeSaisPas(donnees)).toBe(true);
  });

  it("devrait retourner true si presencePollution est 'ne-sait-pas'", () => {
    const donnees = { ...donneesCompletes, presencePollution: PresencePollution.NE_SAIT_PAS };
    expect(hasJeNeSaisPas(donnees)).toBe(true);
  });

  it("devrait retourner true si valeurArchitecturaleHistorique est 'ne-sait-pas'", () => {
    const donnees = {
      ...donneesCompletes,
      valeurArchitecturaleHistorique: ValeurArchitecturale.NE_SAIT_PAS,
    };
    expect(hasJeNeSaisPas(donnees)).toBe(true);
  });

  it("devrait retourner true si qualitePaysage est 'ne-sait-pas'", () => {
    const donnees = { ...donneesCompletes, qualitePaysage: QualitePaysage.NE_SAIT_PAS };
    expect(hasJeNeSaisPas(donnees)).toBe(true);
  });

  it("devrait retourner true si qualiteVoieDesserte est 'ne-sait-pas'", () => {
    const donnees = { ...donneesCompletes, qualiteVoieDesserte: QualiteVoieDesserte.NE_SAIT_PAS };
    expect(hasJeNeSaisPas(donnees)).toBe(true);
  });

  it("devrait retourner true si trameVerteEtBleue est 'ne-sait-pas'", () => {
    const donnees = { ...donneesCompletes, trameVerteEtBleue: TrameVerteEtBleue.NE_SAIT_PAS };
    expect(hasJeNeSaisPas(donnees)).toBe(true);
  });

  it("devrait retourner true si plusieurs champs sont 'ne-sait-pas'", () => {
    const donnees = {
      ...donneesCompletes,
      typeProprietaire: TypeProprietaire.NE_SAIT_PAS,
      raccordementEau: RaccordementEau.NE_SAIT_PAS,
    };
    expect(hasJeNeSaisPas(donnees)).toBe(true);
  });
});
