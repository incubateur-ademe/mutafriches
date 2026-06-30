import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface RenameSiteModalProps {
  isOpen: boolean;
  initialNom: string;
  onClose: () => void;
  onSubmit: (nom: string) => Promise<void>;
}

const RenameSiteModalInner: React.FC<Omit<RenameSiteModalProps, "isOpen">> = ({
  initialNom,
  onClose,
  onSubmit,
}) => {
  const [nom, setNom] = useState(initialNom);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSubmit(nom);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const modalContent = (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.5)", zIndex: 1100 }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mf-ms-rename-modal-title"
        className="fr-modal__body"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(560px, 92vw)",
          background: "var(--background-default-grey, #fff)",
          borderRadius: "8px",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
          zIndex: 1101,
        }}
      >
        <div className="fr-modal__header" style={{ padding: "1rem 1.5rem" }}>
          <button
            type="button"
            className="fr-btn--close fr-btn"
            onClick={onClose}
            aria-label="Fermer la fenêtre"
          >
            Fermer
          </button>
        </div>

        <div className="fr-modal__content" style={{ padding: "0 1.5rem 1rem" }}>
          <h1 id="mf-ms-rename-modal-title" className="fr-modal__title fr-h4 fr-mb-2w">
            Modifier le site
          </h1>
          <div className="fr-input-group">
            <label className="fr-label" htmlFor="mf-ms-rename-input">
              Nom du site
              <span className="fr-hint-text">
                Laissez vide pour revenir au nom par défaut (rue la plus proche).
              </span>
            </label>
            <input
              ref={inputRef}
              id="mf-ms-rename-input"
              className="fr-input"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
            />
          </div>
        </div>

        <div
          className="fr-modal__footer"
          style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border-default-grey)" }}
        >
          <ul className="fr-btns-group fr-btns-group--inline-reverse fr-btns-group--right">
            <li>
              <button
                type="button"
                className="fr-btn"
                onClick={handleSubmit}
                disabled={saving}
                aria-busy={saving}
              >
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </li>
            <li>
              <button
                type="button"
                className="fr-btn fr-btn--secondary"
                onClick={onClose}
                disabled={saving}
              >
                Annuler
              </button>
            </li>
          </ul>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
};

export const RenameSiteModal: React.FC<RenameSiteModalProps> = ({ isOpen, ...rest }) => {
  if (!isOpen) return null;
  return <RenameSiteModalInner {...rest} />;
};
