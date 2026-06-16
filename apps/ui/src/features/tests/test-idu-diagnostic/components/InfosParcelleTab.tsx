import { useEffect, useId, useMemo, useRef, useState } from "react";
import L from "leaflet";
import type { Geometry, GeoJsonObject } from "geojson";
import { normalizeParcelId, padParcelleSection } from "@mutafriches/shared-types";
import { extractIdu } from "@shared/utils/geo.utils";
import { useLeafletMap } from "@shared/hooks/useLeafletMap";
import { MapLayerType } from "@shared/config/map-layers.config";
import { searchParcelWithFallback } from "@shared/services/cadastre/api.cadastre.service";
import type { SelectedParcelle } from "@shared/types/parcelle-selection.types";
import { MapLayerSelector } from "@features/analyser/components/parcelle-map/MapLayerSelector";
import "@features/analyser/components/parcelle-map/MapLayerSelector.css";
import { AddressSearchBar } from "@features/analyser/components/parcelle-map/AddressSearchBar";
import { ParcelleInfoCard, ParcelleInfo } from "./ParcelleInfoPanel";

// Sélection bleue, cohérente avec la page analyser
const SELECTED_STYLE: L.PathOptions = {
  color: "#000091",
  weight: 2,
  fillColor: "#000091",
  fillOpacity: 0.5,
};

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

  const [activeLayer, setActiveLayer] = useState<MapLayerType>("tous");
  const [selected, setSelected] = useState<SelectedParcelle | null>(null);
  const [infosAffichees, setInfosAffichees] = useState(false);
  const [loading, setLoading] = useState(false);
  const [introuvable, setIntrouvable] = useState(false);
  const highlightRef = useRef<L.LayerGroup | null>(null);

  // Nouvelle sélection : on remplace la précédente et on masque les infos jusqu'au clic du bouton
  const selectionner = (p: SelectedParcelle) => {
    setIntrouvable(false);
    setInfosAffichees(false);
    setSelected(p);
  };

  const { mapRef, flyToLocation, changeBaseLayer } = useLeafletMap({
    containerId,
    initialZoom: 18,
    baseLayer: activeLayer,
    onParcelleClick: (idu, geometry, properties, contenance) =>
      selectionner({ idu, geometry, properties, contenance }),
    onEmptyClick: () => {
      setSelected(null);
      setInfosAffichees(false);
    },
  });

  useEffect(() => {
    changeBaseLayer(activeLayer);
  }, [activeLayer, changeBaseLayer]);

  // Recalcule la taille de la carte si l'onglet redevient visible après avoir été masqué
  useEffect(() => {
    const el = document.getElementById(containerId);
    if (!el) return;
    const observer = new IntersectionObserver(() => mapRef.current?.invalidateSize());
    observer.observe(el);
    return () => observer.disconnect();
  }, [containerId, mapRef]);

  // Surbrillance de la parcelle sélectionnée
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!highlightRef.current) highlightRef.current = L.layerGroup().addTo(map);
    const group = highlightRef.current;
    group.clearLayers();
    if (selected) {
      L.geoJSON(selected.geometry as GeoJsonObject, { style: () => SELECTED_STYLE }).addTo(group);
    }
  }, [selected, mapRef]);

  const handleAddress = async (lat: number, lng: number) => {
    flyToLocation(lat, lng, 19);
    setLoading(true);
    setIntrouvable(false);
    setInfosAffichees(false);
    setSelected(null);
    const fc = await searchParcelWithFallback(lng, lat);
    setLoading(false);
    const feature = fc?.features?.[0];
    if (feature) {
      const idu = padParcelleSection(normalizeParcelId(extractIdu(feature.properties)));
      selectionner({
        idu,
        geometry: feature.geometry,
        properties: feature.properties,
        contenance: feature.properties.contenance ?? 0,
      });
    } else {
      setIntrouvable(true);
    }
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

        {/* Carte + bouton d'action en overlay (style proche de la page analyser) */}
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
                onClick={() => setInfosAffichees(true)}
              >
                Diagnostic parcelle
              </button>
            </div>
          )}
        </div>

        <p className="fr-hint-text fr-mt-1w">
          Cliquez une parcelle (ou recherchez une adresse), puis « Diagnostic parcelle ».
        </p>
      </div>

      <div className="fr-col-12 fr-col-md-4">
        {loading && (
          <div className="fr-callout">
            <p className="fr-callout__text">Recherche de la parcelle…</p>
          </div>
        )}
        {introuvable && (
          <div className="fr-callout fr-callout--brown-cafe">
            <p className="fr-callout__text">Aucune parcelle trouvée à cet emplacement.</p>
          </div>
        )}
        {!loading && !introuvable && infosAffichees && selected && (
          <ParcelleInfoCard info={toInfo(selected)} />
        )}
        {!loading && !introuvable && !(infosAffichees && selected) && (
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
