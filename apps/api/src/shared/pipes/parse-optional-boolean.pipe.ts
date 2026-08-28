import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from "@nestjs/common";

const VALEURS_VRAIES = ["true", "1", ""];
const VALEURS_FAUSSES = ["false", "0"];

/**
 * Convertit un query param booléen optionnel.
 *
 * Sans ce pipe, Nest transmet la chaîne brute : `?flag=false` est truthy et active la
 * fonctionnalité qu'il était censé désactiver.
 *
 * - absent => undefined
 * - `true`, `1`, ou présent sans valeur => true
 * - `false`, `0` => false
 * - toute autre valeur => 400 (plutôt qu'une interprétation silencieuse)
 */
@Injectable()
export class ParseOptionalBooleanPipe implements PipeTransform<unknown, boolean | undefined> {
  transform(value: unknown, metadata: ArgumentMetadata): boolean | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }

    if (typeof value === "boolean") {
      return value;
    }

    const normalisee = String(value).trim().toLowerCase();

    if (VALEURS_VRAIES.includes(normalisee)) {
      return true;
    }

    if (VALEURS_FAUSSES.includes(normalisee)) {
      return false;
    }

    throw new BadRequestException({
      code: "PARAMETRE_BOOLEEN_INVALIDE",
      message: `Le paramètre "${metadata.data ?? "inconnu"}" attend true ou false`,
    });
  }
}
