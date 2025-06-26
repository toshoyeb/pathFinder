import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { LatLng, Marker, Region } from "react-native-maps";
import { Button } from "../../src/components/ui/Button";
import { Colors } from "../../src/constants/Colors";

const { height } = Dimensions.get("window");

export default function DirectionsPage() {
  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [initialRegion, setInitialRegion] = useState<Region | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    getCurrentLocation();
  }, []);

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
          </MapView>
        )}
      </View>
      {/* The rest of the UI (card, filters, etc.) will be added in next steps */}
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
});
