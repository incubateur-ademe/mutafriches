import { CanalIntegrateur } from "@mutafriches/shared-types";
import { ModalInfo } from "../../../shared/components/common/ModalInfo";
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
}

export function DeclarationModal({ canal, onClose, onRendezVous }: DeclarationModalProps) {
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
          onRendezVous={onRendezVous}
        />
      )}
    </ModalInfo>
  );
}
