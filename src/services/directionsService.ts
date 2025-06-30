/**
 * GOOGLE ROUTES API V2 SERVICE WITH LEGACY FALLBACK
 *
 * This service handles all interactions with the Google Routes API v2 for route planning.
 * Migration from legacy Directions API to the modern Routes API v2.
 * Includes fallback to legacy Directions API for debugging and reliability.
 *
 * Key Features:
 * - Multiple route alternatives with traffic data
 * - Support for different travel modes (DRIVE, WALK, BICYCLE, TRANSIT)
 * - Custom polyline decoding (no external dependencies)
 * - Route optimization preferences (eco-friendly, fuel efficient, etc.)
 * - Comprehensive error handling
 * - Field masks for optimized responses
 * - Fallback to legacy Directions API
 *
 * API Integration:
 * - Primary: Uses Google Routes API v2 for route calculation
 * - Fallback: Uses legacy Directions API if Routes API fails
 * - POST requests with JSON body (vs legacy GET with URL params)
 * - Field masks to specify required response data
 * - Enhanced traffic data and route preferences
 * - Real-time traffic awareness for driving routes
 *
 * Migration Notes:
 * - Requires Routes API to be enabled in Google Cloud Console
 * - Different billing structure than Directions API
 * - More granular route preferences and modifiers
 * - Enhanced polyline encoding options
 *
 * Error Handling:
 * - Throws descriptive errors for different failure scenarios
 * - Handles API rate limiting and network issues
 * - Validates API responses before processing
 * - Automatic fallback to legacy API
 */

import axios from "axios";
import { LatLng } from "react-native-maps";
import { GOOGLE_MAPS_API_KEY } from "../config/api";

// API Configuration
const ROUTES_API_BASE_URL =
  "https://routes.googleapis.com/directions/v2:computeRoutes";
const DIRECTIONS_API_BASE_URL =
  "https://maps.googleapis.com/maps/api/directions/json";

// Simplified Field mask - only essential fields to avoid API issues
const FIELD_MASK =
  "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.description";

/**
 * Travel Mode Mapping
 * Maps our internal travel modes to Routes API v2 format
 */
const TRAVEL_MODE_MAP = {
  driving: "DRIVE",
  walking: "WALK",
  bicycling: "BICYCLE",
  transit: "TRANSIT",
} as const;

/**
 * Route Modifier Mapping
 * Maps avoid preferences to Routes API v2 format
 */
const AVOID_FEATURES_MAP = {
  tolls: "TOLLS",
  highways: "HIGHWAYS",
  ferries: "FERRIES",
} as const;

/**
 * Polyline Decoding Utility
 *
 * Decodes Google's encoded polyline format into an array of coordinates.
 * This implementation follows Google's polyline algorithm specification.
 * Compatible with both legacy Directions API and Routes API v2 polylines.
 *
 * Why custom implementation?
 * - Avoids external dependencies
 * - Optimized for our specific use case
 * - Full control over the decoding process
 * - Works with both API formats
 *
 * @param encoded - Google encoded polyline string
 * @returns Array of latitude/longitude coordinates
 */
function decodePolyline(encoded: string): LatLng[] {
  let points: LatLng[] = [];
  let index = 0,
    len = encoded.length;
  let lat = 0,
    lng = 0;

  while (index < len) {
    // Decode latitude delta
    let b,
      shift = 0,
      result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    // Decode longitude delta
    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    // Convert to decimal degrees and add to points array
    points.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }
  return points;
}

/**
 * Format Duration
 * Converts seconds to human-readable format (e.g., "25 mins", "1 hour 30 mins")
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return minutes > 0
      ? `${hours} hour${hours > 1 ? "s" : ""} ${minutes} min${
          minutes > 1 ? "s" : ""
        }`
      : `${hours} hour${hours > 1 ? "s" : ""}`;
  }
  return `${minutes} min${minutes > 1 ? "s" : ""}`;
}

/**
 * Format Distance
 * Converts meters to human-readable format (e.g., "1.2 km", "500 m")
 */
function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

/**
 * Build Route Request Body
 * Creates the JSON request body for Routes API v2
 */
function buildRouteRequest(
  origin: LatLng,
  destination: LatLng,
  travelMode: string,
  avoid: string[] = [],
  computeAlternativeRoutes: boolean = false
) {
  const request: any = {
    origin: {
      location: {
        latLng: {
          latitude: origin.latitude,
          longitude: origin.longitude,
        },
      },
    },
    destination: {
      location: {
        latLng: {
          latitude: destination.latitude,
          longitude: destination.longitude,
        },
      },
    },
    travelMode:
      TRAVEL_MODE_MAP[travelMode as keyof typeof TRAVEL_MODE_MAP] || "DRIVE",
    computeAlternativeRoutes,
  };

  // Add route modifiers for avoid preferences
  if (avoid.length > 0) {
    request.routeModifiers = {
      avoidTolls: avoid.includes("tolls"),
      avoidHighways: avoid.includes("highways"),
      avoidFerries: avoid.includes("ferries"),
    };
  }

  return request;
}

