import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { CanalIntegrateur } from "@mutafriches/shared-types";
import { ModalInfo } from "../../../shared/components/common/ModalInfo";
import { ROUTES } from "../../../shared/config/routes.config";
import { FormulaireDeclaration } from "./FormulaireDeclaration";

export type CanalModale = CanalIntegrateur.API | CanalIntegrateur.PAGE;

const CONTENUS: Record<CanalModale, { titre: string; intro: string; envoi: string }> = {
  [CanalIntegrateur.API]: {
    titre: "Déclarer mon utilisation de l'API",
    intro:
      "Indiquez le domaine depuis lequel partiront vos appels : il est autorisé dès l'envoi, sans clé ni jeton.",
    envoi: "Déclarer mon domaine",
  },
  [CanalIntegrateur.PAGE]: {
    titre: "Demander une page personnalisée",
    intro:
      "Dites-nous qui vous êtes : l'équipe vous recontacte pour préparer votre page à partir de votre liste de sites.",
    envoi: "Envoyer ma demande",
  },
};

interface DeclarationModalProps {
  // null : modale fermée
  canal: CanalModale | null;
  onClose: () => void;
  onRendezVous: () => void;
  // Première action après une déclaration API ; par défaut, le lien vers la documentation
  suiteApi?: ReactNode;
}

export function DeclarationModal({
  canal,
  onClose,
  onRendezVous,
  suiteApi,
}: DeclarationModalProps) {
  // Le dernier canal ouvert reste affiché pendant l'animation de fermeture.
  const contenu = CONTENUS[canal ?? CanalIntegrateur.API];

  return (
    <ModalInfo
      id="modal-declaration-integrateur"
      title={contenu.titre}
      isOpen={canal !== null}
      onClose={onClose}
      showIcon={false}
    >
      <p>{contenu.intro}</p>
      {canal && (
        <FormulaireDeclaration
          key={canal}
          canal={canal}
          libelleEnvoi={contenu.envoi}
          suite={
            canal === CanalIntegrateur.API
              ? (suiteApi ?? (
                  // La modale est refermée avant de changer de page, pour libérer le défilement.
                  <Link to={ROUTES.DOCUMENTATION_API} className="fr-btn" onClick={onClose}>
                    Lire la documentation de l'API
                  </Link>
                ))
              : undefined
          }
          onRendezVous={onRendezVous}
        />
      )}
    </ModalInfo>
  );
}
