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

const TRAVEL_MODES = ["driving", "walking", "bicycling", "transit"] as const;
type TravelMode = typeof TRAVEL_MODES[number];
const AVOID_OPTIONS = ["tolls", "highways", "ferries"] as const;
type AvoidOption = typeof AVOID_OPTIONS[number];

interface Place {
  placeId: string;
  name: string;
  address: string;
  coordinates: { latitude: number; longitude: number };
}

export default function DirectionsPage() {
  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);

  // Route state
  const [routePolyline, setRoutePolyline] = useState<LatLng[]>([]);
  const [routeDistance, setRouteDistance] = useState<string | null>(null);
  const [routeDuration, setRouteDuration] = useState<string | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  // Optimization state
  const [travelMode, setTravelMode] = useState<TravelMode>("driving");
  const [avoid, setAvoid] = useState<AvoidOption[]>([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [fromInput, setFromInput] = useState("");
  const [toInput, setToInput] = useState("");
  const [searchType, setSearchType] = useState<"from" | "to">("from");
  const [showSearch, setShowSearch] = useState(false);

  const [routes, setRoutes] = useState<any[]>([]); // All route alternatives
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0); // Index of selected route

  const insets = useSafeAreaInsets();

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (origin && destination) {
      fetchRoutesWithAlternatives();
    } else {
      setRoutes([]);
      setSelectedRouteIdx(0);
      setRoutePolyline([]);
      setRouteDistance(null);
      setRouteDuration(null);
      setRouteError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin, destination, travelMode, avoid]);

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        setLoading(false);
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      const currentCoord = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setOrigin(currentCoord);
      const newRegion = {
        ...currentCoord,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
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

  const handleMapPress = (e: any) => {
    setDestination(e.nativeEvent.coordinate);
  };

  const fetchRoutesWithAlternatives = async () => {
    if (!origin || !destination) return;
    setRouteLoading(true);
    setRouteError(null);
    try {
      const alternatives = await getRoutesWithAlternatives(
        origin,
        destination,
        travelMode,
        avoid
      );
      setRoutes(alternatives);
      setSelectedRouteIdx(0);
      // Set the first route as default
      setRoutePolyline(alternatives[0].polyline);
      setRouteDistance(alternatives[0].distance);
      setRouteDuration(alternatives[0].duration);
    } catch (error) {
      setRouteError(
        error instanceof Error ? error.message : "Failed to get route"
      );
      setRoutes([]);
      setRoutePolyline([]);
      setRouteDistance(null);
      setRouteDuration(null);
    } finally {
      setRouteLoading(false);
    }
  };

  // When user selects a different route
  const handleSelectRoute = (idx: number) => {
    setSelectedRouteIdx(idx);
    setRoutePolyline(routes[idx].polyline);
    setRouteDistance(routes[idx].distance);
    setRouteDuration(routes[idx].duration);
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

  // Calculate optimal region for both points
  const calculateOptimalRegion = () => {
    if (!origin || !destination) return null;

    const midLat = (origin.latitude + destination.latitude) / 2;
    const midLng = (origin.longitude + destination.longitude) / 2;
    const latDelta = Math.abs(origin.latitude - destination.latitude) * 1.5;
    const lngDelta = Math.abs(origin.longitude - destination.longitude) * 1.5;

    return {
      latitude: midLat,
      longitude: midLng,
      latitudeDelta: Math.max(latDelta, 0.01),
      longitudeDelta: Math.max(lngDelta, 0.01),
    };
  };

  // Animate to region
  const animateToRegion = (newRegion: Region) => {
    if (mapRef.current) {
      mapRef.current.animateToRegion(newRegion, 1000);
    }
  };

  // Handle place selection
  const handlePlaceSelected = (place: Place) => {
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
      setModalVisible(false);

      // Zoom to fit both origin and destination
      if (origin) {
        const optimalRegion = calculateOptimalRegion();
        if (optimalRegion) {
          setRegion(optimalRegion);
          animateToRegion(optimalRegion);
        }
      }
    }
    setShowSearch(false);
  };

  const openSearch = (type: "from" | "to") => {
    setSearchType(type);
    setShowSearch(true);
  };

  const hasRoute =
    routeDistance && routeDuration && !routeLoading && !routeError;

  // Update region when route is calculated
  useEffect(() => {
    if (hasRoute && origin && destination) {
      const optimalRegion = calculateOptimalRegion();
      if (optimalRegion) {
        setRegion(optimalRegion);
        animateToRegion(optimalRegion);
      }
    }
  }, [hasRoute]);

  const resetRoute = () => {
    setDestination(null);
    setRoutePolyline([]);
    setRouteDistance(null);
    setRouteDuration(null);
    setRouteError(null);
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
          <MapView
            ref={mapRef}
            style={styles.map}
            region={region || undefined}
            onPress={handleMapPress}
            showsUserLocation={true}
            showsMyLocationButton={true}
            mapType="standard"
          >
            {origin && (
              <Marker
                coordinate={origin}
                title="Origin"
                description="Current Location"
                pinColor="aqua"
              />
            )}
            {destination && (
              <Marker
                coordinate={destination}
                title="Destination"
                pinColor="red"
              />
            )}
            {routePolyline.length > 0 && (
              <Polyline
                coordinates={routePolyline}
                strokeColor={Colors.primary[500]}
                strokeWidth={4}
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
          {routeError && (
            <View style={styles.routeCard}>
              <Text style={{ color: Colors.error[500] }}>{routeError}</Text>
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
          {hasRoute && routes.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.routesSelector}
              contentContainerStyle={{
                gap: 12,
                paddingHorizontal: 16,
                paddingVertical: 8,
              }}
            >
              {routes.map((route, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.routeOption,
                    idx === selectedRouteIdx && styles.routeOptionSelected,
                  ]}
                  onPress={() => handleSelectRoute(idx)}
                >
                  <Text style={styles.routeOptionLabel}>
                    {idx === 0
                      ? "Fastest"
                      : route.summary || `Route ${idx + 1}`}
                  </Text>
                  <Text style={styles.routeOptionInfo}>
                    {route.distance} • {route.duration}
                  </Text>
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
                    onPress={() => setModalVisible(true)}
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
                onPress={() => setModalVisible(true)}
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
