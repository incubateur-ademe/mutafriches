import { DsfrTabs } from "@shared/components/dsfr/DsfrTabs";
import { ParcelleSelectionMap } from "../../../analyser/components/parcelle-map/ParcelleSelectionMap";
import { CollageIdentifiantsPanel } from "./CollageIdentifiantsPanel";

interface AjoutSiteTabsProps {
  /** Ajoute un site sélectionné sur la carte */
  onAjouterSite: (identifiants: string[]) => void;
  /** Charge une liste d'identifiants collés */
  onChargerListe: (listes: string[][]) => void;
  desactive: boolean;
}

/**
 * Deux moyens d'ajouter un site au comparatif, présentés en onglets :
 * sélection sur la carte ou collage d'identifiants cadastraux.
 */
export function AjoutSiteTabs({ onAjouterSite, onChargerListe, desactive }: AjoutSiteTabsProps) {
  return (
    <DsfrTabs
      ariaLabel="Ajouter un site : carte ou collage d'identifiants"
      tabs={[
        {
          id: "carte",
          label: "Sélection sur la carte",
          panel: <ParcelleSelectionMap height="480px" onAnalyze={onAjouterSite} />,
        },
        {
          id: "coller",
          label: "Coller des identifiants",
          panel: <CollageIdentifiantsPanel onCharger={onChargerListe} desactive={desactive} />,
        },
      ]}
    />
  );
}
