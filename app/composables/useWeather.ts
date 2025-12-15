import type {
  ObservationGeoJson,
  ObservationStationCollectionGeoJson,
  PointGeoJson,
} from "../../types/noaaWeatherTypes";

const BASE_URL = "https://api.weather.gov";

// Helper functions
// ----------------

async function points(lat: number, long: number): Promise<PointGeoJson> {
  const response = await fetch(`https://api.weather.gov/points/${lat},${long}`);
  if (!response.ok) {
    throw new Error(`Error fetching points data: ${response.statusText}`);
  }
  const data: PointGeoJson = await response.json();
  return data;
}

async function stations(
  stationsUrl: string,
): Promise<ObservationStationCollectionGeoJson> {
  const response = await fetch(stationsUrl);
  if (!response.ok) {
    throw new Error(`Error fetching stations data: ${response.statusText}`);
  }
  const data: ObservationStationCollectionGeoJson = await response.json();
  return data;
}

async function observations(stationId: string): Promise<ObservationGeoJson> {
  const response = await fetch(
    `${BASE_URL}/stations/${stationId}/observations/latest`,
  );
  if (!response.ok) {
    throw new Error(`Error fetching observations data: ${response.statusText}`);
  }
  const data: ObservationGeoJson = await response.json();
  return data;
}

export const useWeather = () => {
  async function getWeatherAtCoordinates(
    lat: number,
    long: number,
  ): Promise<ObservationGeoJson> {
    try {
      const pointData = await points(lat, long);
      const stationsUrl = pointData.properties.observationStations;

      if (!stationsUrl) {
        throw new Error(
          "No observation stations URL found for the given coordinates.",
        );
      }
      const stationsData = await stations(stationsUrl);

      // Get the nearest station
      const nearestStation = stationsData.features[0];
      const stationId = nearestStation?.properties.stationIdentifier;

      if (!stationId) {
        throw new Error("No station identifier found for the nearest station.");
      }

      const observationData = await observations(stationId);
      return observationData;
    } catch {
      throw new Error(
        "Failed to retrieve weather data for the provided coordinates.",
      );
    }
  }
  return { getWeatherAtCoordinates };
};
