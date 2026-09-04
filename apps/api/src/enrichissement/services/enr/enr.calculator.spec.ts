import { ZaerEnrichissement, ZoneAccelerationEnr } from "@mutafriches/shared-types";
import { EnrCalculator, estZonageExclusion } from "./enr.calculator";

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
        enZoneExclusion: false,
        nombreZones: 0,
        filieres: [],
        zones: [],
      };
      expect(calculator.evaluer(zaer)).toBe(ZoneAccelerationEnr.NON);
    });

    it("devrait retourner OUI pour une zone ZAER sans PV ombrière", () => {
      const zaer: ZaerEnrichissement = {
        enZoneZaer: true,
        enZoneExclusion: false,
        nombreZones: 1,
        filieres: ["EOLIEN"],
        zones: [{ nom: "Zone éolien", filiere: "EOLIEN", detailFiliere: null, zonage: null }],
      };
      expect(calculator.evaluer(zaer)).toBe(ZoneAccelerationEnr.OUI);
    });

    it("devrait retourner OUI pour une zone PV toit (sans ombrière)", () => {
      const zaer: ZaerEnrichissement = {
        enZoneZaer: true,
        enZoneExclusion: false,
        nombreZones: 1,
        filieres: ["SOLAIRE_PV"],
        zones: [
          {
            nom: "Zone solaire",
            filiere: "SOLAIRE_PV",
            detailFiliere: "SOLAIRE_PV_NV_TOIT",
            zonage: null,
          },
        ],
      };
      expect(calculator.evaluer(zaer)).toBe(ZoneAccelerationEnr.OUI);
    });

    it("devrait retourner OUI_SOLAIRE_PV_OMBRIERE si detailFiliere contient OMBRIERE", () => {
      const zaer: ZaerEnrichissement = {
        enZoneZaer: true,
        enZoneExclusion: false,
        nombreZones: 1,
        filieres: ["SOLAIRE_PV"],
        zones: [
          {
            nom: "Zone solaire ombrière",
            filiere: "SOLAIRE_PV",
            detailFiliere: "SOLAIRE_PV_NV_OMBRIERE",
            zonage: null,
          },
        ],
      };
      expect(calculator.evaluer(zaer)).toBe(ZoneAccelerationEnr.OUI_SOLAIRE_PV_OMBRIERE);
    });

    it("devrait retourner OUI_SOLAIRE_PV_OMBRIERE même avec casse différente", () => {
      const zaer: ZaerEnrichissement = {
        enZoneZaer: true,
        enZoneExclusion: false,
        nombreZones: 1,
        filieres: ["SOLAIRE_PV"],
        zones: [
          {
            nom: "Zone solaire",
            filiere: "SOLAIRE_PV",
            detailFiliere: "solaire_pv_nv_ombriere",
            zonage: null,
          },
        ],
      };
      expect(calculator.evaluer(zaer)).toBe(ZoneAccelerationEnr.OUI_SOLAIRE_PV_OMBRIERE);
    });

    it("devrait retourner OUI_SOLAIRE_PV_OMBRIERE si au moins une zone a PV ombrière parmi plusieurs", () => {
      const zaer: ZaerEnrichissement = {
        enZoneZaer: true,
        enZoneExclusion: false,
        nombreZones: 3,
        filieres: ["EOLIEN", "SOLAIRE_PV"],
        zones: [
          { nom: "Zone éolien", filiere: "EOLIEN", detailFiliere: null, zonage: null },
          {
            nom: "Zone PV toit",
            filiere: "SOLAIRE_PV",
            detailFiliere: "SOLAIRE_PV_NV_TOIT",
            zonage: null,
          },
          {
            nom: "Zone PV ombrière",
            filiere: "SOLAIRE_PV",
            detailFiliere: "SOLAIRE_PV_NV_OMBRIERE",
            zonage: null,
          },
        ],
      };
      expect(calculator.evaluer(zaer)).toBe(ZoneAccelerationEnr.OUI_SOLAIRE_PV_OMBRIERE);
    });

    it("devrait retourner OUI pour des zones multiples sans ombrière", () => {
      const zaer: ZaerEnrichissement = {
        enZoneZaer: true,
        enZoneExclusion: false,
        nombreZones: 2,
        filieres: ["EOLIEN", "SOLAIRE_PV"],
        zones: [
          { nom: "Zone éolien", filiere: "EOLIEN", detailFiliere: null, zonage: null },
          {
            nom: "Zone PV toit",
            filiere: "SOLAIRE_PV",
            detailFiliere: "SOLAIRE_PV_NV_TOIT",
            zonage: null,
          },
        ],
      };
      expect(calculator.evaluer(zaer)).toBe(ZoneAccelerationEnr.OUI);
    });

    it("devrait retourner EXCLUSION en zone d'interdiction APER", () => {
      const zaer: ZaerEnrichissement = {
        enZoneZaer: true,
        enZoneExclusion: true,
        nombreZones: 1,
        filieres: ["SOLAIRE_PV"],
        zones: [
          {
            nom: "Zone interdite",
            filiere: "SOLAIRE_PV",
            detailFiliere: null,
            zonage: "Interdiction ZAER (loi APER) toutes ENR sauf toiture",
          },
        ],
      };
      expect(calculator.evaluer(zaer)).toBe(ZoneAccelerationEnr.EXCLUSION);
    });

    it("devrait faire primer l'exclusion sur une zone d'accélération ombrière", () => {
      const zaer: ZaerEnrichissement = {
        enZoneZaer: true,
        enZoneExclusion: true,
        nombreZones: 2,
        filieres: ["SOLAIRE_PV"],
        zones: [
          {
            nom: "Zone PV ombrière",
            filiere: "SOLAIRE_PV",
            detailFiliere: "SOLAIRE_PV_NV_OMBRIERE",
            zonage: "Zone d'accélération",
          },
          {
            nom: "Zone interdite",
            filiere: "SOLAIRE_PV",
            detailFiliere: null,
            zonage: "Interdiction ZAER (loi APER) toutes ENR sauf toiture",
          },
        ],
      };
      expect(calculator.evaluer(zaer)).toBe(ZoneAccelerationEnr.EXCLUSION);
    });
  });

  describe("estZonageExclusion", () => {
    it("reconnaît le libellé d'interdiction APER", () => {
      expect(estZonageExclusion("Interdiction ZAER (loi APER) toutes ENR sauf toiture")).toBe(true);
    });

    it("est insensible à la casse", () => {
      expect(estZonageExclusion("INTERDICTION ZAER")).toBe(true);
    });

    it("ne reconnaît pas une zone d'accélération", () => {
      expect(estZonageExclusion("Zone d'accélération")).toBe(false);
    });

    it("gère l'absence de zonage", () => {
      expect(estZonageExclusion(null)).toBe(false);
    });
  });
});
