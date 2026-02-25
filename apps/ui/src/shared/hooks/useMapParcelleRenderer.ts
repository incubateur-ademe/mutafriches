import type { RefObject } from "react";
import { useEffect, useRef } from "react";
import L from "leaflet";
import type {
  SelectedParcelle,
  PreviewParcelle,
  SelectionState,
} from "../types/parcelle-selection.types";

/** Styles visuels des parcelles sur la carte */
const STYLES = {
  /** Parcelle ajoutée au site : fond bleu foncé, contour bleu clair */
  selected: {
    color: "#6A6AF4",
    weight: 3,
    fillColor: "#000091",
    fillOpacity: 0.75,
  },
  /** Parcelle en preview (peut être ajoutée) : bleu léger */
  preview: {
    color: "#3388ff",
    weight: 3,
    fillColor: "#3388ff",
    fillOpacity: 0.15,
  },
  /** Parcelle non adjacente ou déjà ajoutée en mode suppression : contour rouge */
  error: {
    color: "#e1000f",
    weight: 3,
    fillColor: "#e1000f",
    fillOpacity: 0.1,
  },
} as const;

/**
 * Crée un bouton d'action (+) ou (poubelle) positionné aux coordonnées du clic.
 * Utilise un DivIcon Leaflet pour afficher un bouton HTML interactif.
 */
function createActionMarker(
  coords: [number, number],
  type: "add" | "remove",
  onClick: () => void,
): L.Marker {
  const iconHtml =
    type === "add"
      ? '<button class="parcelle-action-btn parcelle-action-btn--add" title="Ajouter la parcelle"><span class="fr-icon-add-circle-line" aria-hidden="true"></span></button>'
      : '<button class="parcelle-action-btn parcelle-action-btn--remove" title="Supprimer la parcelle"><span class="fr-icon-delete-line" aria-hidden="true"></span></button>';

  const icon = L.divIcon({
    html: iconHtml,
    className: "parcelle-action-marker",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

  // Coordonnées [lat, lng] pour Leaflet (l'inverse du [lng, lat] reçu)
  const marker = L.marker([coords[1], coords[0]], { icon, interactive: true });

  marker.on("click", (e: L.LeafletMouseEvent) => {
    L.DomEvent.stopPropagation(e);
    onClick();
  });

  return marker;
}

interface UseMapParcelleRendererProps {
  mapRef: RefObject<L.Map | null>;
  selectedParcelles: Map<string, SelectedParcelle>;
  previewParcelle: PreviewParcelle | null;
  selectionState: SelectionState;
  onConfirmAdd: () => void;
  onRemoveParcelle: (idu: string) => void;
}

/**
 * Hook qui synchronise l'état de sélection des parcelles avec les layers Leaflet.
 *
 * Gère 3 types de rendu :
 * - Parcelles sélectionnées (bleu foncé rempli)
 * - Parcelle en preview avec bouton (+) (bleu léger)
 * - Parcelle en erreur/suppression avec bouton poubelle (contour rouge)
 */
export function useMapParcelleRenderer({
  mapRef,
  selectedParcelles,
  previewParcelle,
  selectionState,
  onConfirmAdd,
  onRemoveParcelle,
}: UseMapParcelleRendererProps): void {
  // LayerGroup dédié aux parcelles sélectionnées (persistant)
  const selectedLayerGroupRef = useRef<L.LayerGroup | null>(null);
  // LayerGroup dédié à la preview (temporaire, nettoyé à chaque changement)
  const previewLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialiser les LayerGroups une fois la carte prête
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Petit délai pour s'assurer que la carte est initialisée
    const timer = setTimeout(() => {
      if (!selectedLayerGroupRef.current) {
        selectedLayerGroupRef.current = L.layerGroup().addTo(map);
      }
      if (!previewLayerGroupRef.current) {
        previewLayerGroupRef.current = L.layerGroup().addTo(map);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [mapRef]);

  // Synchroniser les parcelles sélectionnées
  useEffect(() => {
    const layerGroup = selectedLayerGroupRef.current;
    if (!layerGroup) return;

    layerGroup.clearLayers();

    selectedParcelles.forEach((parcelle) => {
      const geoJsonLayer = L.geoJSON(parcelle.geometry, { style: STYLES.selected });
      layerGroup.addLayer(geoJsonLayer);
    });
  }, [selectedParcelles]);

  // Synchroniser la preview et le bouton d'action
  useEffect(() => {
    const layerGroup = previewLayerGroupRef.current;
    if (!layerGroup) return;

    layerGroup.clearLayers();

    if (!previewParcelle) return;

    // Choisir le style selon l'état
    const isError =
      selectionState === "non-adjacent" ||
      selectionState === "max-size" ||
      selectionState === "already-added";
    const style = isError ? STYLES.error : STYLES.preview;

    const geoJsonLayer = L.geoJSON(previewParcelle.geometry, { style });
    layerGroup.addLayer(geoJsonLayer);

    // Ajouter le bouton d'action au centroid
    if (selectionState === "previewing") {
      const marker = createActionMarker(previewParcelle.clickCoords, "add", onConfirmAdd);
      layerGroup.addLayer(marker);
    } else if (selectionState === "already-added") {
      const idu = previewParcelle.idu;
      const marker = createActionMarker(previewParcelle.clickCoords, "remove", () => {
        onRemoveParcelle(idu);
      });
      layerGroup.addLayer(marker);
    }
  }, [previewParcelle, selectionState, onConfirmAdd, onRemoveParcelle]);
}
