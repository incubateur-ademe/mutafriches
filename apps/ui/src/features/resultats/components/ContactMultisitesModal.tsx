import React, { useState } from "react";
import { BesoinMultisites } from "@mutafriches/shared-types";
import { ModalInfo } from "../../../shared/components/common/ModalInfo";

interface ContactMultisitesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string, besoin: BesoinMultisites) => Promise<void>;
}

const OPTIONS_BESOIN: { value: BesoinMultisites; label: string }[] = [
  {
    value: BesoinMultisites.SUIVI_COMPARAISON,
    label:
      "J'ai une liste de sites à analyser et je souhaite suivre et comparer les résultats dans un espace dédié dans Mutafriches.",
  },
  {
    value: BesoinMultisites.INTEGRATION_OUTILS,
    label:
      "Je souhaite intégrer Mutafriches à mes outils métier (SIG, portail cartographique, application interne, etc.) pour automatiser l'analyse de plusieurs sites.",
  },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ContactMultisitesModal: React.FC<ContactMultisitesModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [etape, setEtape] = useState<"formulaire" | "confirmation">("formulaire");
  const [besoin, setBesoin] = useState<BesoinMultisites | "">("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const emailValide = EMAIL_REGEX.test(email);
  const peutEnvoyer = besoin !== "" && emailValide && !submitting;

  // Réinitialise l'état interne à la fermeture pour repartir du formulaire au prochain ouvrage
  const handleClose = () => {
    onClose();
    setEtape("formulaire");
    setBesoin("");
    setEmail("");
    setSubmitting(false);
  };

  const handleSubmit = async () => {
    // peutEnvoyer garantit besoin !== "" : TypeScript le réduit à BesoinMultisites ici
    if (!peutEnvoyer) return;
    setSubmitting(true);
    // Le tracking ne lève jamais d'erreur : on affiche la confirmation dans tous les cas
    await onSubmit(email, besoin);
    setEtape("confirmation");
    setSubmitting(false);
  };

  if (etape === "confirmation") {
    return (
      <ModalInfo
        id="modal-contact-multisites"
        title="Merci !"
        isOpen={isOpen}
        onClose={handleClose}
        icon="fr-icon-checkbox-circle-line"
      >
        <p>Votre demande a bien été envoyée. Nous serons rapidement en contact.</p>
      </ModalInfo>
    );
  }

  return (
    <ModalInfo
      id="modal-contact-multisites"
      title="Quel est votre besoin ?"
      isOpen={isOpen}
      onClose={handleClose}
      icon="fr-icon-team-line"
      actions={
        <button className="fr-btn" onClick={handleSubmit} disabled={!peutEnvoyer}>
          Être contacté
        </button>
      }
    >
      <p>
        Dites-nous comment vous souhaitez analyser plusieurs sites avec Mutafriches. Nous vous
        recontactons sous 24 h pour vous orienter vers la bonne solution.
      </p>

      <fieldset className="fr-fieldset" id="besoin-multisites-fieldset">
        <legend className="fr-fieldset__legend" id="besoin-multisites-legend">
          <strong>Votre besoin</strong>
        </legend>
        {OPTIONS_BESOIN.map((option) => (
          <div key={option.value} className="fr-fieldset__element">
            <div className="fr-radio-group">
              <input
                type="radio"
                id={`besoin-${option.value}`}
                name="besoin-multisites"
                value={option.value}
                checked={besoin === option.value}
                onChange={() => setBesoin(option.value)}
              />
              <label className="fr-label" htmlFor={`besoin-${option.value}`}>
                {option.label}
              </label>
            </div>
          </div>
        ))}
      </fieldset>

      <div className="fr-input-group">
        <label className="fr-label" htmlFor="contact-multisites-email">
          Votre e-mail
        </label>
        <input
          className="fr-input"
          type="email"
          id="contact-multisites-email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
    </ModalInfo>
  );
};
