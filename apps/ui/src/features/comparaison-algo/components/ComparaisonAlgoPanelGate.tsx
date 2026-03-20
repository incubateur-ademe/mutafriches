import React from "react";
import { isDebugPanelEnabled } from "../../debug/utils/debug.helpers";
import { ComparaisonAlgoPanel } from "./ComparaisonAlgoPanel";
import type { ComparaisonAlgoPanelProps } from "./ComparaisonAlgoPanel";

/**
 * Gate environnementale pour le panneau de comparaison algorithme.
 * Ne rend rien en production. En dev/staging, affiche le panneau.
 */
export const ComparaisonAlgoPanelGate: React.FC<ComparaisonAlgoPanelProps> = (props) => {
  if (!isDebugPanelEnabled()) {
    return null;
  }
  return <ComparaisonAlgoPanel {...props} />;
};
