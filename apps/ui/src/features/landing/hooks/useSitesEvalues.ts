import { useEffect, useState } from "react";
import { statsService } from "../../../shared/services/api/api.stats.service";
import { arrondirAuPalier } from "../utils/sites-evalues.utils";

const PALIER = 500;

// Nombre de sites évalués arrondi au palier inférieur, null tant que inconnu ou en erreur
export function useSitesEvalues(): number | null {
  const [nombre, setNombre] = useState<number | null>(null);

  useEffect(() => {
    let actif = true;
    statsService
      .getSitesEvalues()
      .then((total) => {
        const arrondi = arrondirAuPalier(total, PALIER);
        if (actif && arrondi > 0) setNombre(arrondi);
      })
      .catch(() => {
        // Compteur décoratif : on masque la ligne plutôt que d'afficher un chiffre faux
      });
    return () => {
      actif = false;
    };
  }, []);

  return nombre;
}
