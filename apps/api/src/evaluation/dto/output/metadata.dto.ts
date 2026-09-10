import { ApiProperty } from "@nestjs/swagger";
import { METADATA_CHAMPS_DERIVES, METADATA_CHAMPS_REQUIS, METADATA_ENUMS } from "./metadata.enums";

/**
 * DTO Swagger représentant les métadonnées de l'évaluation.
 * Les exemples proviennent de la même source que la réponse servie par le controller.
 */
export class MetadataSwaggerDto {
  @ApiProperty({
    description:
      "Enums groupés par catégorie. `enrichissement` = valeurs renvoyées par l'API d'enrichissement. `saisie` = valeurs autorisées pour chaque champ de `donneesComplementaires`. `usages` = les 7 usages évalués par l'algorithme. La valeur `ne-sait-pas` est acceptée partout, mais ne contribue pas à la fiabilité. Pour savoir quels champs sont **obligatoires**, se référer à `champsComplementairesRequis` plutôt qu'aux clés de `saisie`.",
    example: METADATA_ENUMS,
  })
  enums: {
    enrichissement: Record<string, string[]>;
    saisie: Record<string, string[]>;
    usages: string[];
  };

  @ApiProperty({
    description:
      "Champs de `donneesComplementaires` obligatoires dans `POST /evaluation/calculer`. Un champ absent, `null` ou vide produit un 400 listant les champs concernés. Envoyer `ne-sait-pas` pour une information non connue.",
    example: METADATA_CHAMPS_REQUIS,
  })
  champsComplementairesRequis: string[];

  @ApiProperty({
    description:
      "Champs calculés par l'API à partir des données enrichies. Ils figurent encore dans `enums.saisie` pour compatibilité, mais sont ignorés s'ils sont transmis : `raccordementEau` est déduit de la surface bâtie (BDNB).",
    example: METADATA_CHAMPS_DERIVES,
  })
  champsDerives: string[];

  @ApiProperty({
    description:
      "Versions actuellement servies par l'API. `api` suit le `package.json` du backend. `algorithme` correspond à la version courante (la liste complète est disponible via `GET /evaluation/algorithme/versions`).",
    example: { api: "2.0.0", algorithme: "v1.12" },
  })
  version: {
    api: string;
    algorithme: string;
  };
}
