import { Injectable } from '@nestjs/common';
import { DataWithSource, FormSessionData } from '../dto/form-session.dto';
import { ParcelleBase } from 'src/friches/entities/shared/parcelle.base';
import { DataSource } from '../enums/form-session.enums';
import { MutabilityInputDto } from 'src/friches/dto/mutability-input.dto';
import { UiMutabilityResultDto } from '../dto/ui-mutability-result.dto';
import { SessionWithFormData } from '../interfaces/form-session.interfaces';

@Injectable()
export class FormSessionService {
  /**
   * Initialise une session de formulaire
   */
  initializeSession(session: SessionWithFormData): FormSessionData {
    if (!session.formData) {
      session.formData = {
        currentStep: 1,
        parcelleData: {},
        metadata: {
          createdAt: new Date(),
          lastUpdatedAt: new Date(),
          completionPercentage: 0,
          dataQualityScore: 0,
        },
      };
    }
    return session.formData;
  }

  /**
   * Sauvegarde les données d'enrichissement (étape 1)
   */
  saveEnrichmentData(
    session: SessionWithFormData,
    identifiantParcelle: string,
    enrichmentData: Record<string, string>,
  ): void {
    const formData = this.initializeSession(session);
    formData.identifiantParcelle = identifiantParcelle;

    // Mapping direct des données d'enrichissement
    this.savePropertyIfExists(
      formData,
      'commune',
      enrichmentData.commune,
      DataSource.ENRICHMENT,
    );
    this.savePropertyIfExists(
      formData,
      'surfaceSite',
      this.parseNumber(enrichmentData.surfaceParcelle),
      DataSource.ENRICHMENT,
    );
    this.savePropertyIfExists(
      formData,
      'surfaceBati',
      this.parseNumber(enrichmentData.surfaceBatie),
      DataSource.ENRICHMENT,
    );
    this.savePropertyIfExists(
      formData,
      'connectionReseauElectricite',
      this.parseBoolean(enrichmentData.connectionElectricite),
      DataSource.ENRICHMENT,
    );
    this.savePropertyIfExists(
      formData,
      'siteEnCentreVille',
      this.parseBoolean(enrichmentData.centreVille),
      DataSource.ENRICHMENT,
    );
    this.savePropertyIfExists(
      formData,
      'proximiteCommercesServices',
      this.parseBoolean(enrichmentData.proximiteCommerces),
      DataSource.ENRICHMENT,
    );
    this.savePropertyIfExists(
      formData,
      'presenceRisquesTechnologiques',
      this.parseBoolean(enrichmentData.risquesTechno),
      DataSource.ENRICHMENT,
    );

    formData.currentStep = 2;
    this.updateMetadata(formData);
  }

  /**
   * Sauvegarde les données manuelles (étape 2)
   */
  saveManualData(
    session: SessionWithFormData,
    manualData: Record<string, string>,
  ): void {
    console.log('=== DEBUG SAVE MANUAL DATA ===');

    const formData = this.initializeSession(session);
    console.log('Current step avant:', formData.currentStep);

    // Stockage direct des valeurs string pour éviter les problèmes de typage enum
    this.savePropertyIfExists(
      formData,
      'typeProprietaire',
      manualData.typeProprietaire,
      DataSource.MANUAL,
    );
    this.savePropertyIfExists(
      formData,
      'reseauEaux',
      manualData.reseauEaux,
      DataSource.MANUAL,
    );
    this.savePropertyIfExists(
      formData,
      'etatBatiInfrastructure',
      manualData.etatBati,
      DataSource.MANUAL,
    );
    this.savePropertyIfExists(
      formData,
      'presencePollution',
      manualData.presencePollution,
      DataSource.MANUAL,
    );
    this.savePropertyIfExists(
      formData,
      'valeurArchitecturaleHistorique',
      manualData.valeurArchitecturale,
      DataSource.MANUAL,
    );
    this.savePropertyIfExists(
      formData,
      'qualitePaysage',
      manualData.qualitePaysagere,
      DataSource.MANUAL,
    );
    this.savePropertyIfExists(
      formData,
      'qualiteVoieDesserte',
      manualData.qualiteDesserte,
      DataSource.MANUAL,
    );

    formData.currentStep = 3;
    console.log('Current step après:', formData.currentStep);

    this.updateMetadata(formData);
    console.log('Metadata updated');
  }

