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

interface ParcelleInfoPanelProps {
  info: ParcelleInfo | null;
  loading: boolean;
  introuvable: boolean;
}

export function ParcelleInfoPanel({ info, loading, introuvable }: ParcelleInfoPanelProps) {
  const [copie, setCopie] = useState(false);

  const copier = async () => {
    if (!info) return;
    try {
      await navigator.clipboard.writeText(info.idu);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      // presse-papiers indisponible : on ignore
    }
  };

  if (loading) {
    return (
      <div className="fr-callout">
        <p className="fr-callout__text">Recherche de la parcelle…</p>
      </div>
    );
  }

  if (introuvable) {
    return (
      <div className="fr-callout fr-callout--brown-cafe">
        <p className="fr-callout__text">Aucune parcelle trouvée à cet emplacement.</p>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="fr-callout">
        <p className="fr-callout__text">
          Cliquez sur une parcelle ou recherchez une adresse pour afficher son IDU et ses
          informations.
        </p>
      </div>
    );
  }

  const ha = info.contenance ? (info.contenance / 10000).toFixed(2) : null;

  return (
    <div className="fr-callout fr-callout--blue-ecume">
      <p className="fr-text--sm fr-mb-1v">Identifiant cadastral (IDU)</p>
      <p className="fr-h6 fr-mb-1w">
        <code>{info.idu}</code>
      </p>
      <button
        type="button"
        className="fr-btn fr-btn--sm fr-btn--secondary fr-icon-clipboard-line fr-btn--icon-left fr-mb-3w"
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
        className="fr-link fr-icon-external-link-line fr-link--icon-right fr-mt-2w"
        href={lienGeoportail(info.coords, 19)}
        target="_blank"
        rel="noopener noreferrer"
      >
        Voir sur le cadastre (Géoportail)
      </a>
    </div>
  );
}
