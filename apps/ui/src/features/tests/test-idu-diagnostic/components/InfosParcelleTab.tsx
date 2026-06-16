import { useEffect, useId, useMemo, useState } from "react";
import centroid from "@turf/centroid";
import type { Geometry } from "geojson";
import { normalizeParcelId, padParcelleSection } from "@mutafriches/shared-types";
import { extractIdu } from "@shared/utils/geo.utils";
import { useLeafletMap } from "@shared/hooks/useLeafletMap";
import { MapLayerType } from "@shared/config/map-layers.config";
import { searchParcelWithFallback } from "@shared/services/cadastre/api.cadastre.service";
import type { ParcelleProperties } from "@shared/services/cadastre/api.cadastre.types";
import { MapLayerSelector } from "@features/analyser/components/parcelle-map/MapLayerSelector";
import "@features/analyser/components/parcelle-map/MapLayerSelector.css";
import { AddressSearchBar } from "@features/analyser/components/parcelle-map/AddressSearchBar";
import { ParcelleInfoPanel, ParcelleInfo } from "./ParcelleInfoPanel";

function toInfo(geometry: Geometry, props: ParcelleProperties): ParcelleInfo {
  const idu = padParcelleSection(normalizeParcelId(extractIdu(props)));
  const c = centroid({ type: "Feature", geometry, properties: {} }).geometry.coordinates;
  return {
    idu,
    commune: props.nom_com ?? props.commune,
    section: props.section,
    numero: props.numero,
    contenance: props.contenance,
    coords: [c[0], c[1]],
  };
}

export function InfosParcelleTab() {
  const reactId = useId();
  const containerId = useMemo(() => `infos-parcelle-map-${reactId.replace(/:/g, "")}`, [reactId]);

  const [activeLayer, setActiveLayer] = useState<MapLayerType>("tous");
  const [info, setInfo] = useState<ParcelleInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [introuvable, setIntrouvable] = useState(false);

  const { mapRef, flyToLocation, changeBaseLayer } = useLeafletMap({
    containerId,
    initialZoom: 18,
    baseLayer: activeLayer,
    onParcelleClick: (_idu, geometry, properties, contenance) => {
      setIntrouvable(false);
      setInfo(toInfo(geometry, { ...properties, contenance }));
    },
    onEmptyClick: () => {
      setInfo(null);
      setIntrouvable(true);
    },
  });

  useEffect(() => {
    changeBaseLayer(activeLayer);
  }, [activeLayer, changeBaseLayer]);

  // La carte est montée cachée dans l'onglet : on recalcule sa taille quand il devient visible
  useEffect(() => {
    const el = document.getElementById(containerId);
    if (!el) return;
    const observer = new IntersectionObserver(() => mapRef.current?.invalidateSize());
    observer.observe(el);
    return () => observer.disconnect();
  }, [containerId, mapRef]);

  const handleAddress = async (lat: number, lng: number) => {
    flyToLocation(lat, lng, 19);
    setLoading(true);
    setIntrouvable(false);
    setInfo(null);
    const fc = await searchParcelWithFallback(lng, lat);
    setLoading(false);
    const feature = fc?.features?.[0];
    if (feature) setInfo(toInfo(feature.geometry, feature.properties));
    else setIntrouvable(true);
  };

  return (
    <div className="fr-grid-row fr-grid-row--gutters">
      <div className="fr-col-12 fr-col-md-8">
        <div className="fr-mb-2w">
          <AddressSearchBar onAddressSelected={handleAddress} />
        </div>
        <div className="fr-mb-2w">
          <MapLayerSelector activeLayer={activeLayer} onLayerChange={setActiveLayer} />
        </div>
        {/* Leaflet impose une hauteur explicite sur le conteneur */}
        <div
          id={containerId}
          style={{
            height: "520px",
            width: "100%",
            border: "1px solid var(--border-default-grey)",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        />
      </div>
      <div className="fr-col-12 fr-col-md-4">
        <ParcelleInfoPanel info={info} loading={loading} introuvable={introuvable} />
      </div>
    </div>
  );
}
