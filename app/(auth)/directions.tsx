import React, { useState } from "react";
import {
  Alert,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView from "react-native-maps";
import { Button } from "../../src/components/ui/Button";
import { Colors } from "../../src/constants/Colors";
import { Spacing } from "../../src/constants/Spacing";

export default function DirectionsPage() {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);

  const handleLocateMe = () => {
    Alert.alert("Locate Me", "This will get your current location");
    // TODO: Implement current location functionality
  };

  const handleSelectDestination = () => {
    Alert.alert("Select Destination", "This will open location picker");
    // TODO: Implement destination selection
  };

  const handleGetDirections = () => {
    if (!origin || !destination) {
      Alert.alert("Error", "Please select both origin and destination");
      return;
    }
    Alert.alert("Get Directions", "This will calculate the route");
    // TODO: Implement route calculation
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.background.primary}
      />

      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: 37.78825,
            longitude: -122.4324,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          {/* TODO: Add markers for origin and destination */}
        </MapView>
      </View>

      {/* Control Panel */}
      <View style={styles.controlPanel}>
        <View style={styles.locationInfo}>
          <Text style={styles.locationLabel}>From:</Text>
          <Text style={styles.locationText}>
            {origin
              ? "Location selected"
              : 'Tap "Locate Me" or select location'}
          </Text>

          <Text style={styles.locationLabel}>To:</Text>
          <Text style={styles.locationText}>
            {destination ? "Location selected" : 'Tap "Select Destination"'}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="📍 Locate Me"
            onPress={handleLocateMe}
            variant="primary"
            size="medium"
            style={styles.button}
          />

          <Button
            title="🎯 Select Destination"
            onPress={handleSelectDestination}
            variant="outline"
            size="medium"
            style={styles.button}
          />

          <Button
            title="🚀 Get Directions"
            onPress={handleGetDirections}
            variant="primary"
            size="large"
            style={styles.directionsButton}
            disabled={!origin || !destination}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  controlPanel: {
    backgroundColor: Colors.background.primary,
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  locationInfo: {
    marginBottom: Spacing.md,
  },
  locationLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
    marginTop: Spacing.sm,
  },
  locationText: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  buttonContainer: {
    gap: Spacing.sm,
  },
  button: {
    marginBottom: Spacing.xs,
  },
  directionsButton: {
    marginTop: Spacing.sm,
  },
});
