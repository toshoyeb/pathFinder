import axios from "axios";
import { LatLng } from "react-native-maps";
import { GOOGLE_MAPS_API_KEY } from "../config/api";

// Polyline decoding utility (Google encoded polyline algorithm)
function decodePolyline(encoded: string): LatLng[] {
  let points: LatLng[] = [];
  let index = 0,
    len = encoded.length;
  let lat = 0,
    lng = 0;

  while (index < len) {
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

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }
  return points;
}

export async function getRouteBetweenPoints(
  origin: LatLng,
  destination: LatLng,
  mode: "driving" | "walking" | "bicycling" | "transit" = "driving",
  avoid: string[] = [],
  optimize: boolean = false
): Promise<{ polyline: LatLng[]; distance: string; duration: string }> {
  const originStr = `${origin.latitude},${origin.longitude}`;
  const destinationStr = `${destination.latitude},${destination.longitude}`;
  let url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destinationStr}&mode=${mode}&key=${GOOGLE_MAPS_API_KEY}`;
  if (avoid.length > 0) {
    url += `&avoid=${avoid.join("|")}`;
  }
  if (optimize) {
    url += "&optimize=true";
  }

  const response = await axios.get(url);
  if (response.data.status !== "OK") {
    throw new Error(response.data.error_message || "Failed to get directions");
  }
  const route = response.data.routes[0];
  const leg = route.legs[0];
  const decodedPolyline = decodePolyline(route.overview_polyline.points);
  return {
    polyline: decodedPolyline,
    distance: leg.distance.text,
    duration: leg.duration.text,
  };
}

export async function getRoutesWithAlternatives(
  origin: LatLng,
  destination: LatLng,
  mode = "driving",
  avoid: string[] = []
) {
  const params = [
    `origin=${origin.latitude},${origin.longitude}`,
    `destination=${destination.latitude},${destination.longitude}`,
    `mode=${mode}`,
    `alternatives=true`,
    `key=${GOOGLE_MAPS_API_KEY}`,
    `language=en`,
  ];
  if (avoid.length > 0) {
    params.push(`avoid=${avoid.join("|")}`);
  }
  if (mode === "driving") {
    params.push("departure_time=now");
    // less_driving, less_walking, less_bicycling, less_transit
    params.push("routing_preference=less_driving");
  }
  const url = `https://maps.googleapis.com/maps/api/directions/json?${params.join(
    "&"
  )}`;
  const res = await axios.get(url);
  if (!res.data.routes || res.data.routes.length === 0) {
    throw new Error("No routes found");
  }
  return res.data.routes.map((route: any, idx: number) => {
    const leg = route.legs[0];
    return {
      polyline: decodePolyline(route.overview_polyline.points),
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
