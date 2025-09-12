interface InputFormFieldsProps {
  formData: any;
  onFormDataChange: (data: any) => void;
  isEditable: boolean;
}

export function InputFormFields({ formData, onFormDataChange, isEditable }: InputFormFieldsProps) {
  const handleInputChange = (field: string, value: any) => {
    onFormDataChange({
      ...formData,
      [field]: value,
    });
  };

  return (
    <div className="fr-form-group">
      {/* Section Informations générales */}
      <fieldset className="fr-fieldset fr-fieldset--inline fr-mb-3w">
        <legend className="fr-fieldset__legend fr-text--medium">Informations générales</legend>

        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-12">
            <div className="fr-input-group">
              <label className="fr-label" htmlFor="identifiantParcelle">
                Identifiant parcelle
              </label>
              <input
                className="fr-input"
                type="text"
                id="identifiantParcelle"
                value={formData.identifiantParcelle || ""}
                onChange={(e) => handleInputChange("identifiantParcelle", e.target.value)}
                disabled={!isEditable}
              />
            </div>
          </div>

          <div className="fr-col-12">
            <div className="fr-input-group">
              <label className="fr-label" htmlFor="commune">
                Commune
              </label>
              <input
                className="fr-input"
                type="text"
                id="commune"
                value={formData.commune || ""}
                onChange={(e) => handleInputChange("commune", e.target.value)}
                disabled={!isEditable}
              />
            </div>
          </div>
        </div>
      </fieldset>

      {/* Section Surfaces */}
      <fieldset className="fr-fieldset fr-fieldset--inline fr-mb-3w">
        <legend className="fr-fieldset__legend fr-text--medium">Surfaces et bâti</legend>

        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-12">
            <div className="fr-input-group">
              <label className="fr-label" htmlFor="surfaceSite">
                Surface du site (m²) *
              </label>
              <input
                className="fr-input"
                type="number"
                id="surfaceSite"
                value={formData.surfaceSite || ""}
                onChange={(e) => handleInputChange("surfaceSite", parseInt(e.target.value))}
                disabled={!isEditable}
                required
              />
            </div>
          </div>

          <div className="fr-col-12">
            <div className="fr-input-group">
              <label className="fr-label" htmlFor="surfaceBati">
                Surface bâtie (m²)
              </label>
              <input
                className="fr-input"
                type="number"
                id="surfaceBati"
                value={formData.surfaceBati || ""}
                onChange={(e) => handleInputChange("surfaceBati", parseInt(e.target.value))}
                disabled={!isEditable}
              />
            </div>
          </div>

          <div className="fr-col-12">
            <div className="fr-select-group">
              <label className="fr-label" htmlFor="typeProprietaire">
                Type de propriétaire
              </label>
              <select
                className="fr-select"
                id="typeProprietaire"
                value={formData.typeProprietaire || ""}
                onChange={(e) => handleInputChange("typeProprietaire", e.target.value)}
                disabled={!isEditable}
              >
                <option value="">-- Sélectionner --</option>
                <option value="PUBLIC">Public</option>
                <option value="PRIVE">Privé</option>
                <option value="MIXTE">Mixte</option>
              </select>
            </div>
          </div>
        </div>
      </fieldset>

      {/* Section État du site */}
      <fieldset className="fr-fieldset fr-fieldset--inline fr-mb-3w">
        <legend className="fr-fieldset__legend fr-text--medium">État du site</legend>

        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-12">
            <div className="fr-select-group">
              <label className="fr-label" htmlFor="etatBatiInfrastructure">
                État du bâti
              </label>
              <select
                className="fr-select"
                id="etatBatiInfrastructure"
                value={formData.etatBatiInfrastructure || ""}
                onChange={(e) => handleInputChange("etatBatiInfrastructure", e.target.value)}
                disabled={!isEditable}
              >
                <option value="">-- Sélectionner --</option>
                <option value="BATIMENTS_HETEROGENES">Bâtiments hétérogènes</option>
                <option value="BATIMENTS_HOMOGENES">Bâtiments homogènes</option>
                <option value="ABSENCE_BATIMENTS">Absence de bâtiments</option>
              </select>
            </div>
          </div>

          <div className="fr-col-12">
            <div className="fr-select-group">
              <label className="fr-label" htmlFor="presencePollution">
                Pollution
              </label>
              <select
                className="fr-select"
                id="presencePollution"
                value={formData.presencePollution || ""}
                onChange={(e) => handleInputChange("presencePollution", e.target.value)}
                disabled={!isEditable}
              >
                <option value="">-- Sélectionner --</option>
                <option value="NON">Non</option>
                <option value="OUI_HYDROCARBURES">Oui - Hydrocarbures</option>
                <option value="OUI_AUTRES_COMPOSES">Oui - Autres composés</option>
                <option value="NE_SAIT_PAS">Ne sait pas</option>
              </select>
            </div>
          </div>

          <div className="fr-col-12">
            <div className="fr-checkbox-group">
              <input
                type="checkbox"
                id="terrainViabilise"
                checked={formData.terrainViabilise || false}
                onChange={(e) => handleInputChange("terrainViabilise", e.target.checked)}
                disabled={!isEditable}
              />
              <label className="fr-label" htmlFor="terrainViabilise">
                Terrain viabilisé
              </label>
            </div>
          </div>
        </div>
      </fieldset>

      {/* Section Localisation */}
      <fieldset className="fr-fieldset fr-fieldset--inline fr-mb-3w">
        <legend className="fr-fieldset__legend fr-text--medium">Localisation</legend>

        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-12">
            <div className="fr-checkbox-group">
              <input
                type="checkbox"
                id="siteEnCentreVille"
                checked={formData.siteEnCentreVille || false}
                onChange={(e) => handleInputChange("siteEnCentreVille", e.target.checked)}
                disabled={!isEditable}
              />
              <label className="fr-label" htmlFor="siteEnCentreVille">
                Centre-ville/bourg
              </label>
            </div>
          </div>

          <div className="fr-col-12">
            <div className="fr-select-group">
              <label className="fr-label" htmlFor="distanceTransportCommun">
                Distance transport
              </label>
              <select
                className="fr-select"
                id="distanceTransportCommun"
                value={formData.distanceTransportCommun || ""}
                onChange={(e) => handleInputChange("distanceTransportCommun", e.target.value)}
                disabled={!isEditable}
              >
                <option value="">-- Sélectionner --</option>
                <option value="MOINS_DE_500M">{"< 500m"}</option>
                <option value="PLUS_DE_500M">{"> 500m"}</option>
              </select>
            </div>
          </div>

          <div className="fr-col-12">
            <div className="fr-checkbox-group">
              <input
                type="checkbox"
                id="proximiteCommercesServices"
                checked={formData.proximiteCommercesServices || false}
                onChange={(e) => handleInputChange("proximiteCommercesServices", e.target.checked)}
                disabled={!isEditable}
              />
              <label className="fr-label" htmlFor="proximiteCommercesServices">
                Commerces à proximité
              </label>
            </div>
          </div>
        </div>
      </fieldset>

      {/* Section Zonages */}
      <fieldset className="fr-fieldset fr-fieldset--inline fr-mb-3w">
        <legend className="fr-fieldset__legend fr-text--medium">Zonages et contraintes</legend>

        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-12">
            <div className="fr-select-group">
              <label className="fr-label" htmlFor="zonageReglementaire">
                Zonage PLU
              </label>
              <select
                className="fr-select"
                id="zonageReglementaire"
                value={formData.zonageReglementaire || ""}
                onChange={(e) => handleInputChange("zonageReglementaire", e.target.value)}
                disabled={!isEditable}
              >
                <option value="">-- Sélectionner --</option>
                <option value="ZONE_URBAINE_U">Zone urbaine (U)</option>
                <option value="ZONE_NATURELLE">Zone naturelle (N)</option>
                <option value="ZONE_AGRICOLE">Zone agricole (A)</option>
                <option value="ZONE_ECONOMIQUE">Zone économique</option>
              </select>
            </div>
          </div>

          <div className="fr-col-12">
            <div className="fr-select-group">
              <label className="fr-label" htmlFor="presenceRisquesNaturels">
                Risques naturels
              </label>
              <select
                className="fr-select"
                id="presenceRisquesNaturels"
                value={formData.presenceRisquesNaturels || ""}
                onChange={(e) => handleInputChange("presenceRisquesNaturels", e.target.value)}
                disabled={!isEditable}
              >
                <option value="">-- Sélectionner --</option>
                <option value="AUCUN">Aucun</option>
                <option value="FAIBLE">Faible</option>
                <option value="MOYEN">Moyen</option>
                <option value="FORT">Fort</option>
              </select>
            </div>
          </div>
        </div>
      </fieldset>

      {/* Affichage compact de tous les autres champs sous forme de liste */}
      <details className="fr-mt-2w">
        <summary className="fr-text--sm">Voir tous les paramètres</summary>
        <div className="fr-table fr-table--sm fr-mt-2w">
          <table>
            <thead>
              <tr>
                <th>Paramètre</th>
                <th>Valeur</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(formData).map(([key, value]) => (
                <tr key={key}>
                  <td className="fr-text--sm">{key}</td>
                  <td className="fr-text--sm">
                    {typeof value === "boolean"
                      ? value
                        ? "Oui"
                        : "Non"
                      : value?.toString() || "Non renseigné"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
