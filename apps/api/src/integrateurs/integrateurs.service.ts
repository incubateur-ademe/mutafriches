import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import {
  CANAUX_ACTIFS_A_LA_DECLARATION,
  CANAUX_AVEC_DOMAINE,
  CanalIntegrateur,
  StatutIntegrateur,
  type DeclarationIntegrateurInput,
  type DeclarationIntegrateurOutput,
} from "@mutafriches/shared-types";
import type { Integrateur, NewIntegrateur } from "../shared/database/schemas/integrateurs.schema";
import { BrevoContactsService } from "./adapters/brevo/brevo-contacts.service";
import { IntegrateursRegistreService } from "./integrateurs-registre.service";
import { IntegrateurRepository } from "./repositories/integrateur.repository";
import { cleStatsPourOrigine, normaliserDomaineDeclare } from "./utils/domaine-declare";

@Injectable()
export class IntegrateursService {
  private readonly logger = new Logger(IntegrateursService.name);

  constructor(
    private readonly repository: IntegrateurRepository,
    private readonly registre: IntegrateursRegistreService,
    private readonly brevo: BrevoContactsService,
  ) {}

  async declarer(input: DeclarationIntegrateurInput): Promise<DeclarationIntegrateurOutput> {
    const origine = this.origineDeclaree(input);
    const actifDesLaDeclaration = CANAUX_ACTIFS_A_LA_DECLARATION.includes(input.canal);
    const statutInitial = actifDesLaDeclaration
      ? StatutIntegrateur.ACTIF
      : StatutIntegrateur.EN_ATTENTE;

    // Robot : réponse plausible, rien d'écrit ni de transmis.
    if (input.telephone) {
      return { canal: input.canal, statut: statutInitial, origine, dejaDeclare: false };
    }

    // Une révocation vaut pour l'origine, quel que soit le canal : rien n'est créé ni transmis.
    if (origine && (await this.repository.estOrigineRevoquee(origine))) {
      this.logger.warn(`Déclaration ${input.canal} refusée : origine révoquée (${origine})`);
      return { canal: input.canal, statut: StatutIntegrateur.REVOQUE, origine, dejaDeclare: true };
    }

    const existant = origine
      ? await this.repository.trouverParCanalEtOrigine(input.canal, origine)
      : null;
    const integrateur = existant ?? (await this.creer(input, origine, statutInitial));

    if (!existant && actifDesLaDeclaration && origine) {
      this.registre.ajouterOrigine(origine);
    }

    await this.transmettreContact(input, integrateur);

    this.logger.log(
      `Déclaration ${input.canal} : ${integrateur.structure} (${origine ?? "sans domaine"}), ${existant ? "déjà déclarée" : integrateur.statut}`,
    );

    return {
      canal: integrateur.canal,
      statut: integrateur.statut,
      origine: integrateur.origine ?? undefined,
      dejaDeclare: existant !== null,
    };
  }

  private origineDeclaree(input: DeclarationIntegrateurInput): string | undefined {
    if (!CANAUX_AVEC_DOMAINE.includes(input.canal)) {
      return undefined;
    }

    const origine = normaliserDomaineDeclare(input.domaine ?? "");
    if (!origine) {
      throw new BadRequestException(
        "Domaine invalide : indiquez un nom de domaine public avec son extension, en https et sans port (exemple.fr)",
      );
    }
    return origine;
  }

  private async creer(
    input: DeclarationIntegrateurInput,
    origine: string | undefined,
    statut: StatutIntegrateur,
  ): Promise<Integrateur> {
    const actif = statut === StatutIntegrateur.ACTIF;
    const ligne: NewIntegrateur = {
      id: uuidv4(),
      canal: input.canal,
      structure: input.structure.trim(),
      typeStructure: input.typeStructure,
      origine: origine ?? null,
      // Une page ou une iframe reçoit sa clé à la publication.
      cleStats: actif && origine ? cleStatsPourOrigine(input.canal, origine) : null,
      statut,
      departement: input.canal === CanalIntegrateur.PAGE ? (input.departement ?? null) : null,
      nbSitesEstime: input.canal === CanalIntegrateur.PAGE ? (input.nbSitesEstime ?? null) : null,
      activeLe: actif ? new Date() : null,
    };

    const creee = await this.repository.creerSiAbsent(ligne);
    if (creee) {
      return creee;
    }

    // Déclaration concurrente du même domaine : l'autre requête a gagné, on relit sa ligne.
    const concurrente = origine
      ? await this.repository.trouverParCanalEtOrigine(input.canal, origine)
      : null;
    if (concurrente) {
      return concurrente;
    }

    // Clé de statistiques déjà portée par une autre origine du même hôte (reprise en http ou
    // sur un port) : l'origine est autorisée sans clé, ses appels se lisent sur l'autre ligne.
    const sansCle = await this.repository.creerSiAbsent({ ...ligne, cleStats: null });
    if (!sansCle) {
      throw new BadRequestException("Ce domaine est déjà déclaré pour un autre usage");
    }
    return sansCle;
  }

  // Sans réponse de Brevo, la déclaration tient quand même : la ligne garde
  // `contact_enregistre = false` et le déclarant n'est pas joignable.
  private async transmettreContact(
    input: DeclarationIntegrateurInput,
    integrateur: Integrateur,
  ): Promise<void> {
    const resultat = await this.brevo.ajouterContact({
      prenom: input.prenom.trim(),
      nom: input.nom.trim(),
      email: input.email,
      canal: input.canal,
      structure: integrateur.structure,
      typeStructure: input.typeStructure,
      domaine: integrateur.origine ? new URL(integrateur.origine).hostname : undefined,
    });

    if (resultat.success && !integrateur.contactEnregistre) {
      await this.repository.marquerContactEnregistre(integrateur.id);
    }
  }
}
