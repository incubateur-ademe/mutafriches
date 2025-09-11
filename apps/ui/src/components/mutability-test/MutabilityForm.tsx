import React from "react";
import { useState, useEffect } from "react";
import { TestCase, convertTestCaseToMutabilityInput } from "@mutafriches/shared-types";

interface MutabilityFormProps {
  selectedTestCase: TestCase | null;
  onFormSubmit: (data: any) => void;
  isLoading?: boolean;
}

export function MutabilityForm({
  selectedTestCase,
  onFormSubmit,
  isLoading = false,
}: MutabilityFormProps) {
  const [formData, setFormData] = useState<any>({});
  const [isManualEntry, setIsManualEntry] = useState(false);

  // Charger les données du cas de test sélectionné
  useEffect(() => {
    if (selectedTestCase) {
      const convertedData = convertTestCaseToMutabilityInput(selectedTestCase);
      setFormData(convertedData);
      setIsManualEntry(false);
    }
  }, [selectedTestCase]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFormSubmit(formData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setFormData({});
    setIsManualEntry(true);
  };

  return (
    <div className="fr-card fr-p-4w">
      <div className="fr-card__body">
        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-12 fr-col-md-6">
            <h2 className="fr-card__title fr-mb-3w">Données de la friche</h2>
          </div>
          <div className="fr-col-12 fr-col-md-6 fr-text--right">
            {selectedTestCase && !isManualEntry && (
              <button
                className="fr-btn fr-btn--secondary fr-btn--sm fr-mr-2w"
                type="button"
                onClick={() => setIsManualEntry(true)}
              >
                Modifier les données
              </button>
            )}
            <button
              className="fr-btn fr-btn--tertiary fr-btn--sm"
              type="button"
              onClick={resetForm}
            >
              Saisie manuelle
            </button>
          </div>
        </div>

        {/* Mode de saisie indicator */}
        <div className="fr-mb-3w">
          {selectedTestCase && !isManualEntry ? (
            <div className="fr-badge fr-badge--info">
              Données du cas de test : {selectedTestCase.name}
            </div>
          ) : (
            <div className="fr-badge fr-badge--new">Saisie manuelle</div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Section Identifiants */}
          <fieldset className="fr-fieldset fr-mb-4w">
            <legend className="fr-fieldset__legend fr-text--lead">Informations générales</legend>

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
                    placeholder="Ex: 50147000AR0010"
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
                    placeholder="Ex: Trélazé"
                  />
                </div>
              </div>
            </div>
          </fieldset>

          {/* Section Surfaces */}
          <fieldset className="fr-fieldset fr-mb-4w">
            <legend className="fr-fieldset__legend fr-text--lead">Surfaces et propriété</legend>

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
                    onChange={(e) => handleInputChange("surfaceSite", parseInt(e.target.value))}
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
                    onChange={(e) => handleInputChange("surfaceBati", parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="fr-col-12 fr-col-md-4">
                <div className="fr-input-group">
                  <label className="fr-label" htmlFor="nombreBatiments">
                    Nombre de bâtiments
                  </label>
                  <input
                    className="fr-input"
                    type="number"
                    id="nombreBatiments"
                    value={formData.nombreBatiments || ""}
                    onChange={(e) => handleInputChange("nombreBatiments", parseInt(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <div className="fr-grid-row fr-grid-row--gutters fr-mt-3w">
              <div className="fr-col-12 fr-col-md-6">
                <div className="fr-select-group">
                  <label className="fr-label" htmlFor="typeProprietaire">
                    Type de propriétaire
                  </label>
                  <select
                    className="fr-select"
                    id="typeProprietaire"
                    value={formData.typeProprietaire || ""}
                    onChange={(e) => handleInputChange("typeProprietaire", e.target.value)}
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
          <fieldset className="fr-fieldset fr-mb-4w">
            <legend className="fr-fieldset__legend fr-text--lead">État du site</legend>

            <div className="fr-grid-row fr-grid-row--gutters">
              <div className="fr-col-12 fr-col-md-4">
                <div className="fr-select-group">
                  <label className="fr-label" htmlFor="etatBatiInfrastructure">
                    État du bâti et infrastructure
                  </label>
                  <select
                    className="fr-select"
                    id="etatBatiInfrastructure"
                    value={formData.etatBatiInfrastructure || ""}
                    onChange={(e) => handleInputChange("etatBatiInfrastructure", e.target.value)}
                  >
                    <option value="">-- Sélectionner --</option>
                    <option value="BATIMENTS_HETEROGENES">Bâtiments hétérogènes</option>
                    <option value="BATIMENTS_HOMOGENES">Bâtiments homogènes</option>
                    <option value="ABSENCE_BATIMENTS">Absence de bâtiments</option>
                  </select>
                </div>
              </div>

              <div className="fr-col-12 fr-col-md-4">
                <div className="fr-select-group">
                  <label className="fr-label" htmlFor="presencePollution">
                    Présence de pollution
                  </label>
                  <select
                    className="fr-select"
                    id="presencePollution"
                    value={formData.presencePollution || ""}
                    onChange={(e) => handleInputChange("presencePollution", e.target.value)}
                  >
                    <option value="">-- Sélectionner --</option>
                    <option value="NON">Non</option>
                    <option value="OUI_HYDROCARBURES">Oui - Hydrocarbures</option>
                    <option value="OUI_AUTRES_COMPOSES">Oui - Autres composés</option>
                    <option value="NE_SAIT_PAS">Ne sait pas</option>
                  </select>
                </div>
              </div>

              <div className="fr-col-12 fr-col-md-4">
                <div className="fr-checkbox-group">
                  <input
                    type="checkbox"
                    id="terrainViabilise"
                    checked={formData.terrainViabilise || false}
                    onChange={(e) => handleInputChange("terrainViabilise", e.target.checked)}
                  />
                  <label className="fr-label" htmlFor="terrainViabilise">
                    Terrain viabilisé
                  </label>
                </div>
              </div>
            </div>
          </fieldset>

          {/* Section Localisation et accessibilité */}
          <fieldset className="fr-fieldset fr-mb-4w">
            <legend className="fr-fieldset__legend fr-text--lead">
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
                  />
                  <label className="fr-label" htmlFor="siteEnCentreVille">
                    Site en centre-ville ou centre-bourg
                  </label>
                </div>
              </div>

              <div className="fr-col-12 fr-col-md-6">
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
                      handleInputChange("tauxLogementsVacants", parseFloat(e.target.value))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="fr-grid-row fr-grid-row--gutters fr-mt-3w">
              <div className="fr-col-12 fr-col-md-4">
                <div className="fr-select-group">
                  <label className="fr-label" htmlFor="qualiteVoieDesserte">
                    Qualité de la voie de desserte
                  </label>
                  <select
                    className="fr-select"
                    id="qualiteVoieDesserte"
                    value={formData.qualiteVoieDesserte || ""}
                    onChange={(e) => handleInputChange("qualiteVoieDesserte", e.target.value)}
                  >
                    <option value="">-- Sélectionner --</option>
                    <option value="ACCESSIBLE">Accessible</option>
                    <option value="PEU_ACCESSIBLE">Peu accessible</option>
                    <option value="DIFFICILEMENT_ACCESSIBLE">Difficilement accessible</option>
                  </select>
                </div>
              </div>

              <div className="fr-col-12 fr-col-md-4">
                <div className="fr-select-group">
                  <label className="fr-label" htmlFor="distanceAutoroute">
                    Distance d'une entrée d'autoroute
                  </label>
                  <select
                    className="fr-select"
                    id="distanceAutoroute"
                    value={formData.distanceAutoroute || ""}
                    onChange={(e) => handleInputChange("distanceAutoroute", e.target.value)}
                  >
                    <option value="">-- Sélectionner --</option>
                    <option value="MOINS_DE_1KM">Moins de 1km</option>
                    <option value="ENTRE_1_ET_2KM">Entre 1 et 2km</option>
                    <option value="ENTRE_2_ET_5KM">Entre 2 et 5km</option>
                    <option value="PLUS_DE_5KM">Plus de 5km</option>
                  </select>
                </div>
              </div>

              <div className="fr-col-12 fr-col-md-4">
                <div className="fr-select-group">
                  <label className="fr-label" htmlFor="distanceTransportCommun">
                    Distance transport en commun
                  </label>
                  <select
                    className="fr-select"
                    id="distanceTransportCommun"
                    value={formData.distanceTransportCommun || ""}
                    onChange={(e) => handleInputChange("distanceTransportCommun", e.target.value)}
                  >
                    <option value="">-- Sélectionner --</option>
                    <option value="MOINS_DE_500M">Moins de 500m</option>
                    <option value="PLUS_DE_500M">Plus de 500m</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="fr-grid-row fr-grid-row--gutters fr-mt-3w">
              <div className="fr-col-12 fr-col-md-6">
                <div className="fr-checkbox-group">
                  <input
                    type="checkbox"
                    id="proximiteCommercesServices"
                    checked={formData.proximiteCommercesServices || false}
                    onChange={(e) =>
                      handleInputChange("proximiteCommercesServices", e.target.checked)
                    }
                  />
                  <label className="fr-label" htmlFor="proximiteCommercesServices">
                    Commerces / services à proximité
                  </label>
                </div>
              </div>

              <div className="fr-col-12 fr-col-md-6">
                <div className="fr-checkbox-group">
                  <input
                    type="checkbox"
                    id="connectionReseauElectricite"
                    checked={formData.connectionReseauElectricite || false}
                    onChange={(e) =>
                      handleInputChange("connectionReseauElectricite", e.target.checked)
                    }
                  />
                  <label className="fr-label" htmlFor="connectionReseauElectricite">
                    Connexion au réseau électrique
                  </label>
                </div>
              </div>
            </div>
          </fieldset>

          {/* Section Zonages et contraintes */}
          <fieldset className="fr-fieldset fr-mb-4w">
            <legend className="fr-fieldset__legend fr-text--lead">Zonages et contraintes</legend>

            <div className="fr-grid-row fr-grid-row--gutters">
              <div className="fr-col-12 fr-col-md-6">
                <div className="fr-select-group">
                  <label className="fr-label" htmlFor="zonageReglementaire">
                    Zonage réglementaire (PLU)
                  </label>
                  <select
                    className="fr-select"
                    id="zonageReglementaire"
                    value={formData.zonageReglementaire || ""}
                    onChange={(e) => handleInputChange("zonageReglementaire", e.target.value)}
                  >
                    <option value="">-- Sélectionner --</option>
                    <option value="ZONE_URBAINE_U">Zone urbaine (U)</option>
                    <option value="ZONE_NATURELLE">Zone naturelle (N)</option>
                    <option value="ZONE_AGRICOLE">Zone agricole (A)</option>
                    <option value="ZONE_ECONOMIQUE">Zone économique</option>
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

            <div className="fr-grid-row fr-grid-row--gutters fr-mt-3w">
              <div className="fr-col-12 fr-col-md-6">
                <div className="fr-checkbox-group">
                  <input
                    type="checkbox"
                    id="presenceRisquesTechnologiques"
                    checked={formData.presenceRisquesTechnologiques || false}
                    onChange={(e) =>
                      handleInputChange("presenceRisquesTechnologiques", e.target.checked)
                    }
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
                  >
                    <option value="">-- Sélectionner --</option>
                    <option value="NON_CONCERNE">Non concerné</option>
                    <option value="MONUMENT_HISTORIQUE">Monument historique</option>
                    <option value="SITE_CLASSE">Site classé</option>
                    <option value="SECTEUR_SAUVEGARDE">Secteur sauvegardé</option>
                  </select>
                </div>
              </div>
            </div>
          </fieldset>

          {/* Section Qualités paysagères et architecturales */}
          <fieldset className="fr-fieldset fr-mb-4w">
            <legend className="fr-fieldset__legend fr-text--lead">
              Qualités paysagères et architecturales
            </legend>

            <div className="fr-grid-row fr-grid-row--gutters">
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
                  >
                    <option value="">-- Sélectionner --</option>
                    <option value="EXCEPTIONNEL">Exceptionnel</option>
                    <option value="INTERESSANT">Intéressant</option>
                    <option value="BANAL_INFRA_ORDINAIRE">Banal / infra-ordinaire</option>
                    <option value="DEGRADE">Dégradé</option>
                  </select>
                </div>
              </div>

              <div className="fr-col-12 fr-col-md-6">
                <div className="fr-select-group">
                  <label className="fr-label" htmlFor="valeurArchitecturaleHistorique">
                    Valeur architecturale et historique
                  </label>
                  <select
                    className="fr-select"
                    id="valeurArchitecturaleHistorique"
                    value={formData.valeurArchitecturaleHistorique || ""}
                    onChange={(e) =>
                      handleInputChange("valeurArchitecturaleHistorique", e.target.value)
                    }
                  >
                    <option value="">-- Sélectionner --</option>
                    <option value="EXCEPTIONNEL">Exceptionnel</option>
                    <option value="INTERET_FORT">Intérêt fort</option>
                    <option value="INTERET_MOYEN">Intérêt moyen</option>
                    <option value="PEU_DINTERET">Peu d'intérêt</option>
                  </select>
                </div>
              </div>
            </div>
          </fieldset>

          {/* Section Environnement et biodiversité */}
          <fieldset className="fr-fieldset fr-mb-4w">
            <legend className="fr-fieldset__legend fr-text--lead">
              Environnement et biodiversité
            </legend>

            <div className="fr-grid-row fr-grid-row--gutters">
              <div className="fr-col-12 fr-col-md-4">
                <div className="fr-select-group">
                  <label className="fr-label" htmlFor="zonageEnvironnemental">
                    Zonage environnemental
                  </label>
                  <select
                    className="fr-select"
                    id="zonageEnvironnemental"
                    value={formData.zonageEnvironnemental || ""}
                    onChange={(e) => handleInputChange("zonageEnvironnemental", e.target.value)}
                  >
                    <option value="">-- Sélectionner --</option>
                    <option value="HORS_ZONE">Hors zone</option>
                    <option value="ZNIEFF_TYPE_1_2">ZNIEFF type 1 ou 2</option>
                    <option value="NATURA_2000">Natura 2000</option>
                    <option value="PARC_NATIONAL">Parc national</option>
                  </select>
                </div>
              </div>

              <div className="fr-col-12 fr-col-md-4">
                <div className="fr-select-group">
                  <label className="fr-label" htmlFor="trameVerteEtBleue">
                    Trame verte et bleue
                  </label>
                  <select
                    className="fr-select"
                    id="trameVerteEtBleue"
                    value={formData.trameVerteEtBleue || ""}
                    onChange={(e) => handleInputChange("trameVerteEtBleue", e.target.value)}
                  >
                    <option value="">-- Sélectionner --</option>
                    <option value="HORS_TRAME">Hors trame</option>
                    <option value="CORRIDOR_ECOLOGIQUE">Corridor écologique</option>
                    <option value="RESERVOIR_BIODIVERSITE">Réservoir de biodiversité</option>
                    <option value="NE_SAIT_PAS">Ne sait pas</option>
                  </select>
                </div>
              </div>

              <div className="fr-col-12 fr-col-md-4">
                <div className="fr-input-group">
                  <label className="fr-label" htmlFor="presenceEspeceProtegee">
                    Présence d'espèces protégées
                  </label>
                  <input
                    className="fr-input"
                    type="text"
                    id="presenceEspeceProtegee"
                    value={formData.presenceEspeceProtegee || ""}
                    onChange={(e) => handleInputChange("presenceEspeceProtegee", e.target.value)}
                    placeholder="Ex: non, oui, ne sait pas"
                  />
                </div>
              </div>
            </div>
          </fieldset>

          {/* Bouton de soumission */}
          <div className="fr-mt-4w">
            <button
              className="fr-btn fr-btn--primary"
              type="submit"
              disabled={isLoading || !formData.surfaceSite}
            >
              {isLoading ? "Calcul en cours..." : "Calculer la mutabilité"}
            </button>

            {!formData.surfaceSite && (
              <p className="fr-error-text fr-mt-1w">La surface du site est obligatoire</p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