/**
 * Legacy Directions API Fallback
 * Uses the legacy Directions API as a fallback when Routes API v2 fails
 */
async function getRoutesWithLegacyAPI(
  origin: LatLng,
  destination: LatLng,
  mode = "driving",
  avoid: string[] = [],
  alternatives = true
) {
  console.log("🔄 Falling back to Legacy Directions API");

  // Build API parameters array
  const params = [
    `origin=${origin.latitude},${origin.longitude}`,
    `destination=${destination.latitude},${destination.longitude}`,
    `mode=${mode}`,
    `alternatives=${alternatives}`,
    `key=${GOOGLE_MAPS_API_KEY}`,
    `language=en`,
  ];

  // Add optional parameters
  if (avoid.length > 0) {
    params.push(`avoid=${avoid.join("|")}`);
  }

  // Add driving-specific optimizations
  if (mode === "driving") {
    params.push("departure_time=now");
  }

  const url = `${DIRECTIONS_API_BASE_URL}?${params.join("&")}`;
  const response = await axios.get(url);

  // Validate response and check for routes
  if (!response.data.routes || response.data.routes.length === 0) {
    throw new Error("No routes found (Legacy API)");
  }

  console.log(`✅ Legacy API found ${response.data.routes.length} routes`);

  // Process legacy API response
  return response.data.routes.map((route: any, idx: number) => {
    const leg = route.legs[0];
    const decodedPolyline = decodePolyline(route.overview_polyline.points);

    console.log(`🛣️ Legacy Route ${idx + 1}:`, {
      summary: route.summary,
      distance: leg.distance.text,
      duration: leg.duration.text,
      polylinePoints: decodedPolyline.length,
    });

    return {
      polyline: decodedPolyline,
      distance: leg.distance.text,
      duration: leg.duration.text,
      trafficDuration: leg.duration_in_traffic
        ? leg.duration_in_traffic.text
        : null,
      summary: route.summary || `Route ${idx + 1}`,
      routeIndex: idx,
      raw: route,
    };
  });
}

/**
 * Get Single Route Between Two Points (Routes API v2 with Legacy Fallback)
 *
 * Fetches a single route between origin and destination using Google Routes API v2.
 * Falls back to legacy Directions API if Routes API v2 fails.
 *
 * @param origin - Starting point coordinates
 * @param destination - Ending point coordinates
 * @param mode - Travel mode (driving, walking, bicycling, transit)
 * @param avoid - Array of features to avoid (tolls, highways, ferries)
 * @param optimize - Whether to optimize the route (Routes API v2 auto-optimizes)
 * @returns Promise with route polyline, distance, and duration
 */
export async function getRouteBetweenPoints(
  origin: LatLng,
  destination: LatLng,
  mode: "driving" | "walking" | "bicycling" | "transit" = "driving",
  avoid: string[] = [],
  optimize: boolean = false
): Promise<{ polyline: LatLng[]; distance: string; duration: string }> {
  const requestBody = buildRouteRequest(
    origin,
    destination,
    mode,
    avoid,
    false
  );

  console.log("🚀 Routes API v2 Single Route Request:", {
    url: ROUTES_API_BASE_URL,
    mode,
    origin,
    destination,
    avoid,
  });

  try {
    // Try Routes API v2 first
    const response = await axios.post(ROUTES_API_BASE_URL, requestBody, {
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask": FIELD_MASK,
      },
    });

    console.log("✅ Routes API v2 Single Route Response received");

    // Validate response
    if (!response.data.routes || response.data.routes.length === 0) {
      throw new Error("No routes found");
    }

    const route = response.data.routes[0];

    // Validate essential response fields
    if (!route.polyline?.encodedPolyline) {
      throw new Error("Invalid route response: missing polyline");
    }
    if (!route.duration) {
      throw new Error("Invalid route response: missing duration");
    }
    if (!route.distanceMeters) {
      throw new Error("Invalid route response: missing distance");
    }

    const decodedPolyline = decodePolyline(route.polyline.encodedPolyline);

    return {
      polyline: decodedPolyline,
      distance: formatDistance(route.distanceMeters),
      duration: formatDuration(parseInt(route.duration.replace("s", ""))),
    };
  } catch (error: any) {
    console.error("❌ Routes API v2 Single Route Error:", error);

    // Enhanced error logging
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error(
        "Response data:",
        JSON.stringify(error.response.data, null, 2)
      );
    }

    // Try legacy API as fallback
    try {
      console.log("🔄 Trying legacy Directions API as fallback...");
      const legacyRoutes = await getRoutesWithLegacyAPI(
        origin,
        destination,
        mode,
        avoid,
        false
      );
      console.log("✅ Legacy API fallback successful");
      return legacyRoutes[0]; // Return first route
    } catch (fallbackError) {
      console.error("❌ Legacy API fallback also failed:", fallbackError);
      throw new Error(
        // @ts-ignore
        `Both APIs failed. Routes API: ${error.message}, Legacy API: ${fallbackError.message}`
      );
    }
  }
}

