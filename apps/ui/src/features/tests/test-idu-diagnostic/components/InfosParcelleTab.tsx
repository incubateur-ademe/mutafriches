import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Geometry } from "geojson";
import { useLeafletMap } from "@shared/hooks/useLeafletMap";
import { useMapBaseLayers } from "@shared/hooks/useMapBaseLayers";
import { useParcelleSelection } from "@shared/hooks/useParcelleSelection";
import { useMapParcelleRenderer } from "@shared/hooks/useMapParcelleRenderer";
import type { SelectedParcelle } from "@shared/types/parcelle-selection.types";
import { MapLayerSelector } from "@features/analyser/components/parcelle-map/MapLayerSelector";
import { AddressSearchBar } from "@features/analyser/components/parcelle-map/AddressSearchBar";
import "@features/analyser/components/parcelle-map/MapLayerSelector.css";
import "@features/analyser/components/parcelle-map/ParcelleActions.css";
import { ParcelleInfoCard, ParcelleInfo } from "./ParcelleInfoPanel";

// Centre par défaut stable (référence constante : sinon useLeafletMap recrée la carte à chaque rendu)
const DEFAULT_CENTER: [number, number] = [47.4456, -0.4721]; // Trélazé

// Centroïde approché (moyenne des sommets de l'anneau extérieur) pour le lien Géoportail.
function centroidOf(geom: Geometry): [number, number] {
  let ring: number[][] = [];
  if (geom.type === "Polygon") ring = geom.coordinates[0];
  else if (geom.type === "MultiPolygon") ring = geom.coordinates[0]?.[0] ?? [];
  if (ring.length === 0) return [0, 0];
  let x = 0;
  let y = 0;
  for (const p of ring) {
    x += p[0];
    y += p[1];
  }
  return [x / ring.length, y / ring.length];
}

// Adresse BAN la plus proche d'un point [lon, lat].
async function reverseAdresse([lon, lat]: [number, number]): Promise<string | undefined> {
  try {
    const res = await fetch(`https://api-adresse.data.gouv.fr/reverse/?lon=${lon}&lat=${lat}`);
    if (!res.ok) return undefined;
    const data = (await res.json()) as { features?: { properties?: { label?: string } }[] };
    return data.features?.[0]?.properties?.label;
  } catch {
    return undefined;
  }
}

function toInfo(p: SelectedParcelle): ParcelleInfo {
  return {
    idu: p.idu,
    commune: p.properties.nom_com ?? p.properties.commune,
    section: p.properties.section,
    numero: p.properties.numero,
    contenance: p.contenance,
    coords: centroidOf(p.geometry),
  };
}

// Contenu réel : la carte Leaflet n'est montée que lorsque l'onglet est visible (cf. wrapper).
function InfosParcelleContent() {
  const reactId = useId();
  const containerId = useMemo(() => `infos-parcelle-map-${reactId.replace(/:/g, "")}`, [reactId]);

  const { activeLayer, setActiveLayer } = useMapBaseLayers();
  // IDU dont les infos sont affichées : si la sélection change, les infos se masquent d'elles-mêmes
  const [iduInfos, setIduInfos] = useState<string | null>(null);
  // Adresse résolue (BAN), associée à un IDU pour éviter les courses entre deux résolutions
  const [adresseInfo, setAdresseInfo] = useState<{ idu: string; label: string } | null>(null);

  // Reprise de la logique de la page analyser, en mode parcelle unique
  const {
    selectedParcelles,
    previewParcelle,
    selectionState,
    parcelleCount,
    handleParcelleClick,
    confirmAdd,
    removeParcelle,
    clearPreview,
  } = useParcelleSelection({ singleSelection: true });

  const { flyToLocation, changeBaseLayer, mapRef } = useLeafletMap({
    containerId,
    initialCenter: DEFAULT_CENTER,
    initialZoom: 17,
    baseLayer: activeLayer,
    onParcelleClick: handleParcelleClick,
    onEmptyClick: clearPreview,
  });

  useMapParcelleRenderer({
    mapRef,
    selectedParcelles,
    previewParcelle,
    selectionState,
    onConfirmAdd: confirmAdd,
    onRemoveParcelle: removeParcelle,
  });

  // Recalcule la taille de la carte si l'onglet redevient visible après avoir été masqué
  useEffect(() => {
    const el = document.getElementById(containerId);
    if (!el) return;
    const observer = new IntersectionObserver(() => mapRef.current?.invalidateSize());
    observer.observe(el);
    return () => observer.disconnect();
  }, [containerId, mapRef]);

  const handleLayerChange = (layer: typeof activeLayer) => {
    setActiveLayer(layer);
    changeBaseLayer(layer);
  };

  const selected = parcelleCount > 0 ? Array.from(selectedParcelles.values())[0] : null;

  // Affiche les infos de la parcelle et résout son adresse (BAN)
  const afficherInfos = (p: SelectedParcelle) => {
    setIduInfos(p.idu);
    setAdresseInfo(null);
    void reverseAdresse(centroidOf(p.geometry)).then((label) => {
      if (label) setAdresseInfo({ idu: p.idu, label });
    });
  };

  const adresse = selected && adresseInfo?.idu === selected.idu ? adresseInfo.label : undefined;

  return (
    <div className="fr-grid-row fr-grid-row--gutters">
      <div className="fr-col-12 fr-col-md-8">
        <div className="fr-mb-2w">
          <AddressSearchBar onAddressSelected={(lat, lng) => flyToLocation(lat, lng, 18)} />
        </div>
        <div className="fr-mb-2w">
          <MapLayerSelector activeLayer={activeLayer} onLayerChange={handleLayerChange} />
        </div>

        {/* Carte + bouton d'action en overlay (façon page analyser) */}
        <div
          style={{
            position: "relative",
            height: "520px",
            width: "100%",
            border: "1px solid var(--border-default-grey)",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          {/* Leaflet impose une hauteur explicite sur le conteneur */}
          <div id={containerId} style={{ height: "100%", width: "100%" }} />

          {selected && (
            <div
              style={{
                position: "absolute",
                bottom: 12,
                right: 12,
                zIndex: 1000,
                background: "rgba(255, 255, 255, 0.9)",
                borderRadius: "0.5rem",
                padding: "0.5rem",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
              }}
            >
              <button
                type="button"
                className="fr-btn"
                style={{ margin: 0 }}
                onClick={() => afficherInfos(selected)}
              >
                Diagnostic parcelle
              </button>
            </div>
          )}
        </div>

        <p className="fr-hint-text fr-mt-1w">
          Cliquez une parcelle (ou recherchez une adresse), validez avec ⊕, puis « Diagnostic
          parcelle ».
        </p>
      </div>

      <div className="fr-col-12 fr-col-md-4">
        {selected && iduInfos === selected.idu ? (
          <ParcelleInfoCard info={{ ...toInfo(selected), adresse }} />
        ) : (
          <div className="fr-callout">
            <p className="fr-callout__text">
              {selected
                ? "Cliquez « Diagnostic parcelle » pour afficher les informations."
                : "Cliquez une parcelle ou recherchez une adresse pour la sélectionner."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Wrapper : monte le contenu (et la carte Leaflet) seulement quand l'onglet devient visible,
// pour que la carte s'initialise avec une taille correcte (DsfrTabs garde les panneaux montés mais
// masqués via l'attribut hidden).
export function InfosParcelleTab() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) setVisible(true);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapperRef} style={{ minHeight: "560px" }}>
      {visible && <InfosParcelleContent />}
    </div>
  );
}
