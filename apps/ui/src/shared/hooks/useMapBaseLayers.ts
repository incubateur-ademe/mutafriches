import { useState, useEffect, useCallback } from "react";
import {
  MapLayerType,
  MAP_LAYERS,
  DEFAULT_MAP_LAYER,
  MAP_LAYER_STORAGE_KEY,
} from "../config/map-layers.config";

/**
 * Hook pour gérer le fond de carte actif et sa persistance
 */
export function useMapBaseLayers() {
  // Initialisation depuis localStorage ou valeur par défaut
  const [activeLayer, setActiveLayerState] = useState<MapLayerType>(() => {
    try {
      const stored = localStorage.getItem(MAP_LAYER_STORAGE_KEY);
      if (stored && stored in MAP_LAYERS) {
        return stored as MapLayerType;
      }
    } catch (error) {
      console.error("Erreur lors de la lecture du fond de carte depuis localStorage:", error);
    }
    return DEFAULT_MAP_LAYER;
  });

  // Fonction pour changer le fond de carte avec persistance
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
        const newLayer = event.newValue as MapLayerType;
        if (newLayer in MAP_LAYERS) {
          setActiveLayerState(newLayer);
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
