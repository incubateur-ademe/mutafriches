import { UiParcelleDto } from './ui-parcelle.dto';

export interface UiEnrichmentResultDto {
  success: boolean;
  data?: UiParcelleDto;
  sources?: string[];
  fiabilite?: number;
  error?: string;
}
