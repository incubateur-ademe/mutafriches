import { MutabilityInputDto } from "../dto/mutability-input.dto";
import { MutabilityResultDto } from "../dto/mutability-result.dto";

export interface IMutabilityService {
  /**
   * Calcule les indices de mutabilité à partir d'un DTO
   * @param input Données d'entrée
   * @param fiabilite Score de fiabilité optionnel
   * @returns MutabilityResultDto
   */
  calculateMutability(input: MutabilityInputDto, fiabilite?: number): MutabilityResultDto;
}
