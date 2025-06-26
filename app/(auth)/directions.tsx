/**
 * DIRECTIONS PAGE - Route Planning & Navigation Hub
 *
 * This is the core screen of PathFinder that handles intelligent route planning
 * with multiple alternatives, real-time traffic data, and advanced customization.
 *
 * 🗺️ MAP INTEGRATION ARCHITECTURE:
 * - Uses react-native-maps for interactive map display
 * - Custom marker system with different colors for origin/destination
 * - Polyline rendering for route visualization
 * - Dynamic map region control with smooth animations
 * - Tap-to-select destination functionality
 *
 * 🛣️ MULTI-ROUTE SYSTEM:
 * - Fetches up to 3 route alternatives from Google Directions API
 * - Horizontal route selector for easy comparison
 * - Route labeling system (Fastest, Eco, Route 3)
 * - Real-time traffic integration for driving routes
 * - Route metadata: distance, duration, traffic-adjusted ETA
 *
 * 🚗 TRAVEL MODE OPTIMIZATION:
 * - 4 travel modes: driving, walking, bicycling, transit
 * - Mode-specific API parameters and preferences
 * - Auto-fallback system (other modes → driving on failure)
 * - Eco-friendly routing preferences for environmental consciousness
 *
 * ⚙️ ADVANCED CUSTOMIZATION:
 * - Avoid options: tolls, highways, ferries
 * - Distance validation to prevent API waste
 * - Smart error handling with user-friendly notifications
 * - Place search integration with autocomplete
 *
 * 🔄 STATE MANAGEMENT STRATEGY:
 * - Local state for route data and UI controls
 * - Effect-based route fetching on dependency changes
 * - Snackbar system for non-intrusive error notifications
 * - Loading states for smooth user experience
 *
 * 📱 RESPONSIVE DESIGN:
 * - Dynamic bottom panel sizing based on content
 * - Keyboard-aware modal system
 * - Safe area handling for various device sizes
 * - Optimized for both Android and iOS
 */

import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { LatLng, Marker, Polyline, Region } from "react-native-maps";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Button } from "../../src/components/ui/Button";
import { FullScreenSearch } from "../../src/components/ui/FullScreenSearch";
import { Colors } from "../../src/constants/Colors";
import { getRoutesWithAlternatives } from "../../src/services/directionsService";

const { height } = Dimensions.get("window");

/**
 * TRAVEL MODE CONFIGURATION
 *
 * Defines the available travel modes supported by Google Directions API.
 * Each mode has different characteristics and API behavior:
 *
 * - driving: Supports traffic data, alternatives, avoid options, eco-routing
 * - walking: Basic routing, limited alternatives
 * - bicycling: Bike-friendly routes, limited availability in some regions
 * - transit: Public transportation, requires additional API setup
 */
const TRAVEL_MODES = ["driving", "walking", "bicycling", "transit"] as const;
type TravelMode = typeof TRAVEL_MODES[number];

/**
 * ROUTE AVOIDANCE OPTIONS
 *
 * Options to customize route planning by avoiding specific road features.
 * These are passed directly to Google Directions API:
 *
 * - tolls: Avoid toll roads (useful for cost-conscious users)
 * - highways: Avoid highways (scenic routes, local driving)
 * - ferries: Avoid ferry routes (time/cost considerations)
 */
const AVOID_OPTIONS = ["tolls", "highways", "ferries"] as const;
type AvoidOption = typeof AVOID_OPTIONS[number];

/**
 * Place Interface for Search Results
 *
 * Standardized format for location data from Google Places API
 * Used consistently across place search and selection
 */
interface Place {
  placeId: string; // Google Places unique identifier
  name: string; // Display name (e.g., "Central Park")
  address: string; // Full formatted address
  coordinates: { latitude: number; longitude: number }; // Lat/lng coordinates
}

