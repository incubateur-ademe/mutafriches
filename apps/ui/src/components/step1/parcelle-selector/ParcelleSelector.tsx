// src/components/ParcelleSelector/ParcelleSelector.tsx

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./ParcelleSelector.css";
import type { ParcelleSelectorProps, ParcelleFeature } from "./types";

// Configuration Leaflet icons (fix pour les markers)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const ParcelleSelector: React.FC<ParcelleSelectorProps> = ({
  onParcelleSelect,
  center = [47.2383, 6.0241], // Besançon par défaut (comme dans l'exemple)
  zoom = 17,
  height = "500px",
  className = "",
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const parcelleLayerRef = useRef<L.GeoJSON | null>(null);
  const clickMarkerRef = useRef<L.Marker | null>(null);

  const [loading, setLoading] = useState(false);
  const [selectedParcelle, setSelectedParcelle] = useState<ParcelleFeature | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialiser la carte
    const map = L.map(containerRef.current).setView(center, zoom);
    mapRef.current = map;

    // Ajouter le fond de carte OpenStreetMap (comme dans l'exemple)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 20,
    }).addTo(map);

    // Alternative : Plan IGN v2 (décommenter si vous préférez)
    // L.tileLayer('https://data.geopf.fr/wmts?' +
    //   'SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&' +
    //   'LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&STYLE=normal&' +
    //   'TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&' +
    //   'FORMAT=image/png', {
    //   attribution: '© IGN',
    //   maxZoom: 18,
    // }).addTo(map);

    // Fonction pour traiter le résultat
    const processParcelleResult = (parcelle: ParcelleFeature) => {
      console.log("Parcelle trouvée:", parcelle);
      setSelectedParcelle(parcelle);

      // Retirer le marqueur de clic
      if (clickMarkerRef.current && mapRef.current) {
        mapRef.current.removeLayer(clickMarkerRef.current);
        clickMarkerRef.current = null;
      }

      // Afficher la parcelle sur la carte
      if (mapRef.current) {
        parcelleLayerRef.current = L.geoJSON(parcelle as any, {
          style: {
            color: "#4CAF50",
            weight: 3,
            opacity: 0.8,
            fillColor: "#8BC34A",
            fillOpacity: 0.3,
          },
        }).addTo(mapRef.current);

        // Centrer sur la parcelle
        const bounds = parcelleLayerRef.current.getBounds();
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }

      // Extraire l'identifiant
      const parcelleId =
        parcelle.properties?.idu ||
        parcelle.properties?.id ||
        parcelle.id ||
        `${parcelle.properties?.code_dep || ""}${parcelle.properties?.code_com || ""}${parcelle.properties?.section || ""}${parcelle.properties?.numero || ""}`;

      // Appeler le callback
      if (parcelleId) {
        onParcelleSelect(parcelleId, parcelle);
      }
    };

    // Gestionnaire de clic sur la carte
    const handleMapClick = async (e: L.LeafletMouseEvent) => {
      console.log("=== Clic sur la carte ===");
      console.log("Coordonnées:", { lat: e.latlng.lat, lng: e.latlng.lng });

      setLoading(true);
      setError(null);
      setSelectedParcelle(null);

      // Nettoyer les couches précédentes
      if (parcelleLayerRef.current) {
        map.removeLayer(parcelleLayerRef.current);
        parcelleLayerRef.current = null;
      }
      if (clickMarkerRef.current) {
        map.removeLayer(clickMarkerRef.current);
        clickMarkerRef.current = null;
      }

      // Ajouter un marqueur au point cliqué
      clickMarkerRef.current = L.marker(e.latlng, {
        icon: L.divIcon({
          className: "click-marker",
          html: '<div style="width: 10px; height: 10px; background: red; border-radius: 50%; border: 2px solid white;"></div>',
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        }),
      }).addTo(map);

      try {
        // Utiliser CONTAINS au lieu de BBOX pour une recherche plus précise
        // On crée un point WKT pour la requête
        const pointWKT = `POINT(${e.latlng.lng} ${e.latlng.lat})`;

        // Essayer différents layers de parcelles
        const layers = [
          "CADASTRALPARCELS.PARCELLAIRE_EXPRESS:parcelle",
          "BDPARCELLAIRE-VECTEUR_WLD_BDD_WGS84G:parcelle",
        ];

        let parcelleFound = false;

        for (const layer of layers) {
          if (parcelleFound) break;

          console.log(`Essai avec layer: ${layer}`);

          // D'abord essayer avec une bbox très petite pour forcer la recherche
          const buffer = 0.00001; // ~1m

          // IMPORTANT : Pour CRS:84, l'ordre est longitude, latitude !
          const bbox = [
            e.latlng.lng - buffer, // min longitude
            e.latlng.lat - buffer, // min latitude
            e.latlng.lng + buffer, // max longitude
            e.latlng.lat + buffer, // max latitude
          ];

          // Requête WFS avec bbox
          const baseUrl = "https://data.geopf.fr/wfs/ows";
          const params = new URLSearchParams({
            service: "WFS",
            version: "2.0.0",
            request: "GetFeature",
            typeName: layer,
            outputFormat: "application/json",
            bbox: bbox.join(","),
            srsName: "EPSG:4326", // Revenir à EPSG:4326 qui fonctionne mieux
            count: "50", // Récupérer plus de résultats
          });

          const url = `${baseUrl}?${params.toString()}`;
          console.log("URL:", url);

          try {
            const response = await fetch(url);

            if (!response.ok) {
              console.error(`Erreur HTTP ${response.status} pour ${layer}`);
              continue;
            }

            const data = await response.json();
            console.log(`Résultat pour ${layer}:`, data);

            if (data.features && data.features.length > 0) {
              // Si on a plusieurs parcelles, prendre la plus proche du clic
              let closestParcelle = data.features[0];
              let minDistance = Infinity;

              if (data.features.length > 1) {
                for (const feature of data.features) {
                  if (feature.geometry && feature.geometry.coordinates) {
                    // Calculer le centroïde approximatif
                    const coords =
                      feature.geometry.type === "MultiPolygon"
                        ? feature.geometry.coordinates[0][0]
                        : feature.geometry.coordinates[0];

                    if (coords && coords.length > 0) {
                      let sumLng = 0,
                        sumLat = 0;
                      for (const coord of coords) {
                        sumLng += coord[0];
                        sumLat += coord[1];
                      }
                      const centerLng = sumLng / coords.length;
                      const centerLat = sumLat / coords.length;

                      const distance = Math.sqrt(
                        Math.pow(centerLng - e.latlng.lng, 2) +
                          Math.pow(centerLat - e.latlng.lat, 2),
                      );

                      if (distance < minDistance) {
                        minDistance = distance;
                        closestParcelle = feature;
                      }
                    }
                  }
                }
                console.log("Parcelle la plus proche sélectionnée parmi", data.features.length);
              }

              processParcelleResult(closestParcelle as ParcelleFeature);
              parcelleFound = true;
              break;
            }
          } catch (fetchErr) {
            console.error(`Erreur fetch pour ${layer}:`, fetchErr);
          }
        }

        // Si toujours pas trouvé, essayer avec des buffers plus grands
        if (!parcelleFound) {
          const buffers = [0.0001, 0.0002, 0.0005]; // ~10m, 20m, 50m

          for (const buffer of buffers) {
            if (parcelleFound) break;

            const bbox = [
              e.latlng.lng - buffer,
              e.latlng.lat - buffer,
              e.latlng.lng + buffer,
              e.latlng.lat + buffer,
            ];

            console.log(`Tentative avec buffer ${buffer} (~${Math.round(buffer * 111000)}m)`);

            const baseUrl = "https://data.geopf.fr/wfs/ows";
            const params = new URLSearchParams({
              service: "WFS",
              version: "2.0.0",
              request: "GetFeature",
              typeName: "CADASTRALPARCELS.PARCELLAIRE_EXPRESS:parcelle",
              outputFormat: "application/json",
              bbox: bbox.join(","),
              srsName: "EPSG:4326", // Utiliser EPSG:4326
              count: "10",
            });

            const url = `${baseUrl}?${params.toString()}`;

            try {
              const response = await fetch(url);
              if (response.ok) {
                const data = await response.json();
                if (data.features && data.features.length > 0) {
                  console.log(`Parcelle trouvée avec buffer ${buffer}`);
                  processParcelleResult(data.features[0] as ParcelleFeature);
                  parcelleFound = true;
                  break;
                }
              }
            } catch (err) {
              console.error(`Erreur avec buffer ${buffer}:`, err);
            }
          }
        }

        if (!parcelleFound) {
          console.log("Aucune parcelle trouvée");
          setError(
            "Aucune parcelle trouvée. Essayez de zoomer davantage et de cliquer directement sur un bâtiment.",
          );
        }
      } catch (err) {
        console.error("Erreur lors de la récupération:", err);
        setError("Erreur lors de la récupération de la parcelle");
      } finally {
        setLoading(false);
      }
    };

    // Fonction de test avec l'API gouvernementale cadastre.data.gouv.fr
    const loadTestParcelle = async () => {
      console.log("=== Test avec API cadastre.data.gouv.fr ===");
      setLoading(true);
      setError(null);

      try {
        // Utiliser l'API cadastre.data.gouv.fr qui fonctionne vraiment
        // Test avec une parcelle connue à Paris (plus de chances d'avoir des données)
        const testLat = 48.8566;
        const testLng = 2.3522;

        // API du cadastre gouvernemental
        const url = `https://api-cadastre.data.gouv.fr/parcelle?lat=${testLat}&lon=${testLng}`;

        console.log("Appel API cadastre.data.gouv.fr:", url);

        const response = await fetch(url);

        if (!response.ok) {
          console.error("Erreur API cadastre:", response.status);

          // Alternative : essayer avec apicarto
          const apicartoUrl = `https://apicarto.ign.fr/api/cadastre/parcelle?geom={"type":"Point","coordinates":[${testLng},${testLat}]}`;
          console.log("Essai avec apicarto:", apicartoUrl);

          const response2 = await fetch(apicartoUrl);
          if (response2.ok) {
            const data2 = await response2.json();
            console.log("Résultat apicarto:", data2);

            if (data2.features && data2.features.length > 0) {
              processParcelleResult(data2.features[0] as ParcelleFeature);
              return;
            }
          }
        } else {
          const data = await response.json();
          console.log("Résultat API cadastre:", data);

          if (data && (data.features || data.parcelles)) {
            const features = data.features || data.parcelles;
            if (features.length > 0) {
              console.log("Parcelle trouvée via API cadastre !");
              // Adapter le format si nécessaire
              const parcelle = features[0];
              processParcelleResult(parcelle as ParcelleFeature);
              return;
            }
          }
        }

        setError(
          "Les services de cadastre semblent indisponibles. Essayez de contacter le support technique.",
        );
      } catch (err) {
        console.error("Erreur:", err);
        setError(`Erreur: ${err instanceof Error ? err.message : "Erreur inconnue"}`);
      } finally {
        setLoading(false);
      }
    };

    map.on("click", handleMapClick);

    // Exposer la fonction de test sur la fenêtre pour debug
    (window as any).loadTestParcelle = loadTestParcelle;

    // Cleanup
    return () => {
      map.off("click", handleMapClick);
      map.remove();
    };
  }, [center, zoom, onParcelleSelect]);

  return (
    <div className={`parcelle-selector-container ${className}`}>
      <div
        ref={containerRef}
        className="parcelle-selector-map"
        style={{ height, cursor: loading ? "wait" : "crosshair" }}
      />

      {/* Panneau d'information */}
      {(loading || selectedParcelle || error) && (
        <div
          className={`parcelle-selector-info ${loading ? "loading" : error ? "error" : "success"}`}
        >
          {loading && <div>Recherche de la parcelle...</div>}

          {error && (
            <div>
              <div className="parcelle-info-title">Information</div>
              <div className="parcelle-info-detail">{error}</div>
            </div>
          )}

          {selectedParcelle && !loading && (
            <div>
              <div className="parcelle-info-title">Parcelle sélectionnée</div>
              <div className="parcelle-info-detail">
                <strong>Identifiant:</strong>{" "}
                <span className="parcelle-info-id">
                  {selectedParcelle.properties?.idu || selectedParcelle.properties?.id || "N/A"}
                </span>
              </div>
              {selectedParcelle.properties?.nom_com && (
                <div className="parcelle-info-detail">
                  <strong>Commune:</strong> {selectedParcelle.properties.nom_com}
                </div>
              )}
              {selectedParcelle.properties?.section && (
                <div className="parcelle-info-detail">
                  <strong>Section:</strong> {selectedParcelle.properties.section}
                </div>
              )}
              {selectedParcelle.properties?.numero && (
                <div className="parcelle-info-detail">
                  <strong>Numéro:</strong> {selectedParcelle.properties.numero}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      {!loading && !selectedParcelle && !error && (
        <div
          className="parcelle-selector-info"
          style={{ background: "#f0f8ff", border: "1px solid #4a90e2" }}
        >
          <div style={{ fontSize: "13px", color: "#4a90e2" }}>
            Cliquez sur une parcelle cadastrale
            <br />
            <small>Zoomez et cliquez directement sur un bâtiment pour de meilleurs résultats</small>
            <br />
            <button
              onClick={() => (window as any).loadTestParcelle?.()}
              style={{
                marginTop: "10px",
                padding: "5px 10px",
                fontSize: "12px",
                background: "#ff6b6b",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              🧪 Tester avec parcelle 25056000HZ0011
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParcelleSelector;
