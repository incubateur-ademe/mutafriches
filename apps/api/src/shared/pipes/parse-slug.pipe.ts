import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from "@nestjs/common";

/** Slug d'URL : minuscules, chiffres et tirets, comme les slugs stockés en base. */
const FORMAT_SLUG = /^[a-z0-9-]{1,50}$/;

/**
 * Valide un segment d'URL utilisé comme identifiant (slug de partenaire).
 *
 * Sans cette barrière, un paramètre de route arbitraire descend jusqu'aux couches qui
 * composent la réponse — nom de fichier d'un en-tête `Content-Disposition`, URL de source
 * d'un export. Le rejeter au plus tôt vaut mieux que de l'assainir à chaque usage.
 *
 * Le message d'erreur ne réexpose pas la valeur reçue.
 */
@Injectable()
export class ParseSlugPipe implements PipeTransform<unknown, string> {
  transform(value: unknown, metadata: ArgumentMetadata): string {
    if (typeof value === "string" && FORMAT_SLUG.test(value)) {
      return value;
    }

    throw new BadRequestException({
      code: "SLUG_INVALIDE",
      message: `Le paramètre "${metadata.data ?? "slug"}" doit être un slug : minuscules, chiffres et tirets`,
    });
  }
}
