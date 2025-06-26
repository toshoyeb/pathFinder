import axios from "axios";
import { GOOGLE_MAPS_API_KEY } from "../config/api";

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface Place {
  placeId: string;
  name: string;
  address: string;
  coordinates: Coordinate;
  types: string[];
}

interface AutocompleteResult {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export const getPlaceAutocomplete = async (
  input: string,
  location?: Coordinate,
  radius: number = 50000
): Promise<AutocompleteResult[]> => {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error("Google Maps API key not configured");
    }

    let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
      input
    )}&key=${GOOGLE_MAPS_API_KEY}`;

    // Add location bias if provided
    if (location) {
      url += `&location=${location.latitude},${location.longitude}&radius=${radius}`;
    }

    const response = await axios.get(url);

    if (!response.data.predictions) {
      return [];
    }

    return response.data.predictions.map((prediction: any) => ({
      placeId: prediction.place_id,
      description: prediction.description,
      mainText:
        prediction.structured_formatting?.main_text || prediction.description,
      secondaryText: prediction.structured_formatting?.secondary_text || "",
    }));
  } catch (error: any) {
    console.error("Autocomplete error:", error);
    return [];
  }
};

export const getPlaceDetails = async (
  placeId: string
): Promise<Place | null> => {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error("Google Maps API key not configured");
    }

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await axios.get(url);

    if (!response.data.result) {
      return null;
    }

    const place = response.data.result;

    return {
      placeId: place.place_id,
      name: place.name || "Unknown Place",
      address: place.formatted_address || "",
      coordinates: {
        latitude: place.geometry?.location?.lat || 0,
        longitude: place.geometry?.location?.lng || 0,
      },
      types: place.types || [],
    };
  } catch (error: any) {
    console.error("Place details error:", error);
    return null;
  }
};

export const reverseGeocode = async (
  coordinate: Coordinate
): Promise<Place | null> => {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error("Google Maps API key not configured");
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinate.latitude},${coordinate.longitude}&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await axios.get(url);

    if (!response.data.results || response.data.results.length === 0) {
      return null;
    }

    const result = response.data.results[0];

    return {
      placeId: result.place_id,
      name: result.formatted_address?.split(",")[0] || "Unknown Location",
      address: result.formatted_address || "",
      coordinates: {
        latitude: result.geometry?.location?.lat || coordinate.latitude,
        longitude: result.geometry?.location?.lng || coordinate.longitude,
      },
      types: result.types || [],
    };
  } catch (error: any) {
    console.error("Reverse geocoding error:", error);
    return null;
  }
};
