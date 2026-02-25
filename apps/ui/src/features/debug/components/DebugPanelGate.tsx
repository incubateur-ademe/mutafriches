import React from "react";
import { isDebugPanelEnabled } from "../utils/debug.helpers";
import { DebugPanel } from "./DebugPanel";
import type { DebugPanelProps } from "./DebugPanel";

/**
 * Gate environnementale pour le panneau de diagnostic.
 * Ne rend rien en production. En dev/staging, affiche le DebugPanel.
 *
 * Vite remplace import.meta.env.DEV par false en build prod,
 * le tree-shaking elimine tout le code debug du bundle.
 */
export const DebugPanelGate: React.FC<DebugPanelProps> = (props) => {
  if (!isDebugPanelEnabled()) {
    return null;
  }
  return <DebugPanel {...props} />;
};