  /**
   * Compile les données pour l'API de mutabilité
   */
  compileMutabilityInput(
    session: SessionWithFormData,
  ): MutabilityInputDto | null {
    const formData = this.getSessionData(session);
    if (!formData) return null;

    const identifiant = formData.identifiantParcelle;
    const commune = this.getPropertyValue(formData, 'commune');
    const surfaceSite = this.getPropertyValue(formData, 'surfaceSite');

    // Validation des champs obligatoires
    if (!identifiant || !commune || !surfaceSite) {
      return null;
    }

    const input: MutabilityInputDto = {
      // Données automatiques (de EnrichmentResultDto)
      identifiantParcelle: identifiant,
      commune,
      surfaceSite,
      surfaceBati: this.getPropertyValue(formData, 'surfaceBati'),
      connectionReseauElectricite:
        this.getPropertyValue(formData, 'connectionReseauElectricite') || false,
      distanceRaccordementElectrique:
        this.getPropertyValue(formData, 'distanceRaccordementElectrique') || 0,
      siteEnCentreVille:
        this.getPropertyValue(formData, 'siteEnCentreVille') || false,
      distanceAutoroute:
        this.getPropertyValue(formData, 'distanceAutoroute') || 0,
      distanceTransportCommun:
        this.getPropertyValue(formData, 'distanceTransportCommun') || 0,
      proximiteCommercesServices:
        this.getPropertyValue(formData, 'proximiteCommercesServices') || false,
      tauxLogementsVacants:
        this.getPropertyValue(formData, 'tauxLogementsVacants') || 0,
      ancienneActivite: this.getPropertyValueAsString(
        formData,
        'ancienneActivite',
      ),
      presenceRisquesTechnologiques:
        this.getPropertyValue(formData, 'presenceRisquesTechnologiques') ||
        false,
      presenceRisquesNaturels: this.getPropertyValue(
        formData,
        'presenceRisquesNaturels',
      ),
      zonageEnvironnemental: this.getPropertyValue(
        formData,
        'zonageEnvironnemental',
      ),
      zonageReglementaire: this.getPropertyValue(
        formData,
        'zonageReglementaire',
      ),
      zonagePatrimonial: this.getPropertyValue(formData, 'zonagePatrimonial'),
      trameVerteEtBleue: this.getPropertyValue(formData, 'trameVerteEtBleue'),
      coordonnees: this.getPropertyValue(formData, 'coordonnees'),

      // Métadonnées requises pour EnrichmentResultDto
      sourcesUtilisees: ['Session utilisateur'], // Sources par défaut
      champsManquants: [], // À calculer si nécessaire
      fiabilite: Math.round(formData.metadata.dataQualityScore / 10),

      // Données manuelles (de ManualDataInputDto)
      typeProprietaire: this.getPropertyValue(formData, 'typeProprietaire'),
      reseauEaux: this.getPropertyValue(formData, 'reseauEaux'),
      etatBatiInfrastructure: this.getPropertyValue(
        formData,
        'etatBatiInfrastructure',
      ),
      presencePollution: this.getPropertyValue(formData, 'presencePollution'),
      valeurArchitecturaleHistorique: this.getPropertyValue(
        formData,
        'valeurArchitecturaleHistorique',
      ),
      qualitePaysage: this.getPropertyValue(formData, 'qualitePaysage'),
      qualiteVoieDesserte: this.getPropertyValue(
        formData,
        'qualiteVoieDesserte',
      ),

      // Session ID
      sessionId:
        typeof session.id === 'string' ? session.id : String(session.id),
    };

    // Sauvegarder l'input compilé
    formData.mutabilityInput = input;

    return input;
  }

  /**
   * Sauvegarde les résultats de mutabilité (étape 3)
   */
  saveMutabilityResult(
    session: SessionWithFormData,
    result: UiMutabilityResultDto,
  ): void {
    const formData = this.initializeSession(session);
    formData.mutabilityResult = result;
  }

  /**
   * Récupère les données de session
   */
  getSessionData(session: SessionWithFormData): FormSessionData | null {
    return session.formData || null;
  }

  canAccessStep(session: SessionWithFormData, requestedStep: number): boolean {
    console.log('=== DEBUG SESSION COMPLETE ===');
    console.log('Session object exists:', !!session);
    console.log('Session type:', typeof session);
    console.log('Session constructor:', session?.constructor?.name);
    console.log('Session ID:', session?.id);
    console.log('Session keys:', Object.keys(session || {}));
    console.log('Session full object:', JSON.stringify(session, null, 2));

    // Test d'écriture direct dans la session
    if (session) {
      console.log("Tentative d'écriture test dans session...");
      session.testProperty = 'test-value';
      console.log('Après écriture - testProperty:', session.testProperty);
    }

    const formData = this.getSessionData(session);
    console.log('formData exists:', !!formData);
    console.log('formData content:', formData);
    console.log('=== FIN DEBUG SESSION ===');

    if (!formData) {
      console.log('No formData, allowing step 1 only');
      return requestedStep === 1;
    }

    return formData.currentStep >= requestedStep;
  }

