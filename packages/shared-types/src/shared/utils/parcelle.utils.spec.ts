import { describe, it, expect } from "vitest";
import {
  normalizeParcelId,
  isValidParcelId,
  sanitizeParcelIdForApi,
  padParcelleSection,
} from "./parcelle.utils";

describe("Parcelle ID Validation", () => {
  describe("normalizeParcelId", () => {
    it("should normalize section with leading zero (Aubenas case)", () => {
      // Cas problématique signalé : 070190000B2188 (14 car)
      // Section "0B" → "B"
      const result = normalizeParcelId("070190000B2188");
      expect(result).toBe("07019000B2188");
    });

    it("should NOT normalize section with 2 letters (Doubs case)", () => {
      // Section "HZ" (2 lettres) : pas de normalisation
      // Format correct : 14 caractères
      const result = normalizeParcelId("25056000HZ0346");
      expect(result).toBe("25056000HZ0346");
    });

    it("should normalize DOM parcelle with leading zero", () => {
      // Section "0O" → "O"
      // Format correct : 15 caractères → 14 caractères après normalisation
      const result = normalizeParcelId("9720900000O0498");
      expect(result).toBe("972090000O0498");
    });

    it("should NOT normalize Corse case with 2-letter section", () => {
      // Section "AC" (2 lettres) : pas de normalisation
      // Format correct : 14 caractères
      const result = normalizeParcelId("2A004000AC0045");
      expect(result).toBe("2A004000AC0045");
    });

    it("should NOT normalize Paris parcelle with 2-letter section", () => {
      // Section "DL" (2 lettres) : pas de normalisation
      const result = normalizeParcelId("75113000DL0052");
      expect(result).toBe("75113000DL0052");
    });

    it("should not modify already normalized parcelle", () => {
      const normalized = "07019000B2188";
      const result = normalizeParcelId(normalized);
      expect(result).toBe(normalized);
    });

    it("should not modify parcelle with 2-letter section", () => {
      const result = normalizeParcelId("4218200AB0123");
      expect(result).toBe("4218200AB0123");
    });

    it("should return unchanged if too short", () => {
      const short = "12345";
      const result = normalizeParcelId(short);
      expect(result).toBe(short);
    });

    it("should normalize section 0A to A", () => {
      const result = normalizeParcelId("010200000A1234");
      expect(result).toBe("01020000A1234");
    });

    it("should normalize section 0Z to Z", () => {
      const result = normalizeParcelId("930650000Z9999");
      expect(result).toBe("93065000Z9999");
    });
  });

  describe("isValidParcelId", () => {
    it("should validate Aubenas problematic case (before normalization)", () => {
      expect(isValidParcelId("070190000B2188")).toBe(true);
    });

    it("should validate Aubenas case (after normalization)", () => {
      expect(isValidParcelId("07019000B2188")).toBe(true);
    });

    it("should validate Doubs case", () => {
      expect(isValidParcelId("25056000HZ0346")).toBe(true);
    });

    it("should validate Corse parcelle", () => {
      expect(isValidParcelId("2A004000AC0045")).toBe(true);
    });

    it("should validate DOM parcelle (before normalization)", () => {
      expect(isValidParcelId("9720900000O0498")).toBe(true);
    });

    it("should validate DOM parcelle (after normalization)", () => {
      expect(isValidParcelId("972090000O0498")).toBe(true);
    });

    it("should validate Paris parcelle", () => {
      expect(isValidParcelId("75113000DL0052")).toBe(true);
    });

    it("should accept department 99 (permissive validation)", () => {
      // Note : département 99 n'existe pas en France, mais notre regex permissive l'accepte
      expect(isValidParcelId("99113000DL0052")).toBe(true);
    });

    it("should reject invalid format", () => {
      expect(isValidParcelId("INVALID")).toBe(false);
    });

    it("should reject null or undefined", () => {
      expect(isValidParcelId(null as unknown as string)).toBe(false);
      expect(isValidParcelId(undefined as unknown as string)).toBe(false);
    });

    it("should reject non-string input", () => {
      expect(isValidParcelId(123 as unknown as string)).toBe(false);
    });

    it("should reject too short format", () => {
      expect(isValidParcelId("12345")).toBe(false);
    });

    it("should reject section with numbers only", () => {
      expect(isValidParcelId("070190001234567")).toBe(false);
    });

    it("should reject parcelle with invalid structure", () => {
      // Trop court pour avoir COM_ABS(3) + SECTION(1-2) + PARCELLE(4)
      expect(isValidParcelId("0701900B2188")).toBe(false);
    });
  });

  describe("sanitizeParcelIdForApi", () => {
    it("should sanitize Aubenas problematic case", () => {
      const result = sanitizeParcelIdForApi("070190000B2188");
      expect(result).toBe("07019000B2188");
    });

    it("should return Doubs case unchanged", () => {
      const result = sanitizeParcelIdForApi("25056000HZ0346");
      expect(result).toBe("25056000HZ0346");
    });

    it("should return Paris case unchanged", () => {
      const result = sanitizeParcelIdForApi("75113000DL0052");
      expect(result).toBe("75113000DL0052");
    });

    it("should return null for invalid parcelle", () => {
      const result = sanitizeParcelIdForApi("INVALID");
      expect(result).toBeNull();
    });

    it("should handle already normalized parcelle", () => {
      const normalized = "07019000B2188";
      const result = sanitizeParcelIdForApi(normalized);
      expect(result).toBe(normalized);
    });
  });

  describe("padParcelleSection", () => {
    describe("Métropole - Cas réels problématiques", () => {
      it("should pad Morlaix parcelle with section C", () => {
        // Cas problématique signalé : section à 1 caractère
        const result = padParcelleSection("29151000C2489");
        expect(result).toBe("291510000C2489");
        expect(result.length).toBe(14);
      });

      it("should not modify Morlaix parcelle with section BP (already 2 chars)", () => {
        const result = padParcelleSection("29151000BP0675");
        expect(result).toBe("29151000BP0675");
        expect(result.length).toBe(14);
      });

      it("should pad section A", () => {
        const result = padParcelleSection("01020000A1234");
        expect(result).toBe("010200000A1234");
        expect(result.length).toBe(14);
      });

      it("should pad section Z", () => {
        const result = padParcelleSection("93065000Z9999");
        expect(result).toBe("930650000Z9999");
        expect(result.length).toBe(14);
      });

      it("should not modify section with 2 letters (Doubs case)", () => {
        const result = padParcelleSection("25056000HZ0346");
        expect(result).toBe("25056000HZ0346");
        expect(result.length).toBe(14);
      });

      it("should not modify Paris parcelle with 2-letter section", () => {
        const result = padParcelleSection("75113000DL0052");
        expect(result).toBe("75113000DL0052");
        expect(result.length).toBe(14);
      });
    });

    describe("DOM-TOM", () => {
      it("should pad Martinique parcelle with section O", () => {
        const result = padParcelleSection("972090000O0498");
        expect(result).toBe("9720900000O0498");
        expect(result.length).toBe(15);
      });

      it("should pad Guadeloupe parcelle with section A", () => {
        const result = padParcelleSection("971230000A1234");
        expect(result).toBe("9712300000A1234");
        expect(result.length).toBe(15);
      });

      it("should not modify DOM parcelle with 2-letter section", () => {
        const result = padParcelleSection("971230000AB1234");
        expect(result).toBe("971230000AB1234");
        expect(result.length).toBe(15);
      });
    });

    describe("Corse", () => {
      it("should pad Corse 2A parcelle with section A", () => {
        const result = padParcelleSection("2A004000A0045");
        expect(result).toBe("2A0040000A0045");
        expect(result.length).toBe(14);
      });

      it("should pad Corse 2B parcelle with section B", () => {
        const result = padParcelleSection("2B123000B5678");
        expect(result).toBe("2B1230000B5678");
        expect(result.length).toBe(14);
      });

      it("should not modify Corse parcelle with 2-letter section", () => {
        const result = padParcelleSection("2A004000AC0045");
        expect(result).toBe("2A004000AC0045");
        expect(result.length).toBe(14);
      });
    });

    describe("Edge cases", () => {
      it("should return unchanged if too short", () => {
        const short = "12345";
        const result = padParcelleSection(short);
        expect(result).toBe(short);
      });

      it("should return unchanged if empty", () => {
        const result = padParcelleSection("");
        expect(result).toBe("");
      });

      it("should handle all single letters A-Z", () => {
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
        letters.forEach((letter) => {
          const input = `07019000${letter}2188`;
          const expected = `070190000${letter}2188`;
          expect(padParcelleSection(input)).toBe(expected);
        });
      });

      it("should not pad if section is empty (invalid case)", () => {
        // Cas théorique invalide : pas de section entre COM_ABS et numéro
        const result = padParcelleSection("070190001234");
        expect(result).toBe("070190001234");
      });
    });

    describe("Round-trip with normalizeParcelId", () => {
      it("should be reversible: pad then normalize", () => {
        const original = "29151000C2489";
        const padded = padParcelleSection(original);
        const normalized = normalizeParcelId(padded);

        expect(padded).toBe("291510000C2489");
        expect(normalized).toBe("29151000C2489");
        expect(normalized).toBe(original);
      });

      it("should be idempotent with 2-letter sections", () => {
        const original = "29151000BP0675";
        const padded = padParcelleSection(original);
        const normalized = normalizeParcelId(padded);

        expect(padded).toBe(original);
        expect(normalized).toBe(original);
      });
    });

    describe("Integration avec isValidParcelId", () => {
      it("should produce valid IDU after padding", () => {
        const unpadded = "29151000C2489";
        const padded = padParcelleSection(unpadded);

        expect(isValidParcelId(unpadded)).toBe(true);
        expect(isValidParcelId(padded)).toBe(true);
      });

      it("should validate both forms (padded and unpadded)", () => {
        const testCases = [
          { unpadded: "01020000A1234", padded: "010200000A1234" },
          { unpadded: "972090000O0498", padded: "9720900000O0498" },
          { unpadded: "2A004000A0045", padded: "2A0040000A0045" },
        ];

        testCases.forEach(({ unpadded, padded }) => {
          expect(isValidParcelId(unpadded)).toBe(true);
          expect(isValidParcelId(padded)).toBe(true);
          expect(padParcelleSection(unpadded)).toBe(padded);
        });
      });
    });
  });

  describe("Edge cases", () => {
    it("should handle Corse 2A and 2B departments", () => {
      expect(isValidParcelId("2A004000AC0045")).toBe(true);
      expect(isValidParcelId("2B004000AC0045")).toBe(true);
    });

    it("should handle all DOM departments (971-976)", () => {
      expect(isValidParcelId("9710900000O0498")).toBe(true);
      expect(isValidParcelId("9720900000O0498")).toBe(true);
      expect(isValidParcelId("9730900000O0498")).toBe(true);
      expect(isValidParcelId("9740900000O0498")).toBe(true);
      expect(isValidParcelId("9750900000O0498")).toBe(true);
      expect(isValidParcelId("9760900000O0498")).toBe(true);
    });

    it("should handle single and double letter sections", () => {
      expect(isValidParcelId("070190000B2188")).toBe(true); // Section 1 lettre avec 0
      expect(isValidParcelId("07019000AB2188")).toBe(true); // Section 2 lettres
    });

    it("should reject lowercase letters in section", () => {
      expect(isValidParcelId("070190000b2188")).toBe(false);
    });

    it("should handle section with leading zero", () => {
      expect(isValidParcelId("010200000B1234")).toBe(true);
      expect(normalizeParcelId("010200000B1234")).toBe("01020000B1234");
    });

    it("should handle section without leading zero (1 letter)", () => {
      expect(isValidParcelId("07019000B2188")).toBe(true);
      expect(normalizeParcelId("07019000B2188")).toBe("07019000B2188");
    });

    it("should handle all single letters A-Z with leading zero", () => {
      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
      letters.forEach((letter) => {
        const withZero = `07019000${letter}2188`;
        const expected = `07019000${letter}2188`;
        expect(normalizeParcelId(withZero)).toBe(expected);
        expect(isValidParcelId(withZero)).toBe(true);
      });
    });

    it("should handle all single letters A-Z with 0-prefix normalization", () => {
      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
      letters.forEach((letter) => {
        const withZeroPrefix = `070190000${letter}2188`;
        const expected = `07019000${letter}2188`;
        expect(normalizeParcelId(withZeroPrefix)).toBe(expected);
        expect(isValidParcelId(withZeroPrefix)).toBe(true);
      });
    });
  });
});
