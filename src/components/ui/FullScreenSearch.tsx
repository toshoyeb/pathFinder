import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Keyboard,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "../../constants/Colors";
import { Spacing } from "../../constants/Spacing";
import {
  getPlaceAutocomplete,
  getPlaceDetails,
} from "../../services/placesService";

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface Place {
  placeId: string;
  name: string;
  address: string;
  coordinates: Coordinate;
}

interface FullScreenSearchProps {
  visible: boolean;
  onClose: () => void;
  onPlaceSelected: (place: Place) => void;
  currentLocation?: Coordinate;
  initialValue?: string;
  placeholder?: string;
  label?: string;
  hideCurrentLocation?: boolean;
}

export const FullScreenSearch: React.FC<FullScreenSearchProps> = ({
  visible,
  onClose,
  onPlaceSelected,
  currentLocation,
  initialValue = "",
  placeholder = "Search for a place",
  label = "Search",
  hideCurrentLocation = false,
}) => {
  const [searchText, setSearchText] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentLocationAddress, setCurrentLocationAddress] = useState<string>(
    ""
  );
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setSearchText(initialValue);
      setSuggestions([]);

      // Pre-fetch current location address
      if (currentLocation) {
        fetchCurrentLocationAddress();
      }

      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        inputRef.current?.focus();
      });
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      Keyboard.dismiss();
      setSuggestions([]);
      setCurrentLocationAddress("");
    }
  }, [visible, currentLocation, label]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchText.length > 2) {
        searchPlaces();
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchText]);

  const searchPlaces = async () => {
    setIsLoading(true);
    try {
      const results = await getPlaceAutocomplete(searchText, currentLocation);
      setSuggestions(results);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionPress = async (suggestion: any) => {
    try {
      const placeDetails = await getPlaceDetails(suggestion.placeId);
      if (placeDetails) {
        onPlaceSelected(placeDetails);
        onClose();
      }
    } catch (error) {
      console.error("Error getting place details:", error);
    }
  };

  const fetchCurrentLocationAddress = async () => {
    if (!currentLocation) return;

    setIsLoadingAddress(true);
    try {
      const { reverseGeocode } = await import("../../services/placesService");
      const place = await reverseGeocode(currentLocation);
      if (place) {
        setCurrentLocationAddress(place.address);
      }
    } catch (error) {
      console.error("Error fetching current location address:", error);
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const handleCurrentLocationPress = async () => {
    if (currentLocation) {
      const address = currentLocationAddress || "Current Location";

      onPlaceSelected({
        placeId: "current_location",
        name: address,
        address: address,
        coordinates: currentLocation,
      });
      onClose();
    }
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  return (
    <Modal
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      transparent
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.backIcon}>←</Text>
              </TouchableOpacity>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{label}</Text>
                <TextInput
                  ref={inputRef}
                  style={styles.input}
                  placeholder={placeholder}
                  placeholderTextColor={Colors.text.secondary}
                  value={searchText}
                  onChangeText={setSearchText}
                  autoFocus
                  returnKeyType="search"
                />
              </View>
            </View>

            <View style={styles.divider} />

            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={Colors.primary[500]} />
              </View>
            )}

            {!isLoading &&
              searchText.length === 0 &&
              currentLocation &&
              suggestions.length === 0 &&
              !hideCurrentLocation && (
                <TouchableOpacity
                  style={styles.currentLocationItem}
                  onPress={handleCurrentLocationPress}
                  disabled={isLoadingAddress}
                >
                  <View style={styles.currentLocationIcon}>
                    {isLoadingAddress ? (
                      <ActivityIndicator
                        size="small"
                        color={Colors.primary[500]}
                      />
                    ) : (
                      <Text style={styles.currentLocationEmoji}>📍</Text>
                    )}
                  </View>
                  <View style={styles.suggestionContent}>
                    <Text style={styles.currentLocationText}>
                      {isLoadingAddress
                        ? "Getting location..."
                        : "Your location"}
                    </Text>
                    <Text
                      style={styles.currentLocationSubtext}
                      numberOfLines={2}
                    >
                      {isLoadingAddress
                        ? "Please wait..."
                        : currentLocationAddress ||
                          "Tap to use current location"}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.placeId}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => handleSuggestionPress(item)}
                >
                  <View style={styles.suggestionIcon}>
                    <Text style={styles.suggestionEmoji}>📍</Text>
                  </View>
                  <View style={styles.suggestionContent}>
                    <Text style={styles.suggestionMainText}>
                      {item.mainText}
                    </Text>
                    <Text style={styles.suggestionSecondaryText}>
                      {item.secondaryText}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              style={styles.suggestionsList}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.listContent}
            />
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    marginTop: Platform.OS === "ios" ? 50 : 30,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.sm,
    marginTop: Spacing.sm,
  },
  backIcon: {
    fontSize: 24,
    color: Colors.text.primary,
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  input: {
    fontSize: 18,
    color: Colors.text.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: 0,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.primary[200],
    marginHorizontal: Spacing.md,
  },
  loadingContainer: {
    paddingVertical: Spacing.xl,
    alignItems: "center",
  },
  currentLocationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.primary[50],
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary[100],
  },
  currentLocationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary[100],
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  currentLocationEmoji: {
    fontSize: 20,
  },
  currentLocationText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.primary[700],
    marginBottom: 2,
  },
  currentLocationSubtext: {
    fontSize: 14,
    color: Colors.text.primary,
    marginTop: 2,
    lineHeight: 18,
  },
  suggestionsList: {
    flex: 1,
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  suggestionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary[100],
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  suggestionEmoji: {
    fontSize: 18,
    opacity: 0.7,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionMainText: {
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: "500",
  },
  suggestionSecondaryText: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
});
