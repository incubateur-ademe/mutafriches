import { useState, useEffect, useCallback } from "react";
import {
  MapLayerType,
  MAP_LAYERS,
  DEFAULT_MAP_LAYER,
  MAP_LAYER_STORAGE_KEY,
} from "../config/map-layers.config";

const VALID_LAYERS = new Set<string>([...Object.keys(MAP_LAYERS), "tous"]);

/**
 * Hook pour gérer le fond de carte actif et sa persistance
 */
export function useMapBaseLayers() {
  const [activeLayer, setActiveLayerState] = useState<MapLayerType>(() => {
    try {
      const stored = localStorage.getItem(MAP_LAYER_STORAGE_KEY);
      if (stored && VALID_LAYERS.has(stored)) {
        return stored as MapLayerType;
      }
    } catch (error) {
      console.error("Erreur lors de la lecture du fond de carte depuis localStorage:", error);
    }
    return DEFAULT_MAP_LAYER;
  });

  const setActiveLayer = useCallback((layer: MapLayerType) => {
    setActiveLayerState(layer);
    try {
      localStorage.setItem(MAP_LAYER_STORAGE_KEY, layer);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du fond de carte dans localStorage:", error);
    }
  }, []);

  // Synchroniser avec localStorage si changé dans un autre onglet
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === MAP_LAYER_STORAGE_KEY && event.newValue) {
        if (VALID_LAYERS.has(event.newValue)) {
          setActiveLayerState(event.newValue as MapLayerType);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return {
    activeLayer,
    setActiveLayer,
    availableLayers: MAP_LAYERS,
  };
}
