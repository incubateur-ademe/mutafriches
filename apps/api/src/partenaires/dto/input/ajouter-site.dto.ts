import { ArrayMaxSize, ArrayMinSize, IsArray, IsString } from "class-validator";
import { AjouterSitePartenaireInputDto } from "@mutafriches/shared-types";

export class AjouterSiteDto implements AjouterSitePartenaireInputDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  parcelles: string[];
}
