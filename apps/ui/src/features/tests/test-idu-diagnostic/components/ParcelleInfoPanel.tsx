import { useState } from "react";
import { lienGeoportail } from "../geoportail";

export interface ParcelleInfo {
  idu: string;
  commune?: string;
  section?: string;
  numero?: string;
  contenance?: number;
  coords: [number, number];
}

interface ParcelleInfoCardProps {
  info: ParcelleInfo;
  onRemove: (idu: string) => void;
}

export function ParcelleInfoCard({ info, onRemove }: ParcelleInfoCardProps) {
  const [copie, setCopie] = useState(false);

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(info.idu);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      // presse-papiers indisponible : on ignore
    }
  };

  const ha = info.contenance ? (info.contenance / 10000).toFixed(2) : null;

  return (
    <div className="fr-callout fr-callout--blue-ecume fr-mb-2w">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "0.5rem",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <p className="fr-text--sm fr-mb-1v">Identifiant cadastral (IDU)</p>
          <p className="fr-h6 fr-mb-1w" style={{ wordBreak: "break-all" }}>
            <code>{info.idu}</code>
          </p>
        </div>
        <button
          type="button"
          className="fr-btn fr-btn--sm fr-btn--tertiary-no-outline fr-icon-delete-line"
          onClick={() => onRemove(info.idu)}
          title="Retirer cette parcelle"
          aria-label={`Retirer la parcelle ${info.idu}`}
        />
      </div>

      <button
        type="button"
        className="fr-btn fr-btn--sm fr-btn--secondary fr-icon-clipboard-line fr-btn--icon-left fr-mb-2w"
        onClick={copier}
      >
        {copie ? "Copié !" : "Copier l'IDU"}
      </button>

      <ul className="fr-text--sm" style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {info.commune && (
          <li>
            <strong>Commune :</strong> {info.commune}
          </li>
        )}
        {info.section && (
          <li>
            <strong>Section :</strong> {info.section}
          </li>
        )}
        {info.numero && (
          <li>
            <strong>Numéro :</strong> {info.numero}
          </li>
        )}
        {info.contenance != null && (
          <li>
            <strong>Surface :</strong> {info.contenance} m²{ha ? ` (${ha} ha)` : ""}
          </li>
        )}
      </ul>

      <a
        className="fr-link fr-icon-external-link-line fr-link--icon-right fr-mt-1w"
        href={lienGeoportail(info.coords, 19)}
        target="_blank"
        rel="noopener noreferrer"
      >
        Voir sur le cadastre (Géoportail)
      </a>
    </div>
  );
}
