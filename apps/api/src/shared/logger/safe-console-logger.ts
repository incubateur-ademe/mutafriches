import { ConsoleLogger } from "@nestjs/common";
import { safeError } from "../utils/safe-error";

/**
 * Logger qui assainit les paramètres non-string avant de les journaliser.
 *
 * De nombreux services passent l'objet erreur en argument (`logger.error("msg", error)`).
 * Le logger par défaut inspecte cet objet en profondeur : pour une erreur Axios, cela
 * déroule sockets / TLS / session cache sur des milliers de lignes (saturation des logs
 * et blocage de l'event loop). On remplace tout argument objet par un résumé concis.
 */
export class SafeConsoleLogger extends ConsoleLogger {
  error(message: unknown, ...rest: unknown[]): void {
    super.error(this.assainir(message), ...rest.map((v) => this.assainir(v)));
  }

  warn(message: unknown, ...rest: unknown[]): void {
    super.warn(this.assainir(message), ...rest.map((v) => this.assainir(v)));
  }

  log(message: unknown, ...rest: unknown[]): void {
    super.log(this.assainir(message), ...rest.map((v) => this.assainir(v)));
  }

  debug(message: unknown, ...rest: unknown[]): void {
    super.debug(this.assainir(message), ...rest.map((v) => this.assainir(v)));
  }

  verbose(message: unknown, ...rest: unknown[]): void {
    super.verbose(this.assainir(message), ...rest.map((v) => this.assainir(v)));
  }

  /** Laisse passer strings/null (message, stack, contexte) ; résume les objets (erreurs). */
  private assainir(value: unknown): unknown {
    if (value === null || value === undefined || typeof value === "string") {
      return value;
    }
    return safeError(value);
  }
}
