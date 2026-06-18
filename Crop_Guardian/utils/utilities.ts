// utils/utilities.ts
import * as Location from "expo-location";

//  Reusable function for reverse geocoding
export const getLocationName = async (
  latitude: number,
  longitude: number,
): Promise<string> => {
  try {
    const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (geocode.length > 0) {
      const { city, region, country } = geocode[0];
      return (
        [city, region].filter(Boolean).join(", ") ||
        country ||
        "Unknown Location"
      );
    }
    return "Unknown Location";
  } catch (error) {
    console.error("Reverse geocoding failed:", error);
    return "Unknown Location";
  }
};
