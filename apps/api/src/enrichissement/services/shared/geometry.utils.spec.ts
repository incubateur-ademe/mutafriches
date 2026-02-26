import { describe, it, expect } from "vitest";
import { selectionnerFeatureDominante } from "./geometry.utils";
import { ApiCartoGpuFeature } from "../../adapters/api-carto/gpu/api-carto-gpu.types";
import { ParcelleGeometry } from "./geometry.types";

/**
 * Crée un carré GeoJSON à partir de coordonnées (minX, minY, maxX, maxY)
 * Utile pour fabriquer des géométries de test simples
 */
function creePolygoneCarre(
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
): { type: "Polygon"; coordinates: number[][][] } {
  return {
    type: "Polygon",
    coordinates: [
      [
        [minX, minY],
        [maxX, minY],
        [maxX, maxY],
        [minX, maxY],
        [minX, minY],
      ],
    ],
  };
}

/**
 * Crée une feature API Carto GPU de test
 */
function creeFeature(
  libelle: string,
  typezone: string,
  geometry: { type: string; coordinates: number[] | number[][] | number[][][] },
): ApiCartoGpuFeature {
  return {
    type: "Feature",
    id: `zone_urba.${libelle}`,
    geometry,
    properties: {
      gid: Math.floor(Math.random() * 10000),
      partition: "DU_TEST",
      typezone,
      libelle,
      libelong: `Zone ${libelle}`,
      destdomi: null,
    },
  };
}

describe("selectionnerFeatureDominante", () => {
  describe("Cas trivial : une seule feature", () => {
    it("devrait retourner la seule feature avec index 0", () => {
      // Arrange
      const parcelle: ParcelleGeometry = creePolygoneCarre(0, 0, 1, 1);
      const features = [creeFeature("UA", "U", creePolygoneCarre(0, 0, 2, 2))];

      // Act
      const result = selectionnerFeatureDominante(parcelle, features);

      // Assert
      expect(result.index).toBe(0);
      expect(result.nombreFeatures).toBe(1);
      expect(result.surfaceIntersection).toBeNull();
      expect(result.feature.properties.libelle).toBe("UA");
    });
  });

  describe("Cas Point : retourne la première feature", () => {
    it("devrait retourner la première feature sans calcul d'intersection", () => {
      // Arrange
      const parcelle: ParcelleGeometry = {
        type: "Point",
        coordinates: [0.5, 0.5],
      };
      const features = [
        creeFeature("UA", "U", creePolygoneCarre(0, 0, 1, 1)),
        creeFeature("UB", "U", creePolygoneCarre(0, 0, 2, 2)),
      ];

      // Act
      const result = selectionnerFeatureDominante(parcelle, features);

      // Assert
      expect(result.index).toBe(0);
      expect(result.surfaceIntersection).toBeNull();
      expect(result.nombreFeatures).toBe(2);
    });
  });

  describe("Multi-zones : sélection par surface d'intersection", () => {
    it("devrait sélectionner la zone qui recouvre le plus la parcelle", () => {
      // Arrange
      // Parcelle : carré de 0 à 1 (longitude/latitude)
      const parcelle: ParcelleGeometry = creePolygoneCarre(0, 0, 1, 1);

      // Zone A : recouvre 25% de la parcelle (coin bas-gauche)
      const zoneA = creeFeature("ZA", "U", creePolygoneCarre(-1, -1, 0.5, 0.5));

      // Zone B : recouvre 100% de la parcelle (englobe tout)
      const zoneB = creeFeature("ZB", "AU", creePolygoneCarre(-1, -1, 2, 2));

      // Act
      const result = selectionnerFeatureDominante(parcelle, [zoneA, zoneB]);

      // Assert
      expect(result.index).toBe(1);
      expect(result.feature.properties.libelle).toBe("ZB");
      expect(result.nombreFeatures).toBe(2);
      expect(result.surfaceIntersection).toBeGreaterThan(0);
    });

    it("devrait sélectionner la zone dominante parmi 3 zones", () => {
      // Arrange
      // Parcelle : carré de 0 à 10
      const parcelle: ParcelleGeometry = creePolygoneCarre(0, 0, 10, 10);

      // Zone UA : recouvre le coin gauche (0-3, 0-10) = 30% de la parcelle
      const zoneUA = creeFeature("UA", "U", creePolygoneCarre(-5, -5, 3, 15));

      // Zone UYd2 : recouvre le centre-droite (3-8, 0-10) = 50% de la parcelle
      const zoneUYd2 = creeFeature("UYd2", "U", creePolygoneCarre(3, -5, 8, 15));

      // Zone UC : recouvre le coin droit (8-10, 0-10) = 20% de la parcelle
      const zoneUC = creeFeature("UC", "U", creePolygoneCarre(8, -5, 15, 15));

      // Act
      const result = selectionnerFeatureDominante(parcelle, [zoneUA, zoneUYd2, zoneUC]);

      // Assert - UYd2 devrait être sélectionnée (plus grande intersection)
      expect(result.index).toBe(1);
      expect(result.feature.properties.libelle).toBe("UYd2");
      expect(result.nombreFeatures).toBe(3);
      expect(result.surfaceIntersection).toBeGreaterThan(0);
    });

    it("devrait retourner la première feature si aucune intersection", () => {
      // Arrange
      // Parcelle très éloignée des zones
      const parcelle: ParcelleGeometry = creePolygoneCarre(100, 100, 101, 101);

      const zoneA = creeFeature("ZA", "U", creePolygoneCarre(0, 0, 1, 1));
      const zoneB = creeFeature("ZB", "AU", creePolygoneCarre(2, 2, 3, 3));

      // Act
      const result = selectionnerFeatureDominante(parcelle, [zoneA, zoneB]);

      // Assert - Aucune intersection, retour index 0 par défaut
      expect(result.index).toBe(0);
      expect(result.nombreFeatures).toBe(2);
    });
  });
});
