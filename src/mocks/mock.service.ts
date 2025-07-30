import { Injectable } from '@nestjs/common';
import { MockData } from './mock.types';
import { mockInfosParcelle } from './data/infosParcelle.mock';
import { mockResultatsMutabilite } from './data/resultatsMutabilite.mock';

@Injectable()
export class MockService {
  private readonly mockDataMap: Record<number, MockData> = {
    1: mockInfosParcelle,
    3: mockResultatsMutabilite,
  };

  getDataForStep(step: number): MockData {
    return this.mockDataMap[step] || undefined;
  }
}
