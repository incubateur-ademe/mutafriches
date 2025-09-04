import { Injectable } from "@nestjs/common";
import { ApiResponse } from "../../friches/services/external-apis/shared/api-response.interface";
import { MockParcellesHelper } from "../data/parcelles.mock";

@Injectable()
export class MockOverpassService {
  getProximiteCommercesServices(
    latitude: number,
    longitude: number,
  ): Promise<ApiResponse<boolean>> {
    const parcelle = MockParcellesHelper.findByCoordinates(latitude, longitude);

    return Promise.resolve({
      success: true,
      data: parcelle?.proximiteCommercesServices ?? false,
      source: "Mock Overpass",
    });
  }

  getVoieEauProximite(latitude: number, longitude: number): Promise<ApiResponse<boolean>> {
    const parcelle = MockParcellesHelper.findByCoordinates(latitude, longitude);

    return Promise.resolve({
      success: parcelle ? true : false,
      source: "Mock Overpass",
    });
  }
}
