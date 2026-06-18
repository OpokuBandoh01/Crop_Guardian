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

// Weather code to description map (from backend)
export const weatherCodeMap: Record<number, string> = {
  0: "Clear Sky",
  1: "Mainly Clear",
  2: "Partly Cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing Rime Fog",
  51: "Light Drizzle",
  53: "Moderate Drizzle",
  55: "Dense Drizzle",
  61: "Slight Rain",
  63: "Moderate Rain",
  65: "Heavy Rain",
  71: "Slight Snow Fall",
  73: "Moderate Snow Fall",
  75: "Heavy Snow Fall",
  80: "Slight Rain Showers",
  81: "Moderate Rain Showers",
  82: "Violent Rain Showers",
  // Extend this map when backend adds more codes
};

// Map weather code → Ionicons name
export const getWeatherIcon = (code: number): string => {
  if ([0, 1].includes(code)) return "sunny-outline";
  if ([2, 3].includes(code)) return "partly-sunny-outline";
  if ([45, 48].includes(code)) return "cloudy-outline";
  if ([51, 53, 55].includes(code)) return "rainy-outline";
  if ([61, 63, 65, 80, 81, 82].includes(code)) return "rainy-outline";
  if ([71, 73, 75].includes(code)) return "snow-outline";
  return "cloud-outline"; // fallback
};

export const KHAYA_API_KEY = process.env.EXPO_KHAYA_API_KEY as string;
