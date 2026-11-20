import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { CanalIntegrateur, type TypeStructure } from "@mutafriches/shared-types";
import { ApiResponse } from "../../../enrichissement/adapters/shared/api-response.types";
import { AppConfig } from "../../../config";

export const BREVO_CONTACTS_URL = "https://api.brevo.com/v3/contacts";
export const BREVO_TIMEOUT_MS = 10_000;
const SOURCE = "Brevo";

// Un attribut booléen par canal, à créer dans Brevo. Une mise à jour ne touche que les
// attributs transmis : un contact qui déclare l'API puis l'extension QGIS cumule les deux,
// là où un attribut unique serait écrasé.
export const ATTRIBUT_USAGE_BREVO: Record<CanalIntegrateur, string> = {
  [CanalIntegrateur.API]: "USAGE_API",
  [CanalIntegrateur.QGIS]: "USAGE_QGIS",
  [CanalIntegrateur.PAGE]: "USAGE_PAGE",
  [CanalIntegrateur.IFRAME]: "USAGE_IFRAME",
};

export interface ContactDeclarant {
  email: string;
  canal: CanalIntegrateur;
  structure: string;
  typeStructure: TypeStructure;
  domaine?: string;
}

// Transmet le contact d'un déclarant à Brevo, seul endroit où son adresse est conservée
// (ADR-0055). L'adresse n'est jamais journalisée.
@Injectable()
export class BrevoContactsService {
  private readonly logger = new Logger(BrevoContactsService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly config: AppConfig,
  ) {}

  async ajouterContact(contact: ContactDeclarant): Promise<ApiResponse<void>> {
    const { apiKey, listeId } = this.config.brevo;

    if (!apiKey || !listeId) {
      this.logger.warn(`Brevo non configuré : contact ${contact.canal} non transmis`);
      return { success: false, error: "Brevo non configuré", source: SOURCE };
    }

    const startTime = Date.now();
    try {
      // Les attributs doivent exister côté Brevo : un attribut inconnu est ignoré sans erreur.
      await firstValueFrom(
        this.httpService.post(
          BREVO_CONTACTS_URL,
          {
            email: contact.email,
            attributes: {
              STRUCTURE: contact.structure,
              TYPE_STRUCTURE: contact.typeStructure,
              ...(contact.domaine ? { DOMAINE: contact.domaine } : {}),
              [ATTRIBUT_USAGE_BREVO[contact.canal]]: true,
            },
            listIds: [listeId],
            updateEnabled: true,
          },
          { headers: { "api-key": apiKey }, timeout: BREVO_TIMEOUT_MS },
        ),
      );
      return { success: true, source: SOURCE, responseTimeMs: Date.now() - startTime };
    } catch (error: unknown) {
      // Le message Axios ne contient ni le corps ni les en-têtes de la requête.
      const message = (error as Error).message;
      this.logger.warn(`Erreur Brevo (canal ${contact.canal}) : ${message}`);
      return {
        success: false,
        error: message,
        source: SOURCE,
        responseTimeMs: Date.now() - startTime,
      };
    }
  }
}
