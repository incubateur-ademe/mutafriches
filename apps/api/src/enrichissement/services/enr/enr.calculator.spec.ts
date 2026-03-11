import { ZaerEnrichissement, ZoneAccelerationEnr } from "@mutafriches/shared-types";
import { EnrCalculator } from "./enr.calculator";

describe("EnrCalculator", () => {
  let calculator: EnrCalculator;

  beforeEach(() => {
    calculator = new EnrCalculator();
  });

  describe("evaluer", () => {
    it("devrait retourner NON si zaer est undefined", () => {
      expect(calculator.evaluer(undefined)).toBe(ZoneAccelerationEnr.NON);
    });

    it("devrait retourner NON si enZoneZaer est false", () => {
      const zaer: ZaerEnrichissement = {
        enZoneZaer: false,
        nombreZones: 0,
        filieres: [],
        zones: [],
      };
      expect(calculator.evaluer(zaer)).toBe(ZoneAccelerationEnr.NON);
    });

    it("devrait retourner OUI pour une zone ZAER sans PV ombrière", () => {
      const zaer: ZaerEnrichissement = {
        enZoneZaer: true,
        nombreZones: 1,
        filieres: ["EOLIEN"],
        zones: [{ nom: "Zone éolien", filiere: "EOLIEN", detailFiliere: null }],
      };
      expect(calculator.evaluer(zaer)).toBe(ZoneAccelerationEnr.OUI);
    });

    it("devrait retourner OUI pour une zone PV toit (sans ombrière)", () => {
      const zaer: ZaerEnrichissement = {
        enZoneZaer: true,
        nombreZones: 1,
        filieres: ["SOLAIRE_PV"],
        zones: [
          { nom: "Zone solaire", filiere: "SOLAIRE_PV", detailFiliere: "SOLAIRE_PV_NV_TOIT" },
        ],
      };
      expect(calculator.evaluer(zaer)).toBe(ZoneAccelerationEnr.OUI);
    });

    it("devrait retourner OUI_SOLAIRE_PV_OMBRIERE si detailFiliere contient OMBRIERE", () => {
      const zaer: ZaerEnrichissement = {
        enZoneZaer: true,
        nombreZones: 1,
        filieres: ["SOLAIRE_PV"],
        zones: [
          {
            nom: "Zone solaire ombrière",
            filiere: "SOLAIRE_PV",
            detailFiliere: "SOLAIRE_PV_NV_OMBRIERE",
          },
        ],
      };
      expect(calculator.evaluer(zaer)).toBe(ZoneAccelerationEnr.OUI_SOLAIRE_PV_OMBRIERE);
    });

    it("devrait retourner OUI_SOLAIRE_PV_OMBRIERE même avec casse différente", () => {
      const zaer: ZaerEnrichissement = {
        enZoneZaer: true,
        nombreZones: 1,
        filieres: ["SOLAIRE_PV"],
        zones: [
          {
            nom: "Zone solaire",
            filiere: "SOLAIRE_PV",
            detailFiliere: "solaire_pv_nv_ombriere",
          },
        ],
      };
      expect(calculator.evaluer(zaer)).toBe(ZoneAccelerationEnr.OUI_SOLAIRE_PV_OMBRIERE);
    });

    it("devrait retourner OUI_SOLAIRE_PV_OMBRIERE si au moins une zone a PV ombrière parmi plusieurs", () => {
      const zaer: ZaerEnrichissement = {
        enZoneZaer: true,
        nombreZones: 3,
        filieres: ["EOLIEN", "SOLAIRE_PV"],
        zones: [
          { nom: "Zone éolien", filiere: "EOLIEN", detailFiliere: null },
          { nom: "Zone PV toit", filiere: "SOLAIRE_PV", detailFiliere: "SOLAIRE_PV_NV_TOIT" },
          {
            nom: "Zone PV ombrière",
            filiere: "SOLAIRE_PV",
            detailFiliere: "SOLAIRE_PV_NV_OMBRIERE",
          },
        ],
      };
      expect(calculator.evaluer(zaer)).toBe(ZoneAccelerationEnr.OUI_SOLAIRE_PV_OMBRIERE);
    });

    it("devrait retourner OUI pour des zones multiples sans ombrière", () => {
      const zaer: ZaerEnrichissement = {
        enZoneZaer: true,
        nombreZones: 2,
        filieres: ["EOLIEN", "SOLAIRE_PV"],
        zones: [
          { nom: "Zone éolien", filiere: "EOLIEN", detailFiliere: null },
          { nom: "Zone PV toit", filiere: "SOLAIRE_PV", detailFiliere: "SOLAIRE_PV_NV_TOIT" },
        ],
      };
      expect(calculator.evaluer(zaer)).toBe(ZoneAccelerationEnr.OUI);
    });
  });
});