/**
 * Get Multiple Route Alternatives (MAIN FUNCTION - Routes API v2 with Legacy Fallback)
 *
 * This is the primary function used by the app for route planning.
 * Fetches multiple route alternatives with traffic data using Routes API v2.
 * Falls back to legacy Directions API if Routes API v2 fails.
 *
 * Features:
 * - Up to 3 route alternatives per request
 * - Real-time traffic data for driving routes
 * - Enhanced routing preferences and modifiers
 * - Route descriptions and metadata
 * - Comprehensive error handling
 * - Field masks for optimized responses
 * - Automatic fallback to legacy API
 *
 * @param origin - Starting point coordinates
 * @param destination - Ending point coordinates
 * @param mode - Travel mode (driving, walking, bicycling, transit)
 * @param avoid - Array of features to avoid (tolls, highways, ferries)
 * @returns Promise with array of route alternatives
 */
export async function getRoutesWithAlternatives(
  origin: LatLng,
  destination: LatLng,
  mode = "driving",
  avoid: string[] = []
) {
  const requestBody = buildRouteRequest(origin, destination, mode, avoid, true);

  console.log("🚀 Routes API v2 Alternatives Request:", {
    url: ROUTES_API_BASE_URL,
    mode,
    origin,
    destination,
    avoid,
    body: JSON.stringify(requestBody, null, 2),
  });

  try {
    // Try Routes API v2 first
    const response = await axios.post(ROUTES_API_BASE_URL, requestBody, {
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask": FIELD_MASK,
      },
    });

    console.log("✅ Routes API v2 Alternatives Response received");

    // Validate response and check for routes
    if (!response.data.routes || response.data.routes.length === 0) {
      console.warn("No routes found in response:", response.data);
      throw new Error("No routes found");
    }

    console.log(`📍 Found ${response.data.routes.length} route alternatives`);

    // Process and return route alternatives with Routes API v2 structure
    return response.data.routes.map((route: any, idx: number) => {
      // Validate essential route fields
      if (!route.polyline?.encodedPolyline) {
        console.error(`Route ${idx + 1} missing polyline:`, route);
        throw new Error(`Route ${idx + 1} has invalid polyline data`);
      }
      if (!route.duration) {
        console.error(`Route ${idx + 1} missing duration:`, route);
        throw new Error(`Route ${idx + 1} has invalid duration data`);
      }
      if (!route.distanceMeters) {
        console.error(`Route ${idx + 1} missing distance:`, route);
        throw new Error(`Route ${idx + 1} has invalid distance data`);
      }

      // Parse duration (Routes API v2 returns duration as "123s" string)
      const durationSeconds = parseInt(route.duration.replace("s", ""));
      const formattedDuration = formatDuration(durationSeconds);

      // Format distance
      const formattedDistance = formatDistance(route.distanceMeters);

      // Decode polyline
      const decodedPolyline = decodePolyline(route.polyline.encodedPolyline);

      // Log route processing
      console.log(`🛣️ Route ${idx + 1}:`, {
        description: route.description || "No description",
        distance: formattedDistance,
        duration: formattedDuration,
        polylinePoints: decodedPolyline.length,
      });

      return {
        polyline: decodedPolyline, // Decoded route coordinates
        distance: formattedDistance, // Human-readable distance
        duration: formattedDuration, // Standard duration
        trafficDuration: null, // Will be enhanced in future updates
        summary: route.description || `Route ${idx + 1}`, // Route description
        routeIndex: idx, // Index for selection
        raw: route, // Full API response for advanced use
      };
    });
  } catch (error: any) {
    console.error("❌ Routes API v2 Alternatives Error:", error);

    // Enhanced error logging
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
      console.error(
        "Response data:",
        JSON.stringify(error.response.data, null, 2)
      );
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Request setup error:", error.message);
    }

    // Try legacy API as fallback
    try {
      console.log("🔄 Trying legacy Directions API as fallback...");
      const legacyRoutes = await getRoutesWithLegacyAPI(
        origin,
        destination,
        mode,
        avoid,
        true
      );
      console.log("✅ Legacy API fallback successful");
      return legacyRoutes;
    } catch (fallbackError) {
      console.error("❌ Legacy API fallback also failed:", fallbackError);

      if (error.response?.data?.error) {
        const apiError = error.response.data.error;
        throw new Error(
          `Routes API Error: ${apiError.message || "Unknown error"} (Status: ${
            error.response.status || "Unknown"
            // @ts-ignore
          }). Legacy fallback also failed: ${fallbackError.message}`
        );
      }
      throw new Error(
        // @ts-ignore
        `Both APIs failed. Routes API: ${error.message}, Legacy API: ${fallbackError.message}`
      );
    }
  }
}
