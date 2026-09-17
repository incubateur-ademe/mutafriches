import React, { useState } from "react";
import type { FormatExportCnig, RapportExportCnig } from "@mutafriches/shared-types";
import { ModalInfo } from "@shared/components/common/ModalInfo";

export interface OptionsExportSites {
  format: FormatExportCnig;
  inclureMutabilite: boolean;
}

interface ExportSitesModalProps {
  isOpen: boolean;
  nombreSites: number;
  loading: boolean;
  erreur: string | null;
  rapport: RapportExportCnig | null;
  onClose: () => void;
  onExport: (options: OptionsExportSites) => void;
}

const FORMATS: { valeur: FormatExportCnig; label: string; hint: string }[] = [
  {
    valeur: "csv",
    label: "CSV (standard CNIG)",
    hint: "Fichier d'échange de référence, validable sur validata.fr, ouvrable dans un tableur",
  },
  {
    valeur: "geojson",
    label: "GeoJSON",
    hint: "Emprises et centroïdes directement exploitables dans un SIG (QGIS)",
  },
];

/** Export de tous les sites du partenaire au standard CNIG Friches. */
export const ExportSitesModal: React.FC<ExportSitesModalProps> = ({
  isOpen,
  nombreSites,
  loading,
  erreur,
  rapport,
  onClose,
  onExport,
}) => {
  const [format, setFormat] = useState<FormatExportCnig>("csv");
  const [inclureMutabilite, setInclureMutabilite] = useState(false);

  return (
    <ModalInfo
      id="modal-export-sites"
      title="Exporter tous les sites"
      isOpen={isOpen}
      onClose={onClose}
      icon="fr-icon-download-line"
      actions={
        <>
          <button
            type="button"
            className="fr-btn fr-btn--secondary"
            onClick={onClose}
            disabled={loading}
          >
            Fermer
          </button>
          <button
            type="button"
            className="fr-btn"
            onClick={() => onExport({ format, inclureMutabilite })}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? "Export en cours..." : "Exporter"}
          </button>
        </>
      }
    >
      <p className="fr-text--sm fr-mb-2w">
        Un fichier unique décrivant les {nombreSites} sites de cette page, au{" "}
        <a
          href="https://cnig.gouv.fr/IMG/pdf/251204_standard_cnig_friches_v2023-12_rev2025-12.pdf"
          target="_blank"
          rel="noopener noreferrer"
        >
          standard CNIG Friches
        </a>
        . Les caractéristiques que Mutafriches ne connaît pas sortent à « inconnu », valeur
        conventionnelle du standard.
      </p>

      <fieldset className="fr-fieldset" aria-labelledby="export-format-legend">
        <legend
          className="fr-fieldset__legend--regular fr-fieldset__legend"
          id="export-format-legend"
        >
          Format du fichier
        </legend>
        {FORMATS.map(({ valeur, label, hint }) => (
          <div className="fr-fieldset__element" key={valeur}>
            <div className="fr-radio-group">
              <input
                type="radio"
                id={`export-format-${valeur}`}
                name="export-format"
                value={valeur}
                checked={format === valeur}
                onChange={() => setFormat(valeur)}
                disabled={loading}
              />
              <label className="fr-label" htmlFor={`export-format-${valeur}`}>
                {label}
                <span className="fr-hint-text">{hint}</span>
              </label>
            </div>
          </div>
        ))}
      </fieldset>

      <div className="fr-checkbox-group fr-mb-2w">
        <input
          type="checkbox"
          id="export-inclure-mutabilite"
          checked={inclureMutabilite}
          onChange={(e) => setInclureMutabilite(e.target.checked)}
          disabled={loading}
        />
        <label className="fr-label" htmlFor="export-inclure-mutabilite">
          Ajouter les indices de mutabilité
          <span className="fr-hint-text">
            Colonnes mf_*, hors standard : le fichier n'est alors plus conforme. Seuls les sites
            évalués depuis ce navigateur sont renseignés.
          </span>
        </label>
      </div>

      {erreur && (
        <div className="fr-alert fr-alert--error fr-alert--sm fr-mb-2w">
          <p>{erreur}</p>
        </div>
      )}

      {rapport && (
        <div
          className={`fr-alert fr-alert--sm fr-mb-2w ${
            rapport.sitesEcartes.length > 0 ? "fr-alert--warning" : "fr-alert--success"
          }`}
        >
          <p>
            {rapport.sitesExportes} site{rapport.sitesExportes > 1 ? "s" : ""} exporté
            {rapport.sitesExportes > 1 ? "s" : ""} sur {rapport.sitesTotal}.
          </p>
          {rapport.sitesEcartes.length > 0 && (
            <>
              <p className="fr-mt-1w">
                Le standard impose une commune et un centroïde : les sites suivants en manquent.
                Ouvrez-les une fois dans la liste pour les enrichir, puis relancez l'export.
              </p>
              <ul className="fr-text--sm fr-mb-0">
                {rapport.sitesEcartes.slice(0, 10).map((site) => (
                  <li key={site.idtup}>
                    {site.idtup}
                    {site.commune ? ` (${site.commune})` : ""} — {site.motif}
                  </li>
                ))}
                {rapport.sitesEcartes.length > 10 && (
                  <li>et {rapport.sitesEcartes.length - 10} autre(s)</li>
                )}
              </ul>
            </>
          )}
        </div>
      )}
    </ModalInfo>
  );
};
