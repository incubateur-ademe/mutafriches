import {
  TypeProprietaire,
  TerrainViabilise,
  EtatBatiInfrastructure,
  PresencePollution,
  ValeurArchitecturale,
  QualitePaysage,
  QualiteVoieDesserte,
  RisqueNaturel,
  ZonageEnvironnemental,
  ZonageReglementaire,
  ZonagePatrimonial,
  TrameVerteEtBleue,
} from "@mutafriches/shared-types";

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
          <div className="fr-col-12 fr-col-md-6">
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

          <div className="fr-col-12 fr-col-md-6">
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

      {/* Section Surfaces et propriété */}
      <fieldset className="fr-fieldset fr-fieldset--inline fr-mb-3w">
        <legend className="fr-fieldset__legend fr-text--medium">Surfaces et propriété</legend>

        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-12 fr-col-md-4">
            <div className="fr-input-group">
              <label className="fr-label" htmlFor="surfaceSite">
                Surface du site (m²) *
              </label>
              <input
                className="fr-input"
                type="number"
                id="surfaceSite"
                value={formData.surfaceSite || ""}
                onChange={(e) => handleInputChange("surfaceSite", parseInt(e.target.value) || 0)}
                disabled={!isEditable}
                required
              />
            </div>
          </div>

          <div className="fr-col-12 fr-col-md-4">
            <div className="fr-input-group">
              <label className="fr-label" htmlFor="surfaceBati">
                Surface bâtie (m²)
              </label>
              <input
                className="fr-input"
                type="number"
                id="surfaceBati"
                value={formData.surfaceBati || ""}
                onChange={(e) => handleInputChange("surfaceBati", parseInt(e.target.value) || 0)}
                disabled={!isEditable}
              />
            </div>
          </div>

          <div className="fr-col-12 fr-col-md-4">
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
                <option value={TypeProprietaire.PUBLIC}>Public</option>
                <option value={TypeProprietaire.PRIVE}>Privé</option>
                <option value={TypeProprietaire.MIXTE}>Mixte</option>
                <option value={TypeProprietaire.COPRO_INDIVISION}>Copro/Indivision</option>
                <option value={TypeProprietaire.NE_SAIT_PAS}>Ne sait pas</option>
              </select>
            </div>
          </div>
        </div>
      </fieldset>

      {/* Section État du site */}
      <fieldset className="fr-fieldset fr-fieldset--inline fr-mb-3w">
        <legend className="fr-fieldset__legend fr-text--medium">État du site</legend>

        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-12 fr-col-md-6">
            <div className="fr-select-group">
              <label className="fr-label" htmlFor="etatBatiInfrastructure">
                État du bâti et infrastructure
              </label>
              <select
                className="fr-select"
                id="etatBatiInfrastructure"
                value={formData.etatBatiInfrastructure || ""}
                onChange={(e) => handleInputChange("etatBatiInfrastructure", e.target.value)}
                disabled={!isEditable}
              >
                <option value="">-- Sélectionner --</option>
                <option value={EtatBatiInfrastructure.DEGRADATION_HETEROGENE}>
                  Bâtiments hétérogènes
                </option>
                <option value={EtatBatiInfrastructure.DEGRADATION_TRES_IMPORTANTE}>
                  Dégradation très importante
                </option>
                <option value={EtatBatiInfrastructure.DEGRADATION_MOYENNE}>
                  Dégradation moyenne
                </option>
                <option value={EtatBatiInfrastructure.DEGRADATION_INEXISTANTE}>
                  Dégradation inexistante
                </option>
                <option value={EtatBatiInfrastructure.NE_SAIT_PAS}>Ne sait pas</option>
              </select>
            </div>
          </div>

          <div className="fr-col-12 fr-col-md-6">
            <div className="fr-select-group">
              <label className="fr-label" htmlFor="presencePollution">
                Présence de pollution
              </label>
              <select
                className="fr-select"
                id="presencePollution"
                value={formData.presencePollution || ""}
                onChange={(e) => handleInputChange("presencePollution", e.target.value)}
                disabled={!isEditable}
              >
                <option value="">-- Sélectionner --</option>
                <option value={PresencePollution.NON}>Non</option>
                <option value={PresencePollution.OUI_COMPOSES_VOLATILS}>
                  Oui - Composés volatils
                </option>
                <option value={PresencePollution.OUI_AUTRES_COMPOSES}>Oui - Autres composés</option>
                <option value={PresencePollution.DEJA_GEREE}>Déjà gérée</option>
                <option value={PresencePollution.NE_SAIT_PAS}>Ne sait pas</option>
              </select>
            </div>
          </div>

          <div className="fr-col-12 fr-col-md-6">
            <div className="fr-select-group">
              <label className="fr-label" htmlFor="terrainViabilise">
                Terrain viabilisé
              </label>
              <select
                className="fr-select"
                id="terrainViabilise"
                value={formData.terrainViabilise || ""}
                onChange={(e) => handleInputChange("terrainViabilise", e.target.value)}
                disabled={!isEditable}
              >
                <option value="">-- Sélectionner --</option>
                <option value={TerrainViabilise.OUI}>Oui</option>
                <option value={TerrainViabilise.NON}>Non</option>
                <option value={TerrainViabilise.NE_SAIT_PAS}>Ne sait pas</option>
              </select>
            </div>
          </div>

          <div className="fr-col-12 fr-col-md-6">
            <div className="fr-select-group">
              <label className="fr-label" htmlFor="qualiteVoieDesserte">
                Qualité de la voie de desserte
              </label>
              <select
                className="fr-select"
                id="qualiteVoieDesserte"
                value={formData.qualiteVoieDesserte || ""}
                onChange={(e) => handleInputChange("qualiteVoieDesserte", e.target.value)}
                disabled={!isEditable}
              >
                <option value="">-- Sélectionner --</option>
                <option value={QualiteVoieDesserte.ACCESSIBLE}>Accessible</option>
                <option value={QualiteVoieDesserte.PEU_ACCESSIBLE}>Peu accessible</option>
                <option value={QualiteVoieDesserte.DEGRADEE}>Dégradée</option>
                <option value={QualiteVoieDesserte.NE_SAIT_PAS}>Ne sait pas</option>
              </select>
            </div>
          </div>
        </div>
      </fieldset>

      {/* Section Localisation et accessibilité */}
      <fieldset className="fr-fieldset fr-fieldset--inline fr-mb-3w">
        <legend className="fr-fieldset__legend fr-text--medium">
          Localisation et accessibilité
        </legend>

        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-12 fr-col-md-6">
            <div className="fr-checkbox-group">
              <input
                type="checkbox"
                id="siteEnCentreVille"
                checked={formData.siteEnCentreVille || false}
                onChange={(e) => handleInputChange("siteEnCentreVille", e.target.checked)}
                disabled={!isEditable}
              />
              <label className="fr-label" htmlFor="siteEnCentreVille">
                En centre-ville/centre-bourg
              </label>
            </div>
          </div>

          <div className="fr-col-12 fr-col-md-6">
            <div className="fr-checkbox-group">
              <input
                type="checkbox"
                id="proximiteCommercesServices"
                checked={formData.proximiteCommercesServices || false}
                onChange={(e) => handleInputChange("proximiteCommercesServices", e.target.checked)}
                disabled={!isEditable}
              />
              <label className="fr-label" htmlFor="proximiteCommercesServices">
                Commerces/services à proximité
              </label>
            </div>
          </div>

          <div className="fr-col-12 fr-col-md-4">
            <div className="fr-input-group">
              <label className="fr-label" htmlFor="distanceAutoroute">
                Distance autoroute (km)
              </label>
              <input
                className="fr-input"
                type="number"
                step="0.1"
                id="distanceAutoroute"
                value={formData.distanceAutoroute || ""}
                onChange={(e) =>
                  handleInputChange("distanceAutoroute", parseFloat(e.target.value) || 0)
                }
                disabled={!isEditable}
              />
            </div>
          </div>

          <div className="fr-col-12 fr-col-md-4">
            <div className="fr-input-group">
              <label className="fr-label" htmlFor="distanceTransportCommun">
                Distance transport (m)
              </label>
              <input
                className="fr-input"
                type="number"
                id="distanceTransportCommun"
                value={formData.distanceTransportCommun || ""}
                onChange={(e) =>
                  handleInputChange("distanceTransportCommun", parseFloat(e.target.value) || 0)
                }
                disabled={!isEditable}
              />
            </div>
          </div>

          <div className="fr-col-12 fr-col-md-4">
            <div className="fr-input-group">
              <label className="fr-label" htmlFor="distanceRaccordementElectrique">
                Distance raccordement BT/HT (km)
              </label>
              <input
                className="fr-input"
                type="number"
                step="0.1"
                id="distanceRaccordementElectrique"
                value={formData.distanceRaccordementElectrique || ""}
                onChange={(e) =>
                  handleInputChange(
                    "distanceRaccordementElectrique",
                    parseFloat(e.target.value) || 0,
                  )
                }
                disabled={!isEditable}
              />
            </div>
          </div>

          <div className="fr-col-12">
            <div className="fr-input-group">
              <label className="fr-label" htmlFor="tauxLogementsVacants">
                Taux de logements vacants (%)
              </label>
              <input
                className="fr-input"
                type="number"
                step="0.1"
                id="tauxLogementsVacants"
                value={formData.tauxLogementsVacants || ""}
                onChange={(e) =>
                  handleInputChange("tauxLogementsVacants", parseFloat(e.target.value) || 0)
                }
                disabled={!isEditable}
              />
            </div>
          </div>
        </div>
      </fieldset>

      {/* Section Zonages et contraintes */}
      <fieldset className="fr-fieldset fr-fieldset--inline fr-mb-3w">
        <legend className="fr-fieldset__legend fr-text--medium">
          Zonages et contraintes réglementaires
        </legend>

        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-12 fr-col-md-6">
            <div className="fr-select-group">
              <label className="fr-label" htmlFor="zonageReglementaire">
                Zonage PLU(I) / Carte communale
              </label>
              <select
                className="fr-select"
                id="zonageReglementaire"
                value={formData.zonageReglementaire || ""}
                onChange={(e) => handleInputChange("zonageReglementaire", e.target.value)}
                disabled={!isEditable}
              >
                <option value="">-- Sélectionner --</option>
                <option value={ZonageReglementaire.ZONE_URBAINE_U}>Zone urbaine (U)</option>
                <option value={ZonageReglementaire.ZONE_NATURELLE}>Zone naturelle (N)</option>
                <option value={ZonageReglementaire.ZONE_AGRICOLE}>Zone agricole (A)</option>
                <option value={ZonageReglementaire.ZONE_A_URBANISER_AU}>
                  Zone à urbaniser (AU)
                </option>
                <option value={ZonageReglementaire.ZONE_ACTIVITES}>Zone d'activités</option>
                <option value={ZonageReglementaire.ZONE_ACCELERATION_ENR}>
                  Zone d'accélération ENR
                </option>
                <option value={ZonageReglementaire.CONSTRUCTIBLE}>Constructible</option>
                <option value={ZonageReglementaire.NON_CONSTRUCTIBLE}>Non constructible</option>
              </select>
            </div>
          </div>

          <div className="fr-col-12 fr-col-md-6">
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
                <option value={RisqueNaturel.AUCUN}>Aucun</option>
                <option value={RisqueNaturel.FAIBLE}>Faible</option>
                <option value={RisqueNaturel.MOYEN}>Moyen</option>
                <option value={RisqueNaturel.FORT}>Fort</option>
              </select>
            </div>
          </div>

          <div className="fr-col-12 fr-col-md-6">
            <div className="fr-checkbox-group">
              <input
                type="checkbox"
                id="presenceRisquesTechnologiques"
                checked={formData.presenceRisquesTechnologiques || false}
                onChange={(e) =>
                  handleInputChange("presenceRisquesTechnologiques", e.target.checked)
                }
                disabled={!isEditable}
              />
              <label className="fr-label" htmlFor="presenceRisquesTechnologiques">
                Présence de risques technologiques
              </label>
            </div>
          </div>

          <div className="fr-col-12 fr-col-md-6">
            <div className="fr-select-group">
              <label className="fr-label" htmlFor="zonagePatrimonial">
                Zonage patrimonial
              </label>
              <select
                className="fr-select"
                id="zonagePatrimonial"
                value={formData.zonagePatrimonial || ""}
                onChange={(e) => handleInputChange("zonagePatrimonial", e.target.value)}
                disabled={!isEditable}
              >
                <option value="">-- Sélectionner --</option>
                <option value={ZonagePatrimonial.NON_CONCERNE}>Non concerné</option>
                <option value={ZonagePatrimonial.MONUMENT_HISTORIQUE}>Monument historique</option>
                <option value={ZonagePatrimonial.SITE_INSCRIT_CLASSE}>Site inscrit/classé</option>
                <option value={ZonagePatrimonial.PERIMETRE_ABF}>Périmètre ABF</option>
                <option value={ZonagePatrimonial.ZPPAUP}>ZPPAUP</option>
                <option value={ZonagePatrimonial.AVAP}>AVAP</option>
                <option value={ZonagePatrimonial.SPR}>SPR</option>
              </select>
            </div>
          </div>
        </div>
      </fieldset>

      {/* Section Patrimoine et paysage */}
      <fieldset className="fr-fieldset fr-fieldset--inline fr-mb-3w">
        <legend className="fr-fieldset__legend fr-text--medium">Patrimoine et paysage</legend>

        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-12 fr-col-md-6">
            <div className="fr-select-group">
              <label className="fr-label" htmlFor="valeurArchitecturaleHistorique">
                Valeur architecturale et/ou histoire sociale
              </label>
              <select
                className="fr-select"
                id="valeurArchitecturaleHistorique"
                value={formData.valeurArchitecturaleHistorique || ""}
                onChange={(e) =>
                  handleInputChange("valeurArchitecturaleHistorique", e.target.value)
                }
                disabled={!isEditable}
              >
                <option value="">-- Sélectionner --</option>
                <option value={ValeurArchitecturale.EXCEPTIONNEL}>Exceptionnel</option>
                <option value={ValeurArchitecturale.INTERET_FORT}>Intérêt fort</option>
                <option value={ValeurArchitecturale.ORDINAIRE}>Ordinaire</option>
                <option value={ValeurArchitecturale.BANAL_INFRA_ORDINAIRE}>
                  Banal / infra-ordinaire
                </option>
                <option value={ValeurArchitecturale.SANS_INTERET}>Sans intérêt</option>
                <option value={ValeurArchitecturale.NE_SAIT_PAS}>Ne sait pas</option>
              </select>
            </div>
          </div>

          <div className="fr-col-12 fr-col-md-6">
            <div className="fr-select-group">
              <label className="fr-label" htmlFor="qualitePaysage">
                Qualité du paysage
              </label>
              <select
                className="fr-select"
                id="qualitePaysage"
                value={formData.qualitePaysage || ""}
                onChange={(e) => handleInputChange("qualitePaysage", e.target.value)}
                disabled={!isEditable}
              >
                <option value="">-- Sélectionner --</option>
                <option value={QualitePaysage.REMARQUABLE}>Remarquable</option>
                <option value={QualitePaysage.INTERESSANT}>Intéressant</option>
                <option value={QualitePaysage.QUOTIDIEN_ORDINAIRE}>Quotidien ordinaire</option>
                <option value={QualitePaysage.BANAL_INFRA_ORDINAIRE}>
                  Banal / infra-ordinaire
                </option>
                <option value={QualitePaysage.DEGRADE}>Dégradé</option>
                <option value={QualitePaysage.NE_SAIT_PAS}>Ne sait pas</option>
              </select>
            </div>
          </div>
        </div>
      </fieldset>

      {/* Section Environnement et biodiversité */}
      <fieldset className="fr-fieldset fr-fieldset--inline fr-mb-3w">
        <legend className="fr-fieldset__legend fr-text--medium">
          Environnement et biodiversité
        </legend>

        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-12 fr-col-md-6">
            <div className="fr-select-group">
              <label className="fr-label" htmlFor="zonageEnvironnemental">
                Zonage environnemental
              </label>
              <select
                className="fr-select"
                id="zonageEnvironnemental"
                value={formData.zonageEnvironnemental || ""}
                onChange={(e) => handleInputChange("zonageEnvironnemental", e.target.value)}
                disabled={!isEditable}
              >
                <option value="">-- Sélectionner --</option>
                <option value={ZonageEnvironnemental.HORS_ZONE}>Hors zone</option>
                <option value={ZonageEnvironnemental.ZNIEFF_TYPE_1_2}>ZNIEFF Type 1 et 2</option>
                <option value={ZonageEnvironnemental.NATURA_2000}>Natura 2000</option>
                <option value={ZonageEnvironnemental.PARC_NATUREL_REGIONAL}>
                  Parc naturel régional
                </option>
                <option value={ZonageEnvironnemental.PARC_NATUREL_NATIONAL}>
                  Parc naturel national
                </option>
                <option value={ZonageEnvironnemental.RESERVE_NATURELLE}>Réserve naturelle</option>
                <option value={ZonageEnvironnemental.PROXIMITE_ZONE}>Proximité zone</option>
              </select>
            </div>
          </div>

          <div className="fr-col-12 fr-col-md-6">
            <div className="fr-select-group">
              <label className="fr-label" htmlFor="trameVerteEtBleue">
                Trame verte et bleue
              </label>
              <select
                className="fr-select"
                id="trameVerteEtBleue"
                value={formData.trameVerteEtBleue || ""}
                onChange={(e) => handleInputChange("trameVerteEtBleue", e.target.value)}
                disabled={!isEditable}
              >
                <option value="">-- Sélectionner --</option>
                <option value={TrameVerteEtBleue.HORS_TRAME}>Hors trame</option>
                <option value={TrameVerteEtBleue.RESERVOIR_BIODIVERSITE}>
                  Réservoir de biodiversité
                </option>
                <option value={TrameVerteEtBleue.CORRIDOR_A_RESTAURER}>Corridor à restaurer</option>
                <option value={TrameVerteEtBleue.CORRIDOR_A_PRESERVER}>Corridor à préserver</option>
                <option value={TrameVerteEtBleue.NE_SAIT_PAS}>Ne sait pas</option>
              </select>
            </div>
          </div>
        </div>
      </fieldset>

      {/* Affichage compact de tous les paramètres */}
      <details className="fr-mt-2w">
        <summary className="fr-text--sm">Voir tous les paramètres (debug)</summary>
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
