import React, { useEffect, useRef } from "react";

interface ModalInfoProps {
  id: string;
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  icon?: string;
  size?: "sm" | "md" | "lg";
}

export const ModalInfo: React.FC<ModalInfoProps> = ({
  id,
  title,
  children,
  isOpen,
  onClose,
  icon = "fr-icon-info-line",
  size = "md",
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Déterminer les classes de colonnes selon la taille
  const getColumnClasses = () => {
    switch (size) {
      case "sm":
        return "fr-col-12 fr-col-md-6 fr-col-lg-4";
      case "lg":
        return "fr-col-12 fr-col-md-10 fr-col-lg-8";
      default:
        return "fr-col-12 fr-col-md-8 fr-col-lg-6";
    }
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // Utiliser l'API DSFR pour ouvrir/fermer
    const modalInstance = (window as any).dsfr?.(dialog)?.modal;

    if (!modalInstance) {
      console.warn("DSFR modal instance not found");
      return;
    }

    if (isOpen) {
      modalInstance.disclose();
    } else {
      modalInstance.conceal();
    }
  }, [isOpen]);

  // Écouter l'événement de fermeture DSFR
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleConceal = () => {
      onClose();
    };

    dialog.addEventListener("dsfr.conceal", handleConceal);

    return () => {
      dialog.removeEventListener("dsfr.conceal", handleConceal);
    };
  }, [onClose]);

  return (
    <>
      <dialog ref={dialogRef} id={id} className="fr-modal" aria-labelledby={`${id}-title`}>
        <div className="fr-container fr-container--fluid fr-container-md">
          <div className="fr-grid-row fr-grid-row--center">
            <div className={getColumnClasses()}>
              <div className="fr-modal__body">
                <div className="fr-modal__header">
                  <button
                    aria-controls={id}
                    title="Fermer"
                    type="button"
                    className="fr-btn--close fr-btn"
                  >
                    Fermer
                  </button>
                </div>
                <div className="fr-modal__content">
                  <h2 id={`${id}-title`} className="fr-modal__title">
                    <span className={`${icon} fr-icon--lg`} aria-hidden="true"></span> {title}
                  </h2>
                  {children}
                </div>
              </div>
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
};
