import { MutabilityResultDto } from "@mutafriches/shared-types";

// Types des messages échangés
export enum IframeMessageType {
  READY = "mutafriches:ready",
  COMPLETED = "mutafriches:completed",
  ERROR = "mutafriches:error",
  STEP_CHANGED = "mutafriches:step_changed",
}

export interface IframeMessage {
  type: IframeMessageType;
  data?: unknown;
  timestamp: number;
}

export interface ReadyMessage extends IframeMessage {
  type: IframeMessageType.READY;
  data: {
    version: string;
    integrator: string;
  };
}

export interface CompletedMessage extends IframeMessage {
  type: IframeMessageType.COMPLETED;
  data: {
    results: MutabilityResultDto;
    formData: Record<string, unknown>;
  };
}

export interface ErrorMessage extends IframeMessage {
  type: IframeMessageType.ERROR;
  data: {
    error: string;
    code?: string;
  };
}

export interface StepChangedMessage extends IframeMessage {
  type: IframeMessageType.STEP_CHANGED;
  data: {
    currentStep: number;
    totalSteps: number;
  };
}

// Classe pour gérer la communication iframe
export class IframeCommunicator {
  private targetOrigin: string;
  private debug: boolean;

  constructor(targetOrigin: string | null, debug = false) {
    this.targetOrigin = targetOrigin || "*";
    this.debug = debug;
  }

  // Envoyer un message au parent
  private postMessage(message: IframeMessage): void {
    if (!window.parent || window.parent === window) {
      if (this.debug) {
        console.log("Not in iframe, skipping message:", message);
      }
      return;
    }

    if (this.debug) {
      console.log("Sending message to parent:", message, "Origin:", this.targetOrigin);
    }

    try {
      window.parent.postMessage(message, this.targetOrigin);
    } catch (error) {
      console.error("Failed to send message to parent:", error);
    }
  }

  // Notifier que l'iframe est prête
  sendReady(integrator: string): void {
    const message: ReadyMessage = {
      type: IframeMessageType.READY,
      data: {
        version: "1.0.0",
        integrator,
      },
      timestamp: Date.now(),
    };
    this.postMessage(message);
  }

  // Notifier que le formulaire est complété
  sendCompleted(results: MutabilityResultDto, formData: Record<string, unknown>): void {
    const message: CompletedMessage = {
      type: IframeMessageType.COMPLETED,
      data: {
        results,
        formData,
      },
      timestamp: Date.now(),
    };
    this.postMessage(message);
  }

  // Notifier une erreur
  sendError(error: string, code?: string): void {
    const message: ErrorMessage = {
      type: IframeMessageType.ERROR,
      data: {
        error,
        code,
      },
      timestamp: Date.now(),
    };
    this.postMessage(message);
  }

  // Notifier un changement d'étape
  sendStepChanged(currentStep: number, totalSteps = 3): void {
    const message: StepChangedMessage = {
      type: IframeMessageType.STEP_CHANGED,
      data: {
        currentStep,
        totalSteps,
      },
      timestamp: Date.now(),
    };
    this.postMessage(message);
  }
}

// Helper pour créer un communicator
export function createIframeCommunicator(
  parentOrigin: string | null,
  debug = import.meta.env.DEV,
): IframeCommunicator {
  return new IframeCommunicator(parentOrigin, debug);
}
