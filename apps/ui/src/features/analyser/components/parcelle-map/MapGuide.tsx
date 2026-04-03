import React from "react";
import type { SelectionState } from "../../../../shared/types/parcelle-selection.types";

interface MapGuideProps {
  selectionState: SelectionState;
  parcelleCount: number;
}

/**
 * Messages guide affichés en haut de la carte selon l'état de la sélection.
 */
const GUIDE_MESSAGES: Record<SelectionState, React.ReactNode> = {
  idle: "Cliquer sur une parcelle pour l'ajouter à votre site",
  previewing: "Cliquer sur une parcelle pour l'ajouter à votre site",
  "already-added": "Cliquer sur une parcelle pour l'ajouter à votre site",
  "non-adjacent": "Parcelle non adjacente",
  "max-size": (
    <>
      La surface étudiée est trop grande (supérieure à 10ha), les résultats risquent d'être
      détériorés.
      <br />
      Nous vous recommandons de diviser votre site en 2 analyses distinctes
    </>
  ),
  "max-parcelles": (
    <>
      Vous avez atteint le nombre maximum de parcelles sélectionnées (20).
      <br />
      Nous vous invitons à procéder à un test de votre site en deux fois.
    </>
  ),
};

/**
 * Composant affichant un message guide contextuel en overlay en haut de la carte.
 * Le message change en fonction de l'état de sélection et du nombre de parcelles.
 */
export function MapGuide({ selectionState, parcelleCount }: MapGuideProps) {
  const isError =
    selectionState === "non-adjacent" ||
    selectionState === "max-size" ||
    selectionState === "max-parcelles";

  // Affiner le message idle quand des parcelles sont déjà ajoutées
  let message: React.ReactNode;
  if (
    parcelleCount > 0 &&
    (selectionState === "idle" ||
      selectionState === "previewing" ||
      selectionState === "already-added")
  ) {
    message = (
      <>
        Cliquer sur une parcelle <strong>adjacente</strong> pour l'ajouter au site
      </>
    );
  } else {
    message = GUIDE_MESSAGES[selectionState];
  }

  return (
    <p
      className="fr-text--sm fr-mb-0"
      style={{
        color: "var(--blue-france-sun-113-625)",
        marginLeft: "1rem",
        textAlign: "right",
      }}
    >
      {isError && <span className="fr-icon-warning-line fr-icon--sm fr-mr-1v" aria-hidden="true" />}
      {message}
    </p>
  );
}
