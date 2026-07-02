import React, { useState } from "react";
import { ModalInfo } from "../../../shared/components/common/ModalInfo";

export interface ExportSelection {
  pdf: boolean;
  json: boolean;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (selection: ExportSelection) => void;
  loading: boolean;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport, loading }) => {
  const [pdf, setPdf] = useState(true);
  const [json, setJson] = useState(false);
  const aucunFormat = !pdf && !json;

  return (
    <ModalInfo
      id="modal-export"
      title="Exporter les résultats"
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
            Annuler
          </button>
          <button
            type="button"
            className="fr-btn"
            onClick={() => onExport({ pdf, json })}
            disabled={aucunFormat || loading}
            aria-busy={loading}
          >
            {loading ? "Export en cours..." : "Exporter"}
          </button>
        </>
      }
    >
      <fieldset className="fr-fieldset" id="export-formats" aria-labelledby="export-formats-legend">
        <legend
          className="fr-fieldset__legend--regular fr-fieldset__legend"
          id="export-formats-legend"
        >
          Sélectionnez le ou les formats à exporter.
        </legend>
        <div className="fr-fieldset__element">
          <div className="fr-checkbox-group">
            <input
              name="export-pdf"
              id="export-pdf"
              type="checkbox"
              checked={pdf}
              onChange={(e) => setPdf(e.target.checked)}
              disabled={loading}
            />
            <label className="fr-label" htmlFor="export-pdf">
              Export PDF
              <span className="fr-hint-text">
                Rapport multi-pages (analyse, site, détail par usage)
              </span>
            </label>
          </div>
        </div>
        <div className="fr-fieldset__element">
          <div className="fr-checkbox-group">
            <input
              name="export-json"
              id="export-json"
              type="checkbox"
              checked={json}
              onChange={(e) => setJson(e.target.checked)}
              disabled={loading}
            />
            <label className="fr-label" htmlFor="export-json">
              Export JSON
              <span className="fr-hint-text">Données brutes réutilisables (reproductible)</span>
            </label>
          </div>
        </div>
      </fieldset>
    </ModalInfo>
  );
};
