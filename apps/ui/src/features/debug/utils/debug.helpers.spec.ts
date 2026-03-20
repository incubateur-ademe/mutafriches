import { describe, it, expect } from "vitest";
import {
  formatDistance,
  formatSurface,
  formatBoolean,
  getManualDataLabel,
  getBooleanBadgeClass,
  getRiskBadgeClass,
  getMutabilityColor,
  getMutabilityLabel,
} from "./debug.helpers";

describe("debug.helpers", () => {
  describe("formatDistance", () => {
    it("retourne 'Non disponible' pour null", () => {
      expect(formatDistance(null)).toBe("Non disponible");
    });

    it("retourne 'Non disponible' pour undefined", () => {
      expect(formatDistance(undefined)).toBe("Non disponible");
    });

    it("formate en m\u00E8tres si inferieur \u00E0 1000", () => {
      expect(formatDistance(123)).toBe("123 m");
      expect(formatDistance(0)).toBe("0 m");
      expect(formatDistance(999)).toBe("999 m");
    });

    it("formate en kilom\u00E8tres si sup\u00E9rieur ou \u00E9gal \u00E0 1000", () => {
      expect(formatDistance(1000)).toBe("1 km");
      expect(formatDistance(2500)).toBe("2,5 km");
      expect(formatDistance(15000)).toBe("15 km");
    });

    it("arrondit les m\u00E8tres", () => {
      expect(formatDistance(123.7)).toBe("124 m");
    });
  });

  describe("formatSurface", () => {
    it("retourne 'Non disponible' pour null", () => {
      expect(formatSurface(null)).toBe("Non disponible");
    });

    it("retourne 'Non disponible' pour undefined", () => {
      expect(formatSurface(undefined)).toBe("Non disponible");
    });

    it("formate en m\u00B2 si inferieur \u00E0 10000", () => {
      const result = formatSurface(1234);
      expect(result).toContain("1");
      expect(result).toContain("234");
      expect(result).toContain("m\u00B2");
    });

    it("formate en hectares si sup\u00E9rieur ou \u00E9gal \u00E0 10000", () => {
      const result = formatSurface(15000);
      expect(result).toContain("1,5");
      expect(result).toContain("ha");
    });
  });

  describe("formatBoolean", () => {
    it("retourne 'Non disponible' pour null", () => {
      expect(formatBoolean(null)).toBe("Non disponible");
    });

    it("retourne 'Non disponible' pour undefined", () => {
      expect(formatBoolean(undefined)).toBe("Non disponible");
    });

    it("retourne 'Oui' pour true", () => {
      expect(formatBoolean(true)).toBe("Oui");
    });

    it("retourne 'Non' pour false", () => {
      expect(formatBoolean(false)).toBe("Non");
    });
  });

  describe("getManualDataLabel", () => {
    it("retourne le label fran\u00E7ais pour une cl\u00E9 connue", () => {
      expect(getManualDataLabel("typeProprietaire")).toBe("Type de propri\u00E9taire");
      expect(getManualDataLabel("raccordementEau")).toBe("Raccordement eau");
      expect(getManualDataLabel("presencePollution")).toBe("Pr\u00E9sence de pollution");
    });

    it("retourne la cl\u00E9 telle quelle si inconnue", () => {
      expect(getManualDataLabel("champInconnu")).toBe("champInconnu");
    });
  });

  describe("getBooleanBadgeClass", () => {
    it("retourne info pour null/undefined", () => {
      expect(getBooleanBadgeClass(null)).toBe("fr-badge--info");
      expect(getBooleanBadgeClass(undefined)).toBe("fr-badge--info");
    });

    it("retourne success pour true", () => {
      expect(getBooleanBadgeClass(true)).toBe("fr-badge--success");
    });

    it("retourne warning pour false", () => {
      expect(getBooleanBadgeClass(false)).toBe("fr-badge--warning");
    });
  });

  describe("getRiskBadgeClass", () => {
    it("retourne info pour null/undefined", () => {
      expect(getRiskBadgeClass(null)).toBe("fr-badge--info");
    });

    it("retourne error pour true (risque pr\u00E9sent)", () => {
      expect(getRiskBadgeClass(true)).toBe("fr-badge--error");
    });

    it("retourne success pour false (pas de risque)", () => {
      expect(getRiskBadgeClass(false)).toBe("fr-badge--success");
    });
  });

  describe("getMutabilityColor", () => {
    it("retourne les bonnes couleurs selon le score", () => {
      expect(getMutabilityColor(75)).toBe("#B8FEC9");
      expect(getMutabilityColor(65)).toBe("#C9FCAC");
      expect(getMutabilityColor(50)).toBe("#FEECC2");
      expect(getMutabilityColor(45)).toBe("#FEDED9");
      expect(getMutabilityColor(20)).toBe("#FFBDBE");
    });
  });

  describe("getMutabilityLabel", () => {
    it("retourne les bons labels selon le score", () => {
      expect(getMutabilityLabel(75)).toBe("Excellent");
      expect(getMutabilityLabel(65)).toBe("Tr\u00E8s bon");
      expect(getMutabilityLabel(50)).toBe("Bon");
      expect(getMutabilityLabel(45)).toBe("Moyen");
      expect(getMutabilityLabel(20)).toBe("Faible");
    });
  });
});
