import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { isValidParcelId } from "@mutafriches/shared-types";

/**
 * Validateur custom pour les identifiants cadastraux francais
 *
 * Utilise la fonction isValidParcelId de shared-types qui gere :
 * - Metropole : 13-14 caracteres
 * - DOM-TOM (971-976) : 14-15 caracteres
 * - Corse (2A, 2B) : 13-14 caracteres
 */
@ValidatorConstraint({ name: "isValidParcelId", async: false })
export class IsValidParcelIdConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== "string") {
      return false;
    }
    return isValidParcelId(value);
  }

  defaultMessage(): string {
    return "Format d'identifiant cadastral invalide. Attendu : 13-15 caracteres alphanumeriques (ex: 25056000HZ0346)";
  }
}

/**
 * Decorateur de validation pour les identifiants cadastraux
 *
 * @example
 * class MyDto {
 *   @IsValidParcelId()
 *   identifiant: string;
 * }
 */
export function IsValidParcelId(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidParcelIdConstraint,
    });
  };
}
