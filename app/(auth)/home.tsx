import auth from "@react-native-firebase/auth";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../src/components/ui/Button";
import { Colors } from "../../src/constants/Colors";
import { Spacing } from "../../src/constants/Spacing";

export default function HomePage() {
  const user = auth().currentUser;
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await auth().signOut();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleGetDirections = () => {
    router.push("/(auth)/directions");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.background.primary}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back!</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
          <Button
            title="Logout"
            onPress={handleLogout}
            variant="outline"
            size="small"
            textStyle={{ color: "black" }}
            style={{ backgroundColor: "#fff", borderColor: "black" }}
          />
        </View>

        {/* Main Action */}
        <View style={styles.mainAction}>
          <Text style={styles.mainTitle}>🧭 PathFinder</Text>
          <Text style={styles.mainSubtitle}>
            Your intelligent navigation companion
          </Text>
          <Button
            title="🗺️ Get Directions"
            onPress={handleGetDirections}
            variant="primary"
            size="large"
            style={styles.directionsButton}
          />
        </View>

        {/* Quick Features
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.featuresGrid}>
            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>📍</Text>
              <Text style={styles.featureTitle}>Current Location</Text>
              <Text style={styles.featureDescription}>
                Get your current position
              </Text>
            </View>

            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>🎯</Text>
              <Text style={styles.featureTitle}>Route Planning</Text>
              <Text style={styles.featureDescription}>
                Plan optimized routes
              </Text>
            </View>
          </View>
        </View> */}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screen.paddingHorizontal,
    paddingVertical: Spacing.screen.paddingVertical,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  mainAction: {
    alignItems: "center",
    marginBottom: Spacing.xl,
    paddingVertical: Spacing.xl,
    flex: 1,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  mainSubtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  directionsButton: {
    minWidth: 200,
    backgroundColor: "grey",
  },
  featuresSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },
  featuresGrid: {
    gap: Spacing.md,
  },
  featureCard: {
    backgroundColor: Colors.background.secondary,
    padding: Spacing.md,
    borderRadius: Spacing.card.borderRadius,
    alignItems: "center",
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  featureDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center",
  },
});
