import { useState } from "react";
import { apicartoParamsParPoint } from "@mutafriches/shared-types";
import { fetchCadastre } from "../api/cadastre.client";
import { LigneResolution, ResultatTable } from "./ResultatTable";

export function CoordonneesTab() {
  const [lon, setLon] = useState("2.9389");
  const [lat, setLat] = useState("48.386");
  const [lignes, setLignes] = useState<LigneResolution[] | null>(null);
  const [loading, setLoading] = useState(false);

  const resoudre = async (): Promise<void> => {
    setLoading(true);
    setLignes(null);
    const parcelle = await fetchCadastre(apicartoParamsParPoint(Number(lon), Number(lat)));
    setLignes([
      {
        ref: `${lon}, ${lat}`,
        idu: parcelle?.idu ?? null,
        commune: parcelle?.commune ?? null,
      },
    ]);
    setLoading(false);
  };

  return (
    <>
      <div className="fr-grid-row fr-grid-row--gutters fr-mb-2w">
        <div className="fr-col-12 fr-col-md-3">
          <div className="fr-input-group">
            <label className="fr-label" htmlFor="lon">
              Longitude
            </label>
            <input
              className="fr-input"
              id="lon"
              value={lon}
              onChange={(e) => setLon(e.target.value)}
            />
          </div>
        </div>
        <div className="fr-col-12 fr-col-md-3">
          <div className="fr-input-group">
            <label className="fr-label" htmlFor="lat">
              Latitude
            </label>
            <input
              className="fr-input"
              id="lat"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
            />
          </div>
        </div>
        <div className="fr-col-12 fr-col-md-3 flex items-end">
          <button
            type="button"
            className="fr-btn fr-mt-md-4w"
            onClick={() => void resoudre()}
            disabled={loading}
          >
            {loading ? "Résolution…" : "Résoudre"}
          </button>
        </div>
      </div>

      {lignes && <ResultatTable lignes={lignes} />}
    </>
  );
}
