import React from "react";

interface StepNavigationProps {
  /** Callback pour retourner à l'étape précédente */
  onPrevious?: () => void;
  /** Callback pour passer à l'étape suivante */
  onNext?: () => void;
  /** Libellé du bouton précédent */
  previousLabel?: string;
  /** Libellé du bouton suivant */
  nextLabel?: string;
  /** Désactiver les boutons pendant le chargement */
  isLoading?: boolean;
  /** Masquer le bouton précédent */
  hidePrevious?: boolean;
  /** Masquer le bouton suivant */
  hideNext?: boolean;
  /** Type du bouton suivant (button ou submit) */
  nextType?: "button" | "submit";
  /** ID du formulaire à soumettre (si nextType="submit") */
  formId?: string;
}

/**
 * Composant de navigation entre les étapes de qualification
 */
export const StepNavigation: React.FC<StepNavigationProps> = ({
  onPrevious,
  onNext,
  previousLabel = "Précédent",
  nextLabel = "Continuer",
  isLoading = false,
  hidePrevious = false,
  hideNext = false,
  nextType = "button",
  formId,
}) => {
  return (
    <div className="fr-mt-4w fr-btns-group fr-btns-group--inline fr-btns-group--center">
      {!hidePrevious && (
        <button
          type="button"
          className="fr-btn fr-btn--secondary"
          onClick={onPrevious}
          disabled={isLoading}
        >
          <span className="fr-icon-arrow-left-s-line fr-icon--sm" aria-hidden="true"></span>
          {previousLabel}
        </button>
      )}

      {!hideNext && (
        <button
          type={nextType}
          form={nextType === "submit" ? formId : undefined}
          className="fr-btn"
          onClick={nextType === "button" ? onNext : undefined}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="fr-icon-refresh-line fr-icon--sm" aria-hidden="true"></span>
              Chargement...
            </>
          ) : (
            <>
              {nextLabel}
              <span className="fr-icon-arrow-right-s-line fr-icon--sm" aria-hidden="true"></span>
            </>
          )}
        </button>
      )}
    </div>
  );
};
