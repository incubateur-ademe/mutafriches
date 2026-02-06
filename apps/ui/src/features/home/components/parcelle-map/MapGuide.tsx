import type { SelectionState } from "../../../../shared/types/parcelle-selection.types";
import "./MapGuide.css";

interface MapGuideProps {
  selectionState: SelectionState;
  parcelleCount: number;
}

/**
 * Messages guide affichés en haut de la carte selon l'état de la sélection.
 */
const GUIDE_MESSAGES: Record<SelectionState, string> = {
  idle: "Cliquer sur une parcelle pour l'ajouter à votre site",
  previewing: "Cliquer sur une parcelle pour l'ajouter à votre site",
  "already-added": "Cliquer sur une parcelle pour l'ajouter à votre site",
  "non-adjacent": "Parcelle non adjacente",
  "max-size": "Taille de sélection maximale atteinte",
};

/**
 * Composant affichant un message guide contextuel en overlay en haut de la carte.
 * Le message change en fonction de l'état de sélection et du nombre de parcelles.
 */
export function MapGuide({ selectionState, parcelleCount }: MapGuideProps) {
  const isError = selectionState === "non-adjacent" || selectionState === "max-size";

  // Affiner le message idle quand des parcelles sont déjà ajoutées
  let message: string;
  if (
    parcelleCount > 0 &&
    (selectionState === "idle" || selectionState === "previewing" || selectionState === "already-added")
  ) {
    message = "Cliquer sur une parcelle adjacente pour l'ajouter au site";
  } else {
    message = GUIDE_MESSAGES[selectionState];
  }

  return (
    <div className={`map-guide ${isError ? "map-guide--error" : ""}`}>
      <span className={`map-guide__text ${isError ? "fr-icon-warning-line map-guide__text--icon" : ""}`}>
        {message}
      </span>
    </div>
  );
}
