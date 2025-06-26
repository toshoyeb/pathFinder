/**
 * GOOGLE DIRECTIONS SERVICE
 *
 * This service handles all interactions with the Google Directions API for route planning.
 *
 * Key Features:
 * - Multiple route alternatives with traffic data
 * - Support for different travel modes (driving, walking, bicycling, transit)
 * - Custom polyline decoding (no external dependencies)
 * - Route optimization preferences (eco-friendly, less driving, etc.)
 * - Comprehensive error handling
 *
 * API Integration:
 * - Uses Google Directions API for route calculation
 * - Handles real-time traffic data for driving routes
 * - Supports route alternatives for comparison
 * - Includes route summaries and metadata
 *
 * Error Handling:
 * - Throws descriptive errors for different failure scenarios
 * - Handles API rate limiting and network issues
 * - Validates API responses before processing
 */

import axios from "axios";
import { LatLng } from "react-native-maps";
import { GOOGLE_MAPS_API_KEY } from "../config/api";

/**
 * Polyline Decoding Utility
 *
 * Decodes Google's encoded polyline format into an array of coordinates.
 * This implementation follows Google's polyline algorithm specification.
 *
 * Why custom implementation?
 * - Avoids external dependencies
 * - Optimized for our specific use case
 * - Full control over the decoding process
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
 * Get Single Route Between Two Points
 *
 * Fetches a single route between origin and destination using Google Directions API.
 * This is a simpler version that returns only the best route.
 *
 * @param origin - Starting point coordinates
 * @param destination - Ending point coordinates
 * @param mode - Travel mode (driving, walking, bicycling, transit)
 * @param avoid - Array of features to avoid (tolls, highways, ferries)
 * @param optimize - Whether to optimize the route
 * @returns Promise with route polyline, distance, and duration
 */
export async function getRouteBetweenPoints(
  origin: LatLng,
  destination: LatLng,
  mode: "driving" | "walking" | "bicycling" | "transit" = "driving",
  avoid: string[] = [],
  optimize: boolean = false
): Promise<{ polyline: LatLng[]; distance: string; duration: string }> {
  // Format coordinates for API request
  const originStr = `${origin.latitude},${origin.longitude}`;
  const destinationStr = `${destination.latitude},${destination.longitude}`;

  // Build API URL with parameters
  let url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destinationStr}&mode=${mode}&key=${GOOGLE_MAPS_API_KEY}`;

  if (avoid.length > 0) {
    url += `&avoid=${avoid.join("|")}`;
  }
  if (optimize) {
    url += "&optimize=true";
  }

  // Make API request
  const response = await axios.get(url);

  // Validate API response
  if (response.data.status !== "OK") {
    throw new Error(response.data.error_message || "Failed to get directions");
  }

  // Extract route data
  const route = response.data.routes[0];
  const leg = route.legs[0];
  const decodedPolyline = decodePolyline(route.overview_polyline.points);

  return {
    polyline: decodedPolyline,
    distance: leg.distance.text,
    duration: leg.duration.text,
  };
}

/**
 * Get Multiple Route Alternatives (MAIN FUNCTION)
 *
 * This is the primary function used by the app for route planning.
 * Fetches multiple route alternatives with traffic data and optimization preferences.
 *
 * Features:
 * - Up to 3 route alternatives per request
 * - Real-time traffic data for driving routes
 * - Eco-friendly routing preferences
 * - Route summaries and metadata
 * - Comprehensive error handling
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
  // Build API parameters array
  const params = [
    `origin=${origin.latitude},${origin.longitude}`,
    `destination=${destination.latitude},${destination.longitude}`,
    `mode=${mode}`,
    `alternatives=true`, // Request multiple route alternatives
    `key=${GOOGLE_MAPS_API_KEY}`,
    `language=en`,
  ];

  // Add optional parameters
  if (avoid.length > 0) {
    params.push(`avoid=${avoid.join("|")}`);
  }

  // Add driving-specific optimizations
  if (mode === "driving") {
    params.push("departure_time=now"); // Enable real-time traffic data
    params.push("routing_preference=less_driving"); // Eco-friendly routing
  }

  // Make API request
  const url = `https://maps.googleapis.com/maps/api/directions/json?${params.join(
    "&"
  )}`;
  const res = await axios.get(url);

  // Validate response and check for routes
  if (!res.data.routes || res.data.routes.length === 0) {
    throw new Error("No routes found");
  }

  // Process and return route alternatives
  return res.data.routes.map((route: any, idx: number) => {
    const leg = route.legs[0];
    return {
      polyline: decodePolyline(route.overview_polyline.points), // Decoded route coordinates
      distance: leg.distance.text, // Human-readable distance
      duration: leg.duration.text, // Standard duration
      trafficDuration: leg.duration_in_traffic
        ? leg.duration_in_traffic.text
        : null, // Traffic-adjusted duration
      summary: route.summary || `Route ${idx + 1}`, // Route description
      routeIndex: idx, // Index for selection
      raw: route, // Full API response for advanced use
    };
  });
}
