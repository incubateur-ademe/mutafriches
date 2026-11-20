import { FormEvent, ReactNode, useId, useState } from "react";
import { Link } from "react-router-dom";
import {
  TYPES_STRUCTURE,
  TYPE_STRUCTURE_LABELS,
  type CanalIntegrateur,
  type DeclarationIntegrateurOutput,
} from "@mutafriches/shared-types";
import { ROUTES } from "../../../shared/config/routes.config";
import { integrateursService } from "../../../shared/services/api/api.integrateurs.service";
import { ApiError } from "../../../shared/services/api/api.types";
import {
  confirmationDeclaration,
  construireDeclaration,
  demandeUnDomaine,
  LIBELLE_DOMAINE,
  messageErreurDeclaration,
  SAISIE_VIDE,
  validerDeclaration,
  type ErreursDeclaration,
  type SaisieDeclaration,
} from "../data/declaration-integrateur";

interface FormulaireDeclarationProps {
  canal: CanalIntegrateur;
  libelleEnvoi: string;
  // Affiche, après l'envoi, un bouton pour prendre rendez-vous avec l'équipe
  onRendezVous?: () => void;
}

interface ChampProps {
  id: string;
  label: string;
  aide?: string;
  erreur?: string;
  children: (attributs: { id: string; "aria-describedby"?: string }) => ReactNode;
}

function Champ({ id, label, aide, erreur, children }: ChampProps) {
  const idErreur = `${id}-erreur`;
  return (
    <div className={`fr-input-group${erreur ? " fr-input-group--error" : ""}`}>
      <label className="fr-label" htmlFor={id}>
        {label}
        {aide && <span className="fr-hint-text">{aide}</span>}
      </label>
      {children({ id, "aria-describedby": erreur ? idErreur : undefined })}
      {erreur && (
        <p id={idErreur} className="fr-error-text">
          {erreur}
        </p>
      )}
    </div>
  );
}