export default function DirectionsPage() {
  /**
   * CORE MAP STATE
   * Managing the fundamental map display and location data
   */
  const [origin, setOrigin] = useState<LatLng | null>(null); // User's current location
  const [destination, setDestination] = useState<LatLng | null>(null); // Selected destination
  const [region, setRegion] = useState<Region | null>(null); // Current map viewport
  const [loading, setLoading] = useState(true); // Initial location loading
  const [errorMsg, setErrorMsg] = useState<string | null>(null); // Location permission errors
  const mapRef = useRef<MapView>(null); // Reference for programmatic map control

  /**
   * ROUTE STATE MANAGEMENT
   * Handles the currently selected route display and metadata
   */
  const [routePolyline, setRoutePolyline] = useState<LatLng[]>([]); // Currently displayed route coordinates
  const [routeDistance, setRouteDistance] = useState<string | null>(null); // Human-readable distance
  const [routeDuration, setRouteDuration] = useState<string | null>(null); // Human-readable duration
  const [routeLoading, setRouteLoading] = useState(false); // API request loading state

  /**
   * ROUTE OPTIMIZATION CONTROLS
   * User-configurable options that affect route calculation
   */
  const [travelMode, setTravelMode] = useState<TravelMode>("driving"); // Current travel mode
  const [avoid, setAvoid] = useState<AvoidOption[]>([]); // Features to avoid in routing

  /**
   * MODAL AND SEARCH STATE
   * Controls for the place search and route configuration modals
   */
  const [modalVisible, setModalVisible] = useState(false); // Main route selection modal
  const [fromInput, setFromInput] = useState(""); // Origin search input text
  const [toInput, setToInput] = useState(""); // Destination search input text
  const [searchType, setSearchType] = useState<"from" | "to">("from"); // Which field is being searched
  const [showSearch, setShowSearch] = useState(false); // Full-screen search modal

  /**
   * MULTI-ROUTE ALTERNATIVES STATE
   * Core feature: Managing multiple route options for comparison
   */
  const [routes, setRoutes] = useState<any[]>([]); // All available route alternatives from API
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0); // Index of currently selected/displayed route

  /**
   * USER FEEDBACK STATE
   * Non-intrusive notification system for errors and status updates
   */
  const [snackbarVisible, setSnackbarVisible] = useState(false); // Snackbar visibility
  const [snackbarMessage, setSnackbarMessage] = useState(""); // Snackbar text content

  const insets = useSafeAreaInsets(); // Safe area insets for proper UI positioning

  /**
   * SNACKBAR NOTIFICATION SYSTEM
   *
   * Provides non-intrusive user feedback for errors and status updates.
   * Auto-dismisses after 3 seconds to avoid cluttering the UI.
   */
  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
    // Auto hide after 3 seconds to avoid UI clutter
    setTimeout(() => {
      setSnackbarVisible(false);
    }, 3000);
  };

  /**
   * INITIALIZATION EFFECT
   *
   * Automatically gets user's current location when the component mounts.
   * This provides a starting point for route planning.
   */
  useEffect(() => {
    getCurrentLocation();
  }, []);

  /**
   * ROUTE FETCHING TRIGGER EFFECT
   *
   * Core logic: Automatically refetch routes when any routing parameter changes.
   * This creates a reactive routing system where users see instant updates.
   *
   * Triggers on changes to:
   * - origin/destination coordinates
   * - travel mode (driving, walking, etc.)
   * - avoid options (tolls, highways, ferries)
   */
  useEffect(() => {
    if (origin && destination) {
      fetchRoutesWithAlternatives(); // Fetch new routes with current parameters
    } else {
      // Clear route state when origin/destination is missing
      setRoutes([]);
      setSelectedRouteIdx(0);
      setRoutePolyline([]);
      setRouteDistance(null);
      setRouteDuration(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin, destination, travelMode, avoid]);

  /**
   * LOCATION ACQUISITION SYSTEM
   *
   * Gets the user's current location using Expo Location with high accuracy.
   * This serves as the default origin point for route planning.
   *
   * Key Features:
   * - Requests foreground location permissions
   * - Uses BestForNavigation accuracy for precise positioning
   * - Sets up initial map region centered on user location
   * - Handles permission denials and location errors gracefully
   *
   * Map Region Strategy:
   * - Sets 0.01 degree delta for both lat/lng (roughly 1km zoom level)
   * - Provides good initial view without being too zoomed in/out
   */
  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      // Request location permissions from the user
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        setLoading(false);
        return;
      }

      // Get high-accuracy current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation, // High accuracy for navigation
      });

      // Extract coordinates and set as origin
      const currentCoord = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setOrigin(currentCoord);

      // Set initial map region centered on user location
      const newRegion = {
        ...currentCoord,
        latitudeDelta: 0.01, // ~1km north-south range
        longitudeDelta: 0.01, // ~1km east-west range
      };
      setRegion(newRegion);
    } catch (error) {
      setErrorMsg(
        "Unable to get your current location. Please check your location settings and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * MAP INTERACTION HANDLER
   *
   * Handles tap events on the map to set destination points.
   * This provides an intuitive way for users to select destinations
   * without needing to search for specific addresses.
   *
   * Behavior:
   * - Single tap anywhere on map sets that point as destination
   * - Automatically triggers route calculation via useEffect
   * - Replaces any previously selected destination
   */
  const handleMapPress = (e: any) => {
    setDestination(e.nativeEvent.coordinate); // Extract lat/lng from tap event
  };

  /**
   * MULTI-ROUTE FETCHING ENGINE (CORE FUNCTION)
   *
   * This is the heart of PathFinder's route planning system. It orchestrates
   * the entire process of getting multiple route alternatives from Google's API
   * and handling various edge cases and optimizations.
   *
   * 🔄 PROCESS FLOW:
   * 1. Validate origin/destination exist
   * 2. Calculate approximate distance for early validation
   * 3. Check for unreasonably short distances (API waste prevention)
   * 4. Call Google Directions API via our service layer
   * 5. Process multiple route alternatives
   * 6. Handle errors with smart fallback logic
   * 7. Update UI state with results
   *
   * 🛣️ MULTI-ROUTE LOGIC:
   * - Requests up to 3 route alternatives from Google API
   * - Automatically selects first route (usually fastest) as default
   * - Stores all alternatives for user comparison
   * - Each route includes: polyline, distance, duration, traffic data
   *
   * 🚗 AUTO-FALLBACK SYSTEM:
   * - If non-driving modes fail → automatically try driving mode
   * - Provides seamless UX when walking/cycling routes unavailable
   * - Notifies user about the mode switch via snackbar
   *
   * 📊 DISTANCE VALIDATION:
   * - Prevents API calls for destinations < 100 meters away
   * - Uses Euclidean distance approximation for quick calculation
   * - Saves API quota and improves performance
   *
   * 🎯 STATE MANAGEMENT:
   * - Updates route display state (polyline, distance, duration)
   * - Manages loading states for smooth UX
   * - Clears previous route data on errors
   * - Automatically closes modals after route attempts
   */
  const fetchRoutesWithAlternatives = async () => {
    if (!origin || !destination) return; // Guard clause: ensure we have both points

    // DISTANCE VALIDATION: Calculate approximate distance between points
    const latDiff = Math.abs(origin.latitude - destination.latitude);
    const lngDiff = Math.abs(origin.longitude - destination.longitude);
    const approxDistance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

    console.log("Fetching routes with:", {
      origin,
      destination,
      travelMode,
      avoid,
      approxDistance,
    });

    // Prevent API waste for very short distances (< ~100 meters)
    if (approxDistance < 0.001) {
      showSnackbar("Destination is too close to starting point");
      setRoutes([]);
      setRoutePolyline([]);
      setRouteDistance(null);
      setRouteDuration(null);
      setRouteLoading(false);
      setModalVisible(false);
      return;
    }

    setRouteLoading(true); // Start loading state
    try {
      // CORE API CALL: Get multiple route alternatives
      const alternatives = await getRoutesWithAlternatives(
        origin,
        destination,
        travelMode,
        avoid
      );

      // SUCCESS: Process and display route alternatives
      setRoutes(alternatives); // Store all alternatives for comparison
      setSelectedRouteIdx(0); // Default to first route (usually fastest)

      // Display the first route immediately
      setRoutePolyline(alternatives[0].polyline); // Route coordinates for map display
      setRouteDistance(alternatives[0].distance); // Human-readable distance
      setRouteDuration(alternatives[0].duration); // Human-readable duration
    } catch (error) {
      // ERROR HANDLING: Smart fallback and user feedback
      const errorMessage =
        error instanceof Error ? error.message : "Failed to get route";
      console.log("Route fetch error:", errorMessage, "for mode:", travelMode);

      // AUTO-FALLBACK LOGIC: Switch to driving mode if other modes fail
      if (
        travelMode !== "driving" &&
        errorMessage.includes("No routes found")
      ) {
        console.log("Auto-switching to driving mode due to no routes found");
        setTravelMode("driving"); // This will trigger a new route fetch via useEffect
        showSnackbar(`No ${travelMode} routes found. Trying driving mode...`);
      } else {
        // Generic error: show user-friendly message
        showSnackbar(errorMessage);
      }

      // Clear route state on error
      setRoutes([]);
      setRoutePolyline([]);
      setRouteDistance(null);
      setRouteDuration(null);
    } finally {
      setRouteLoading(false); // End loading state
      setModalVisible(false); // Always close modal after route fetch attempt
    }
  };

  /**
   * ROUTE SELECTION HANDLER
   *
   * Allows users to switch between different route alternatives.
   * This is a key feature that sets PathFinder apart - providing choice
   * and comparison between multiple routing options.
   *
   * Updates:
   * - Selected route index for UI highlighting
   * - Map polyline display to show the selected route
   * - Distance and duration metadata in the info panel
   *
   * Note: All route alternatives are pre-fetched, so switching is instant
   */
  const handleSelectRoute = (idx: number) => {
    setSelectedRouteIdx(idx); // Update which route is selected in the UI
    setRoutePolyline(routes[idx].polyline); // Change map display to selected route
    setRouteDistance(routes[idx].distance); // Update distance display
    setRouteDuration(routes[idx].duration); // Update duration display
  };

  // UI for travel mode and avoid options
  const renderTravelModeOptions = () => (
    <View style={styles.optionsRow}>
      {TRAVEL_MODES.map((mode) => (
        <TouchableOpacity
          key={mode}
          style={[
            styles.optionButton,
            travelMode === mode && styles.optionButtonSelected,
          ]}
          onPress={() => setTravelMode(mode)}
        >
          <Text
            style={
              travelMode === mode
                ? styles.optionTextSelected
                : styles.optionText
            }
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderAvoidOptions = () => (
    <View style={styles.optionsRow}>
      {AVOID_OPTIONS.map((opt) => (
        <TouchableOpacity
          key={opt}
          style={[
            styles.optionButton,
            (avoid || []).includes(opt) && styles.optionButtonSelected,
          ]}
          onPress={() =>
            setAvoid((prev) => {
              const currentAvoid = prev || [];
              return currentAvoid.includes(opt)
                ? currentAvoid.filter((a) => a !== opt)
                : [...currentAvoid, opt];
            })
          }
        >
          <Text
            style={
              (avoid || []).includes(opt)
                ? styles.optionTextSelected
                : styles.optionText
            }
          >{`Avoid ${opt.charAt(0).toUpperCase() + opt.slice(1)}`}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  /**
   * OPTIMAL MAP REGION CALCULATOR
   *
   * Calculates the best map viewport to display both origin and destination
   * points with appropriate padding. This ensures users can see the full
   * route context without being too zoomed in or out.
   *
   * Algorithm:
   * 1. Find midpoint between origin and destination
   * 2. Calculate distance spans in both directions
   * 3. Add 50% padding (1.5x multiplier) for comfortable viewing
   * 4. Ensure minimum zoom level (0.01 degrees) for very short routes
   *
   * Map Region Strategy:
   * - Centers map on route midpoint
   * - Includes both start and end points with padding
   * - Maintains readable zoom level for navigation
   * - Handles edge cases like very short distances
   */
  const calculateOptimalRegion = () => {
    if (!origin || !destination) return null;

    // Calculate center point between origin and destination
    const midLat = (origin.latitude + destination.latitude) / 2;
    const midLng = (origin.longitude + destination.longitude) / 2;

    // Calculate distance spans with 50% padding for comfortable viewing
    const latDelta = Math.abs(origin.latitude - destination.latitude) * 1.5;
    const lngDelta = Math.abs(origin.longitude - destination.longitude) * 1.5;

    return {
      latitude: midLat,
      longitude: midLng,
      latitudeDelta: Math.max(latDelta, 0.01), // Minimum zoom level
      longitudeDelta: Math.max(lngDelta, 0.01), // Minimum zoom level
    };
  };

  /**
   * MAP ANIMATION CONTROLLER
   *
   * Smoothly animates map transitions to new regions using react-native-maps
   * built-in animation. Provides smooth UX when switching between routes or
   * updating the view after route calculation.
   *
   * Duration: 1000ms (1 second) for smooth but not sluggish transitions
   */
  const animateToRegion = (newRegion: Region) => {
    if (mapRef.current) {
      mapRef.current.animateToRegion(newRegion, 1000); // 1 second smooth animation
    }
  };

  // Handle place selection
  const handlePlaceSelected = (place: Place) => {
    console.log("Place selected:", place, "searchType:", searchType);
    if (searchType === "from") {
      if (place.placeId === "current_location") {
        getCurrentLocation();
        setFromInput("Current Location");
      } else {
        setOrigin(place.coordinates);
        const newRegion = {
          ...place.coordinates,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setRegion(newRegion);
        animateToRegion(newRegion);
        setFromInput(place.name);
      }
    } else {
      setDestination(place.coordinates);
      setToInput(place.name);
    }
    setShowSearch(false);
  };

  const openSearch = (type: "from" | "to") => {
    setSearchType(type);
    setShowSearch(true);
  };

  /**
   * ROUTE EXISTENCE CHECKER
   *
   * Determines if we have a valid, complete route to display.
   * Used throughout the component to conditionally render route-related UI.
   */
  const hasRoute = routeDistance && routeDuration && !routeLoading;

  /**
   * AUTOMATIC MAP ZOOM EFFECT
   *
   * Automatically adjusts the map view to show the complete route when
   * a route is successfully calculated. This provides immediate visual
   * feedback and context to users after route planning.
   *
   * Behavior:
   * - Triggers when a route becomes available (hasRoute becomes true)
   * - Calculates optimal viewport to show both origin and destination
   * - Smoothly animates to the new region
   * - Only runs when we have valid origin/destination coordinates
   *
   * This creates a "zoom to fit" behavior similar to other mapping apps
   */
  useEffect(() => {
    if (hasRoute && origin && destination) {
      const optimalRegion = calculateOptimalRegion();
      if (optimalRegion) {
        setRegion(optimalRegion); // Update region state
        animateToRegion(optimalRegion); // Smoothly animate to new view
      }
    }
  }, [hasRoute]); // Runs when route calculation completes

  const resetRoute = () => {
    console.log("resetRoute called");
    setDestination(null);
    setRoutes([]);
    setSelectedRouteIdx(0);
    setRoutePolyline([]);
    setRouteDistance(null);
    setRouteDuration(null);
    setToInput("");
    // Reset to current location view
    if (origin) {
      const newRegion = {
        ...origin,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(newRegion);
      animateToRegion(newRegion);
    }
  };

  // Debug logs for modal state
  useEffect(() => {
    console.log("modalVisible:", modalVisible, "hasRoute:", hasRoute);
  }, [modalVisible, hasRoute]);

  // Add log when opening modal
  const handleOpenModal = () => {
    console.log("Opening modal");
    setModalVisible(true);
  };

  // When user changes travel mode or avoid filters
  useEffect(() => {
    console.log("Filters set:", { travelMode, avoid });
  }, [travelMode, avoid]);

  console.log("Rendering: hasRoute:", hasRoute, "modalVisible:", modalVisible);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.background.primary}
      />
      <View style={styles.mapContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary[500]} />
            <Text>Getting your location...</Text>
            {errorMsg && (
              <Text style={{ color: Colors.error[500], marginTop: 8 }}>
                {errorMsg}
              </Text>
            )}
            {errorMsg && (
              <Button
                title="Retry"
                onPress={getCurrentLocation}
                variant="outline"
                size="small"
                style={{ marginTop: 12 }}
              />
            )}
          </View>
        ) : (
          /**
           * INTERACTIVE MAP COMPONENT
           *
           * Core map display using react-native-maps with Google Maps backend.
           * Provides full interactive mapping with custom overlays and markers.
           *
           * 🗺️ MAP CONFIGURATION:
           * - ref: Enables programmatic control (zoom, animate, etc.)
           * - region: Controlled map viewport (lat, lng, zoom levels)
           * - onPress: Tap-to-select destination functionality
           * - showsUserLocation: Built-in blue dot for current location
           * - showsMyLocationButton: Native "center on user" button
           * - mapType: "standard" for regular map view (vs satellite/hybrid)
           *
           * 📍 MARKER SYSTEM:
           * - Origin marker (aqua/cyan): User's current location
           * - Destination marker (red): Selected destination point
           * - Color coding provides instant visual distinction
           *
           * 🛣️ ROUTE VISUALIZATION:
           * - Polyline overlay shows the selected route path
           * - Custom color (primary theme) for brand consistency
           * - 4px stroke width for clear visibility without obstruction
           * - Only renders when route data is available
           */
          <MapView
            ref={mapRef} // Reference for programmatic map control
            style={styles.map}
            region={region || undefined} // Controlled viewport state
            onPress={handleMapPress} // Tap-to-select destination
            showsUserLocation={true} // Built-in current location indicator
            showsMyLocationButton={true} // Native location centering button
            mapType="standard" // Standard map view (roads, labels, etc.)
          >
            {/* ORIGIN MARKER - User's current location */}
            {origin && (
              <Marker
                coordinate={origin}
                title="Origin"
                description="Current Location"
                pinColor="aqua" // Distinctive color for starting point
              />
            )}

            {/* DESTINATION MARKER - Selected destination */}
            {destination && (
              <Marker
                coordinate={destination}
                title="Destination"
                pinColor="red" // Standard destination color
              />
            )}

            {/* ROUTE POLYLINE - Visual route path */}
            {routePolyline.length > 0 && (
              <Polyline
                coordinates={routePolyline} // Array of lat/lng points from Google API
                strokeColor={Colors.primary[500]} // Theme-consistent route color
                strokeWidth={4} // Clear visibility without obstruction
              />
            )}
          </MapView>
        )}
      </View>

      {/* Bottom Panel - absolutely positioned */}
      <SafeAreaView
        edges={["bottom"]}
        style={[
          styles.bottomPanel,
          hasRoute
            ? { maxHeight: height * 0.55, paddingBottom: insets.bottom + 16 }
            : {},
        ]}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {routeLoading && (
            <View style={styles.routeCard}>
              <ActivityIndicator size="small" color={Colors.primary[500]} />
              <Text>Calculating route...</Text>
            </View>
          )}

          {hasRoute && (
            <View style={styles.routeInfoCard}>
              <View style={styles.routeInfoHeader}>
                <Text style={styles.routeInfoIcon}>📍</Text>
                <View style={styles.routeInfoHeaderText}>
                  <Text style={styles.routeInfoTitle}>Route Found</Text>
                  <Text style={styles.routeInfoSubtitle}>
                    {travelMode.charAt(0).toUpperCase() + travelMode.slice(1)}{" "}
                    route
                  </Text>
                </View>
              </View>
              <View style={styles.routeInfoDivider} />
              <View style={styles.routeInfoRow}>
                <View style={styles.routeInfoItem}>
                  <Text style={styles.routeInfoLabel}>Distance</Text>
                  <Text style={styles.routeInfoValue}>{routeDistance}</Text>
                </View>
                <View style={styles.routeInfoSeparator} />
                <View style={styles.routeInfoItem}>
                  <Text style={styles.routeInfoLabel}>Duration</Text>
                  <Text style={styles.routeInfoValue}>{routeDuration}</Text>
                </View>
              </View>
            </View>
          )}
          {/* ROUTE ALTERNATIVES SELECTOR - Core PathFinder Feature */}
          {hasRoute && routes.length > 1 && (
            /**
             * HORIZONTAL ROUTE COMPARISON UI
             *
             * This is PathFinder's signature feature - allowing users to compare
             * and select between multiple route alternatives in a clean, horizontal
             * scrollable interface.
             *
             * 🛣️ ROUTE LABELING SYSTEM:
             * - First route (index 0): Always labeled "Fastest" (Google's primary route)
             * - Other routes: Use Google's summary (e.g., "via I-95") or fallback numbering
             *
             * 📊 ROUTE METADATA DISPLAY:
             * - Distance and duration for all routes
             * - Traffic-adjusted duration for driving routes (when different from standard)
             * - Visual selection state with different styling
             *
             * 🎯 INTERACTION DESIGN:
             * - Horizontal scroll for easy comparison
             * - Touch feedback with visual selection state
             * - Instant route switching without API calls
             * - Consistent spacing and visual hierarchy
             */
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.routesSelector}
              contentContainerStyle={{
                gap: 12, // Consistent spacing between route options
                paddingHorizontal: 16,
                paddingVertical: 8,
              }}
            >
              {routes.map((route, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.routeOption,
                    idx === selectedRouteIdx && styles.routeOptionSelected, // Visual selection state
                  ]}
                  onPress={() => handleSelectRoute(idx)} // Instant route switching
                >
                  {/* ROUTE LABEL - Smart naming system */}
                  <Text style={styles.routeOptionLabel}>
                    {idx === 0
                      ? "Fastest" // First route is always the fastest
                      : route.summary || `Route ${idx + 1}`}{" "}
                    // Use Google summary or fallback
                  </Text>

                  {/* BASIC ROUTE INFO - Distance and duration */}
                  <Text style={styles.routeOptionInfo}>
                    {route.distance} • {route.duration}
                  </Text>

                  {/* TRAFFIC INFO - Only show if different from standard duration */}
                  {route.trafficDuration &&
                    route.trafficDuration !== route.duration && (
                      <Text style={styles.routeOptionTraffic}>
                        Traffic: {route.trafficDuration}
                      </Text>
                    )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          {hasRoute && (
            <View style={styles.filtersContainer}>
              <Text style={styles.filtersTitle}>Travel Mode</Text>
              {renderTravelModeOptions()}
              <Text style={styles.filtersTitle}>Avoid</Text>
              {renderAvoidOptions()}
            </View>
          )}
          {hasRoute && (
            <View style={styles.actionButtonsContainer}>
              <View style={styles.actionButtons}>
                <View style={styles.actionButtonWrapper}>
                  <Button
                    title="Change Route"
                    onPress={handleOpenModal}
                    variant="secondary"
                  />
                </View>
                <View style={styles.actionButtonWrapper}>
                  <Button
                    title="Reset"
                    onPress={resetRoute}
                    variant="secondary"
                  />
                </View>
              </View>
            </View>
          )}
          {!hasRoute && (
            <View style={styles.whereToContainer}>
              <Button
                title="Where to?"
                onPress={handleOpenModal}
                variant="primary"
                size="large"
              />
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Full-screen Modal for place search */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.fullModalContainer}>
          <Text style={styles.modalTitle}>Select Route</Text>
          <View style={styles.searchCard}>
            <Text style={styles.inputLabel}>From</Text>
            <Pressable
              style={styles.searchInput}
              onPress={() => openSearch("from")}
            >
              <Text style={styles.searchInputText}>
                {fromInput || "Search starting point"}
              </Text>
            </Pressable>
          </View>
          <View style={styles.searchCard}>
            <Text style={styles.inputLabel}>To</Text>
            <Pressable
              style={styles.searchInput}
              onPress={() => openSearch("to")}
            >
              <Text style={styles.searchInputText}>
                {toInput || "Search destination"}
              </Text>
            </Pressable>
          </View>
          <Pressable
            style={styles.closeModalButton}
            onPress={() => setModalVisible(false)}
          >
            <Text style={{ color: Colors.primary[700] }}>Close</Text>
          </Pressable>
        </SafeAreaView>
      </Modal>

      {/* FullScreenSearch component */}
      <FullScreenSearch
        visible={showSearch}
        onClose={() => setShowSearch(false)}
        onPlaceSelected={handlePlaceSelected}
        currentLocation={origin || undefined}
        initialValue={searchType === "from" ? fromInput : toInput}
        placeholder={
          searchType === "from" ? "Search a place" : "Search destination"
        }
        label={searchType === "from" ? "From" : "To"}
        hideCurrentLocation={searchType === "to"}
      />

      {/* Snackbar */}
      {snackbarVisible && (
        <View style={styles.snackbar}>
          <Text style={styles.snackbarText}>{snackbarMessage}</Text>
          <TouchableOpacity
            onPress={() => setSnackbarVisible(false)}
            style={styles.snackbarCloseButton}
          >
            <Text style={styles.snackbarCloseText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  mapContainer: {
    height: height * 0.6,
    width: "100%",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
  routeCard: {
    backgroundColor: Colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.primary[100],
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  snackbar: {
    position: "absolute",
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: Colors.error[600],
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  snackbarText: {
    color: Colors.background.primary,
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
    marginRight: 12,
  },
  snackbarCloseButton: {
    padding: 4,
  },
  snackbarCloseText: {
    color: Colors.background.primary,
    fontSize: 16,
    fontWeight: "bold",
  },
  routeText: {
    fontSize: 16,
    color: Colors.text.primary,
    marginVertical: 2,
  },
  filtersContainer: {
    padding: 16,
    backgroundColor: Colors.background.primary,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 8,
  },
  optionsRow: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 8,
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary[200],
    backgroundColor: Colors.background.primary,
    marginRight: 8,
  },
  optionButtonSelected: {
    backgroundColor: Colors.primary[100],
    borderColor: Colors.primary[500],
  },
  optionText: {
    color: Colors.text.primary,
    fontSize: 14,
  },
  optionTextSelected: {
    color: Colors.primary[700],
    fontWeight: "700",
    fontSize: 14,
  },
  whereToContainer: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  fullModalContainer: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    padding: 16,
  },
  searchCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
    marginLeft: 4,
  },
  searchInput: {
    backgroundColor: Colors.background.primary,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.primary[200],
    minHeight: 44,
  },
  searchInputText: {
    color: Colors.text.primary,
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    color: Colors.text.primary,
  },
  closeModalButton: {
    marginTop: 24,
    padding: 10,
    borderRadius: 8,
    backgroundColor: Colors.primary[100],
  },
  actionButtonsContainer: {
    padding: 16,
    backgroundColor: "Colors.background.primary",
    alignItems: "center",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
  },
  actionButtonWrapper: {
    flex: 1,
  },
  routeInfoCard: {
    backgroundColor: Colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.primary[100],
    padding: 16,
    marginBottom: 8,
  },
  routeInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  routeInfoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  routeInfoHeaderText: {
    flex: 1,
  },
  routeInfoTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text.primary,
    marginBottom: 2,
  },
  routeInfoSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  routeInfoDivider: {
    height: 1,
    backgroundColor: Colors.primary[200],
    width: "100%",
    marginVertical: 12,
  },
  routeInfoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  routeInfoItem: {
    flex: 1,
    alignItems: "center",
  },
  routeInfoLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  routeInfoValue: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.primary[700],
  },
  routeInfoSeparator: {
    width: 1,
    height: 40,
    backgroundColor: Colors.primary[200],
  },
  bottomPanel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.background.primary,
    width: "100%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 8,
  },
  routesSelector: {
    marginBottom: 8,
  },
  routeOption: {
    backgroundColor: Colors.primary[50],
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.primary[100],
    alignItems: "center",
    minWidth: 110,
  },
  routeOptionSelected: {
    backgroundColor: Colors.primary[100],
    borderColor: Colors.primary[500],
  },
  routeOptionLabel: {
    fontWeight: "700",
    color: Colors.primary[700],
    marginBottom: 2,
  },
  routeOptionInfo: {
    fontSize: 14,
    color: Colors.text.primary,
  },
  routeOptionTraffic: {
    fontSize: 12,
    color: Colors.error[500],
    marginTop: 2,
  },
});
