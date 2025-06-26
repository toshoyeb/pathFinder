import Constants from "expo-constants";

// Google Maps API Configuration - Using environment variables
export const GOOGLE_MAPS_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  Constants.expoConfig?.extra?.googleMapsApiKey ||
  "";

export const GOOGLE_MAPS_API_KEY_ALTERNATE =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ALTERNATE || "";

// API Endpoints
export const GOOGLE_DIRECTIONS_API_URL =
  "https://maps.googleapis.com/maps/api/directions/json";

// API Configuration
export const API_CONFIG = {
  googleMaps: {
    apiKey: GOOGLE_MAPS_API_KEY,
    alternateApiKey: GOOGLE_MAPS_API_KEY_ALTERNATE,
    directionsUrl: GOOGLE_DIRECTIONS_API_URL,
  },
};

// Validate that required API keys are present
if (!GOOGLE_MAPS_API_KEY) {
  console.warn(
    "Google Maps API key is missing. Please set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in your .env file"
  );
}
