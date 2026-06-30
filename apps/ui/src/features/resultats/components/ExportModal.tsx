import React from "react";
import { ModalInfo } from "../../../shared/components/common/ModalInfo";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportPdf: () => void;
  onExportJson: () => void;
  pdfLoading: boolean;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExportPdf,
  onExportJson,
  pdfLoading,
}) => (
  <ModalInfo
    id="modal-export"
    title="Exporter les résultats"
    isOpen={isOpen}
    onClose={onClose}
    icon="fr-icon-download-line"
  >
    <p className="fr-text--sm">Choisissez le format d'export de votre analyse de mutabilité.</p>
    <ul className="fr-btns-group fr-btns-group--icon-left">
      <li>
        <button
          type="button"
          className="fr-btn fr-icon-download-line"
          onClick={onExportPdf}
          disabled={pdfLoading}
          aria-busy={pdfLoading}
        >
          {pdfLoading ? "Génération du PDF..." : "Exporter en PDF"}
        </button>
      </li>
      <li>
        <button
          type="button"
          className="fr-btn fr-btn--secondary fr-icon-code-s-slash-line"
          onClick={onExportJson}
          disabled={pdfLoading}
        >
          Exporter en JSON
        </button>
      </li>
    </ul>
  </ModalInfo>
);
