import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type AddSiteSubmit = (idpars: string[]) => Promise<{ invalidIdpars: string[]; success: boolean }>;

interface AddSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: AddSiteSubmit;
}

const AddSiteModalInner: React.FC<{
  onClose: () => void;
  onSubmit: AddSiteSubmit;
}> = ({ onClose, onSubmit }) => {
  const [value, setValue] = useState("");
  const [invalidIdpars, setInvalidIdpars] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleSubmit = async () => {
    const lines = value
      .split(/[\n,;]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (lines.length === 0) {
      setErrorMessage("Veuillez saisir au moins un identifiant de parcelle.");
      setInvalidIdpars([]);
      return;
    }

    setSubmitting(true);
    try {
      const result = await onSubmit(lines);

      if (!result.success) {
        setErrorMessage(
          "Aucun identifiant valide. Format attendu : 14 caractères (ex. 920500000K0010).",
        );
        setInvalidIdpars(result.invalidIdpars);
        return;
      }

      if (result.invalidIdpars.length > 0) {
        setErrorMessage(
          `Site ajouté. Certains identifiants ont été ignorés car invalides : ${result.invalidIdpars.join(", ")}`,
        );
        setInvalidIdpars(result.invalidIdpars);
      }

      onClose();
    } catch {
      setErrorMessage("Erreur lors de l'ajout du site. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  const modalContent = (
    <>
      <div
        className="mf-ms-modal__backdrop"
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.5)",
          zIndex: 1100,
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mf-ms-add-modal-title"
        className="fr-modal__body"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(640px, 92vw)",
          maxHeight: "90vh",
          overflowY: "auto",
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
          <h1 id="mf-ms-add-modal-title" className="fr-modal__title fr-h4 fr-mb-2w">
            Ajouter un site
          </h1>

          <div className="fr-input-group fr-mb-2w">
            <label className="fr-label" htmlFor="mf-ms-add-textarea">
              Identifiants de parcelles
              <span className="fr-hint-text">
                Un identifiant par ligne (14 caractères). Si plusieurs parcelles forment une unité
                foncière, listez-les ensemble. Pour ajouter plusieurs sites distincts, répétez
                l'opération.
              </span>
            </label>
            <textarea
              ref={textareaRef}
              id="mf-ms-add-textarea"
              className="fr-input"
              rows={6}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Exemple :&#10;920500000K0010&#10;920500000K0011"
            />
          </div>

          {errorMessage && (
            <div className="fr-alert fr-alert--warning fr-mb-2w">
              <p className="fr-alert__title fr-sr-only">Information</p>
              <p>{errorMessage}</p>
              {invalidIdpars.length > 0 && (
                <ul className="fr-mb-0">
                  {invalidIdpars.map((id) => (
                    <li key={id}>
                      <code>{id}</code>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
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
                disabled={submitting}
                aria-busy={submitting}
              >
                {submitting ? "Ajout en cours..." : "Ajouter"}
              </button>
            </li>
            <li>
              <button
                type="button"
                className="fr-btn fr-btn--secondary"
                onClick={onClose}
                disabled={submitting}
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

export const AddSiteModal: React.FC<AddSiteModalProps> = ({ isOpen, onClose, onSubmit }) => {
  if (!isOpen) return null;
  return <AddSiteModalInner onClose={onClose} onSubmit={onSubmit} />;
};