export function FormulaireDeclaration({
  canal,
  libelleEnvoi,
  onRendezVous,
}: FormulaireDeclarationProps) {
  const prefixe = useId();
  const [saisie, setSaisie] = useState<SaisieDeclaration>(SAISIE_VIDE);
  const [erreurs, setErreurs] = useState<ErreursDeclaration>({});
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [erreurEnvoi, setErreurEnvoi] = useState<string | null>(null);
  const [reponse, setReponse] = useState<DeclarationIntegrateurOutput | null>(null);

  const modifier = (champ: keyof SaisieDeclaration, valeur: string) =>
    setSaisie((precedente) => ({ ...precedente, [champ]: valeur }));

  const envoyer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const erreursSaisie = validerDeclaration(canal, saisie);
    setErreurs(erreursSaisie);
    if (Object.keys(erreursSaisie).length > 0) {
      return;
    }

    setEnvoiEnCours(true);
    setErreurEnvoi(null);
    try {
      setReponse(await integrateursService.declarer(construireDeclaration(canal, saisie)));
    } catch (error: unknown) {
      const erreurApi = error instanceof ApiError ? error : null;
      setErreurEnvoi(
        messageErreurDeclaration(erreurApi?.statusCode ?? 500, erreurApi?.message ?? ""),
      );
    } finally {
      setEnvoiEnCours(false);
    }
  };

  if (reponse) {
    const confirmation = confirmationDeclaration(reponse);
    return (
      <div role="status">
        <div className={`fr-alert fr-alert--${confirmation.niveau}`}>
          <h3 className="fr-alert__title">{confirmation.titre}</h3>
          <p>{confirmation.texte}</p>
        </div>
        {onRendezVous && (
          <button
            type="button"
            className="fr-btn fr-btn--secondary fr-mt-2w"
            onClick={onRendezVous}
          >
            Prendre rendez-vous avec l'équipe
          </button>
        )}
      </div>
    );
  }

  const libelleDomaine = LIBELLE_DOMAINE[canal];

  return (
    <form onSubmit={(event) => void envoyer(event)} noValidate>
      <Champ id={`${prefixe}-structure`} label="Nom de votre structure" erreur={erreurs.structure}>
        {(attributs) => (
          <input
            {...attributs}
            className="fr-input"
            type="text"
            autoComplete="organization"
            maxLength={255}
            value={saisie.structure}
            onChange={(event) => modifier("structure", event.target.value)}
          />
        )}
      </Champ>

      <div className={`fr-select-group${erreurs.typeStructure ? " fr-select-group--error" : ""}`}>
        <label className="fr-label" htmlFor={`${prefixe}-type`}>
          Type de structure
        </label>
        <select
          id={`${prefixe}-type`}
          className="fr-select"
          aria-describedby={erreurs.typeStructure ? `${prefixe}-type-erreur` : undefined}
          value={saisie.typeStructure}
          onChange={(event) => modifier("typeStructure", event.target.value)}
        >
          <option value="" disabled hidden>
            Sélectionner une option
          </option>
          {TYPES_STRUCTURE.map((type) => (
            <option key={type} value={type}>
              {TYPE_STRUCTURE_LABELS[type]}
            </option>
          ))}
        </select>
        {erreurs.typeStructure && (
          <p id={`${prefixe}-type-erreur`} className="fr-error-text">
            {erreurs.typeStructure}
          </p>
        )}
      </div>

      {demandeUnDomaine(canal) && (
        <Champ
          id={`${prefixe}-domaine`}
          label={libelleDomaine.label}
          aide={libelleDomaine.aide}
          erreur={erreurs.domaine}
        >
          {(attributs) => (
            <input
              {...attributs}
              className="fr-input"
              type="text"
              inputMode="url"
              autoComplete="off"
              maxLength={255}
              value={saisie.domaine}
              onChange={(event) => modifier("domaine", event.target.value)}
            />
          )}
        </Champ>
      )}

      {/* La gouttière retire la marge basse du dernier champ : on la rend, au pas des autres. */}
      <div className="fr-grid-row fr-grid-row--gutters fr-mb-3v">
        <div className="fr-col-12 fr-col-md-6">
          <Champ id={`${prefixe}-prenom`} label="Votre prénom" erreur={erreurs.prenom}>
            {(attributs) => (
              <input
                {...attributs}
                className="fr-input"
                type="text"
                autoComplete="given-name"
                maxLength={100}
                value={saisie.prenom}
                onChange={(event) => modifier("prenom", event.target.value)}
              />
            )}
          </Champ>
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <Champ id={`${prefixe}-nom`} label="Votre nom" erreur={erreurs.nom}>
            {(attributs) => (
              <input
                {...attributs}
                className="fr-input"
                type="text"
                autoComplete="family-name"
                maxLength={100}
                value={saisie.nom}
                onChange={(event) => modifier("nom", event.target.value)}
              />
            )}
          </Champ>
        </div>
      </div>

      <Champ
        id={`${prefixe}-email`}
        label="Adresse e-mail de contact"
        aide="Pour vous informer des évolutions du service et vous recontacter"
        erreur={erreurs.email}
      >
        {(attributs) => (
          <input
            {...attributs}
            className="fr-input"
            type="email"
            autoComplete="email"
            maxLength={254}
            value={saisie.email}
            onChange={(event) => modifier("email", event.target.value)}
          />
        )}
      </Champ>

      {/* Champ piège : masqué aux personnes, y compris aux lecteurs d'écran. */}
      <div className="fr-hidden" aria-hidden="true">
        <label htmlFor={`${prefixe}-telephone`}>Téléphone</label>
        <input
          id={`${prefixe}-telephone`}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={saisie.telephone}
          onChange={(event) => modifier("telephone", event.target.value)}
        />
      </div>

      {erreurEnvoi && (
        <div className="fr-alert fr-alert--error fr-alert--sm fr-mb-2w" role="alert">
          <p>{erreurEnvoi}</p>
        </div>
      )}

      <button type="submit" className="fr-btn" disabled={envoiEnCours}>
        {envoiEnCours ? "Envoi en cours…" : libelleEnvoi}
      </button>

      <p className="fr-hint-text fr-mt-2w">
        Vos prénom, nom et adresse e-mail sont conservés dans notre outil d'e-mailing, pas dans la
        base de Mutafriches.{" "}
        <Link to={ROUTES.POLITIQUE_CONFIDENTIALITE}>Politique de confidentialité</Link>
      </p>
    </form>
  );
}