  /**
   * Réinitialise la session
   */
  resetSession(session: SessionWithFormData): void {
    delete session.formData;
  }

  /**
   * Résumé de la session pour debug/monitoring
   */
  getSessionSummary(session: SessionWithFormData): {
    step: number;
    completion: number;
    quality: number;
    hasResults: boolean;
  } {
    const formData = this.getSessionData(session);
    if (!formData) {
      return { step: 0, completion: 0, quality: 0, hasResults: false };
    }

    return {
      step: formData.currentStep,
      completion: formData.metadata.completionPercentage,
      quality: formData.metadata.dataQualityScore,
      hasResults: !!formData.mutabilityResult,
    };
  }

  /**
   * Sauvegarde une propriété si elle existe et n'est pas vide
   */
  private savePropertyIfExists(
    formData: FormSessionData,
    propertyName: string,
    value: unknown,
    source: DataSource,
  ): void {
    if (this.isValidValue(value)) {
      const propertyData: DataWithSource<unknown> = {
        value,
        source,
        confidence: this.getDefaultConfidence(source),
      };

      // Cast contrôlé car on maîtrise les noms de propriétés
      const parcelleDataRecord = formData.parcelleData as Record<
        string,
        DataWithSource<unknown>
      >;
      parcelleDataRecord[propertyName] = propertyData;
    }
  }

  /**
   * Vérifie si une valeur est valide (non null, non undefined, non vide)
   */
  private isValidValue(value: unknown): boolean {
    return value !== undefined && value !== null && value !== '';
  }

  /**
   * Récupère la valeur d'une propriété avec typage générique
   */
  private getPropertyValue<K extends keyof ParcelleBase>(
    formData: FormSessionData,
    property: K,
  ): ParcelleBase[K] | undefined {
    const parcelleDataRecord = formData.parcelleData as Record<
      string,
      DataWithSource<unknown>
    >;
    const propertyData = parcelleDataRecord[property as string];
    return propertyData?.value as ParcelleBase[K] | undefined;
  }

  /**
   * Récupère la valeur d'une propriété en tant que string
   */
  private getPropertyValueAsString(
    formData: FormSessionData,
    property: keyof ParcelleBase,
  ): string | undefined {
    const value = this.getPropertyValue(formData, property);
    if (value === null || value === undefined) {
      return undefined;
    }
    // Conversion vers string
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    return String(value);
  }

  /**
   * Parse un nombre depuis une chaîne
   */
  private parseNumber(value: string | undefined): number | undefined {
    if (!value || value === 'Non renseigné' || value === '') return undefined;
    const cleaned = value.replace(/[^\d.,]/g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? undefined : parsed;
  }

  /**
   * Parse un booléen depuis une chaîne
   */
  private parseBoolean(value: string | undefined): boolean {
    if (!value) return false;
    return value.toLowerCase() === 'oui' || value.toLowerCase() === 'true';
  }

  /**
   * Met à jour les métadonnées
   */
  private updateMetadata(formData: FormSessionData): void {
    formData.metadata.lastUpdatedAt = new Date();
    formData.metadata.completionPercentage = this.calculateCompletion(formData);
    formData.metadata.dataQualityScore = this.calculateQuality(formData);
  }

  /**
   * Calcule le taux de complétion
   */
  private calculateCompletion(formData: FormSessionData): number {
    const requiredFields: Array<keyof ParcelleBase> = [
      'commune',
      'surfaceSite',
      'connectionReseauElectricite',
      'siteEnCentreVille',
    ];

    const filledCount = requiredFields.filter(
      (field) => this.getPropertyValue(formData, field) !== undefined,
    ).length;

    return Math.round((filledCount / requiredFields.length) * 100);
  }

  /**
   * Calcule la qualité des données
   */
  private calculateQuality(formData: FormSessionData): number {
    const dataPoints = Object.values(formData.parcelleData);
    if (dataPoints.length === 0) return 0;

    const averageConfidence =
      dataPoints.reduce((sum, data) => {
        return sum + (data.confidence || 50);
      }, 0) / dataPoints.length;

    return Math.round(averageConfidence);
  }

  /**
   * Confiance par défaut selon la source
   */
  private getDefaultConfidence(source: DataSource): number {
    switch (source) {
      case DataSource.MANUAL:
        return 100;
      case DataSource.ENRICHMENT:
        return 80;
      case DataSource.COMPUTED:
        return 60;
      default:
        return 50;
    }
  }
}
