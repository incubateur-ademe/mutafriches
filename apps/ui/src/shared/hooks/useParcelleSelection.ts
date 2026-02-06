import { useCallback, useMemo, useState } from "react";
import type { Geometry, Feature, Polygon, MultiPolygon } from "geojson";
import booleanIntersects from "@turf/boolean-intersects";
import { feature as turfFeature } from "@turf/helpers";
import type {
  SelectedParcelle,
  PreviewParcelle,
  SelectionState,
} from "../types/parcelle-selection.types";
import { MAX_SITE_AREA_M2 } from "../types/parcelle-selection.types";
import type { ParcelleProperties } from "../services/cadastre/api.cadastre.types";

/**
 * Calcule le centroid approximatif d'une géométrie Polygon ou MultiPolygon.
 * Retourne les coordonnées [lng, lat].
 *
 * Note : on utilise une moyenne simple des coordonnées du premier anneau
 * plutôt que Turf centroid pour rester léger et suffisant pour le positionnement
 * d'un bouton sur la carte.
 */
function computeCentroid(geometry: Geometry): [number, number] {
  let coords: number[][] = [];

  if (geometry.type === "Polygon") {
    coords = (geometry as Polygon).coordinates[0];
  } else if (geometry.type === "MultiPolygon") {
    coords = (geometry as MultiPolygon).coordinates[0][0];
  }

  if (coords.length === 0) {
    return [0, 0];
  }

  let sumLng = 0;
  let sumLat = 0;
  for (const coord of coords) {
    sumLng += coord[0];
    sumLat += coord[1];
  }

  return [sumLng / coords.length, sumLat / coords.length];
}

/**
 * Vérifie si une géométrie est adjacente à au moins une des parcelles déjà sélectionnées.
 *
 * Utilise booleanIntersects de Turf.js qui retourne true si les géométries
 * partagent un bord, un point, ou se chevauchent.
 */
function isAdjacentToSelection(
  geometry: Geometry,
  selectedParcelles: Map<string, SelectedParcelle>,
): boolean {
  if (selectedParcelles.size === 0) {
    return true;
  }

  const candidateFeature = turfFeature(geometry) as Feature<Polygon | MultiPolygon>;

  for (const parcelle of selectedParcelles.values()) {
    const selectedFeature = turfFeature(parcelle.geometry) as Feature<Polygon | MultiPolygon>;
    if (booleanIntersects(candidateFeature, selectedFeature)) {
      return true;
    }
  }

  return false;
}

export interface UseParcelleSelectionReturn {
  /** Parcelles ajoutées au site (Map idu -> données) */
  selectedParcelles: Map<string, SelectedParcelle>;
  /** Parcelle en prévisualisation (cliquée mais pas encore ajoutée) */
  previewParcelle: PreviewParcelle | null;
  /** État courant de la sélection */
  selectionState: SelectionState;
  /** Surface cumulée du site en m² */
  totalArea: number;
  /** Nombre de parcelles ajoutées */
  parcelleCount: number;
  /** Le site peut être analysé (au moins 1 parcelle ajoutée) */
  canAnalyze: boolean;

  /** Traite le clic sur une parcelle (preview, adjacence, déjà ajoutée) */
  handleParcelleClick: (
    idu: string,
    geometry: Geometry,
    properties: ParcelleProperties,
    contenance: number,
  ) => void;
  /** Confirme l'ajout de la parcelle en preview */
  confirmAdd: () => void;
  /** Supprime une parcelle du site */
  removeParcelle: (idu: string) => void;
  /** Efface la prévisualisation (clic dans le vide) */
  clearPreview: () => void;
  /** Réinitialise toute la sélection */
  reset: () => void;
  /** Retourne la liste des identifiants des parcelles sélectionnées */
  getSelectedIdus: () => string[];
}

/**
 * Hook de gestion de la sélection multi-parcelle.
 *
 * Gère les états : idle, previewing, already-added, non-adjacent, max-size.
 * Vérifie l'adjacence via Turf.js et contrôle le seuil de surface (10 ha).
 */
export function useParcelleSelection(): UseParcelleSelectionReturn {
  const [selectedParcelles, setSelectedParcelles] = useState<Map<string, SelectedParcelle>>(
    () => new Map(),
  );
  const [previewParcelle, setPreviewParcelle] = useState<PreviewParcelle | null>(null);
  const [selectionState, setSelectionState] = useState<SelectionState>("idle");

  const totalArea = useMemo(() => {
    let sum = 0;
    for (const parcelle of selectedParcelles.values()) {
      sum += parcelle.contenance;
    }
    return sum;
  }, [selectedParcelles]);

  const parcelleCount = selectedParcelles.size;
  const canAnalyze = parcelleCount > 0;

  const handleParcelleClick = useCallback(
    (idu: string, geometry: Geometry, properties: ParcelleProperties, contenance: number) => {
      // Cas 1 : parcelle déjà ajoutée au site → mode suppression
      if (selectedParcelles.has(idu)) {
        const centroid = computeCentroid(geometry);
        setPreviewParcelle({ idu, geometry, properties, contenance, centroid });
        setSelectionState("already-added");
        return;
      }

      // Cas 2 : vérifier la surface maximale
      if (totalArea + contenance > MAX_SITE_AREA_M2) {
        const centroid = computeCentroid(geometry);
        setPreviewParcelle({ idu, geometry, properties, contenance, centroid });
        setSelectionState("max-size");
        return;
      }

      // Cas 3 : vérifier l'adjacence (seulement si des parcelles sont déjà ajoutées)
      if (selectedParcelles.size > 0 && !isAdjacentToSelection(geometry, selectedParcelles)) {
        const centroid = computeCentroid(geometry);
        setPreviewParcelle({ idu, geometry, properties, contenance, centroid });
        setSelectionState("non-adjacent");
        return;
      }

      // Cas 4 : parcelle valide → afficher la preview avec bouton (+)
      const centroid = computeCentroid(geometry);
      setPreviewParcelle({ idu, geometry, properties, contenance, centroid });
      setSelectionState("previewing");
    },
    [selectedParcelles, totalArea],
  );

  const confirmAdd = useCallback(() => {
    if (!previewParcelle || selectionState !== "previewing") return;

    const { idu, geometry, properties, contenance } = previewParcelle;

    setSelectedParcelles((prev) => {
      const next = new Map(prev);
      next.set(idu, { idu, geometry, properties, contenance });
      return next;
    });

    setPreviewParcelle(null);
    setSelectionState("idle");
  }, [previewParcelle, selectionState]);

  const removeParcelle = useCallback(
    (idu: string) => {
      setSelectedParcelles((prev) => {
        const next = new Map(prev);
        next.delete(idu);
        return next;
      });

      // Si on vient de supprimer la parcelle en preview, nettoyer
      if (previewParcelle?.idu === idu) {
        setPreviewParcelle(null);
      }
      setSelectionState("idle");
    },
    [previewParcelle],
  );

  const clearPreview = useCallback(() => {
    setPreviewParcelle(null);
    setSelectionState("idle");
  }, []);

  const reset = useCallback(() => {
    setSelectedParcelles(new Map());
    setPreviewParcelle(null);
    setSelectionState("idle");
  }, []);

  const getSelectedIdus = useCallback(() => {
    return Array.from(selectedParcelles.keys());
  }, [selectedParcelles]);

  return {
    selectedParcelles,
    previewParcelle,
    selectionState,
    totalArea,
    parcelleCount,
    canAnalyze,
    handleParcelleClick,
    confirmAdd,
    removeParcelle,
    clearPreview,
    reset,
    getSelectedIdus,
  };
}
