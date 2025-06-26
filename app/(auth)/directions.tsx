import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { LatLng, Marker, Polyline, Region } from "react-native-maps";
import { Button } from "../../src/components/ui/Button";
import { FullScreenSearch } from "../../src/components/ui/FullScreenSearch";
import { Colors } from "../../src/constants/Colors";
import { getRouteBetweenPoints } from "../../src/services/directionsService";

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
  const [initialRegion, setInitialRegion] = useState<Region | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
  const [fromInput, setFromInput] = useState("Current Location");
  const [toInput, setToInput] = useState("");
  const [searchType, setSearchType] = useState<"from" | "to">("from");
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (origin && destination) {
      fetchRoute();
    } else {
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
      setInitialRegion({
        ...currentCoord,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
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

  const fetchRoute = async () => {
    if (!origin || !destination) return;
    setRouteLoading(true);
    setRouteError(null);
    try {
      const result = await getRouteBetweenPoints(
        origin,
        destination,
        travelMode,
        avoid
      );
      setRoutePolyline(result.polyline);
      setRouteDistance(result.distance);
      setRouteDuration(result.duration);
    } catch (error) {
      setRouteError(
        error instanceof Error ? error.message : "Failed to get route"
      );
      setRoutePolyline([]);
      setRouteDistance(null);
      setRouteDuration(null);
    } finally {
      setRouteLoading(false);
    }
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

  // Handle place selection
  const handlePlaceSelected = (place: Place) => {
    if (searchType === "from") {
      if (place.placeId === "current_location") {
        getCurrentLocation();
        setFromInput("Current Location");
      } else {
        setOrigin(place.coordinates);
        setInitialRegion({
          ...place.coordinates,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        setFromInput(place.name);
      }
    } else {
      setDestination(place.coordinates);
      setToInput(place.name);
      setModalVisible(false);
    }
    setShowSearch(false);
  };

  const openSearch = (type: "from" | "to") => {
    setSearchType(type);
    setShowSearch(true);
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
            style={styles.map}
            initialRegion={initialRegion || undefined}
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
              />
            )}
            {destination && (
              <Marker
                coordinate={destination}
                title="Destination"
                pinColor="blue"
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
      {/* Route info card */}
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
      {routeDistance && routeDuration && !routeLoading && !routeError && (
        <View style={styles.routeCard}>
          <Text style={styles.routeText}>Distance: {routeDistance}</Text>
          <Text style={styles.routeText}>Duration: {routeDuration}</Text>
        </View>
      )}
      {/* Optimization filters */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filtersTitle}>Travel Mode</Text>
        {renderTravelModeOptions()}
        <Text style={styles.filtersTitle}>Avoid</Text>
        {renderAvoidOptions()}
      </View>
      {/* Where to? button */}
      <View style={styles.whereToContainer}>
        <Button
          title="Where to?"
          onPress={() => setModalVisible(true)}
          variant="primary"
          size="large"
        />
      </View>

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
          searchType === "from" ? "Search starting point" : "Search destination"
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
    padding: 16,
    backgroundColor: Colors.background.primary,
    alignItems: "center",
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
});
