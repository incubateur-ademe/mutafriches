import React, { useState } from "react";
import { useEventTracking } from "@shared/hooks/useEventTracking";

interface PartagerButtonProps {
  slug: string;
  nom: string;
}

// Partage standard de la page partenaire : Web Share API si disponible,
// repli sur la copie du lien. Le clic est tracé (PARTAGE_PAGE_PARTENAIRE).
export const PartagerButton: React.FC<PartagerButtonProps> = ({ slug, nom }) => {
  const { trackPartagePartenaire } = useEventTracking();
  const [copie, setCopie] = useState(false);

  const handlePartager = async (): Promise<void> => {
    void trackPartagePartenaire(slug);

    const url = window.location.href;

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: `Mutafriches — ${nom}`,
          text: `Analyse de mutabilité des friches : ${nom}`,
          url,
        });
      } catch {
        // Partage annulé par l'utilisateur ou indisponible : on ignore
      }
      return;
    }

    // Repli : copie du lien dans le presse-papiers
    try {
      await navigator.clipboard.writeText(url);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      // Presse-papiers indisponible : on ignore
    }
  };

  return (
    <button
      type="button"
      className="fr-btn fr-btn--secondary fr-icon-share-line fr-btn--icon-left"
      onClick={handlePartager}
    >
      {copie ? "Lien copié" : "Partager"}
    </button>
  );
};
