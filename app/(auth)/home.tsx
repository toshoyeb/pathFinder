import auth from "@react-native-firebase/auth";
import React from "react";
import { ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../src/components/ui/Button";
import { Card } from "../../src/components/ui/Card";
import { Colors } from "../../src/constants/Colors";
import { Spacing } from "../../src/constants/Spacing";

export default function HomePage() {
  const user = auth().currentUser;

  const handleLogout = async () => {
    try {
      await auth().signOut();
    } catch (error) {
      console.error("Logout error:", error);
    }
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
          />
        </View>

        {/* Welcome Card */}
        <Card variant="elevated" style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>🧭 PathFinder</Text>
          <Text style={styles.welcomeSubtitle}>
            Your intelligent navigation companion
          </Text>
          <Text style={styles.welcomeDescription}>
            Ready to discover optimized routes? Let's start exploring with smart
            navigation features.
          </Text>
        </Card>

        {/* Features Grid */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>What's Next?</Text>
          <View style={styles.featuresGrid}>
            <Card variant="default" style={styles.featureCard}>
              <Text style={styles.featureIcon}>🗺️</Text>
              <Text style={styles.featureTitle}>Map View</Text>
              <Text style={styles.featureDescription}>
                Interactive map with route planning
              </Text>
            </Card>

            <Card variant="default" style={styles.featureCard}>
              <Text style={styles.featureIcon}>📍</Text>
              <Text style={styles.featureTitle}>Location Search</Text>
              <Text style={styles.featureDescription}>
                Find and select destinations
              </Text>
            </Card>

            <Card variant="default" style={styles.featureCard}>
              <Text style={styles.featureIcon}>⚡</Text>
              <Text style={styles.featureTitle}>Route Optimization</Text>
              <Text style={styles.featureDescription}>
                Smart pathfinding algorithms
              </Text>
            </Card>

            <Card variant="default" style={styles.featureCard}>
              <Text style={styles.featureIcon}>📊</Text>
              <Text style={styles.featureTitle}>Analytics</Text>
              <Text style={styles.featureDescription}>
                Track your navigation history
              </Text>
            </Card>
          </View>
        </View>

        {/* Coming Soon */}
        <Card variant="outlined" style={styles.comingSoonCard}>
          <Text style={styles.comingSoonTitle}>🚀 Coming Soon</Text>
          <Text style={styles.comingSoonDescription}>
            We're working hard to bring you advanced features like real-time
            traffic updates, multiple route options, and offline navigation.
          </Text>
        </Card>
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
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  userEmail: {
    color: Colors.text.secondary,
  },
  welcomeCard: {
    marginBottom: Spacing.xl,
  },
  welcomeTitle: {
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  welcomeSubtitle: {
    color: Colors.primary[600],
    marginBottom: Spacing.md,
  },
  welcomeDescription: {
    color: Colors.text.secondary,
  },
  featuresSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  featureCard: {
    width: "48%",
    alignItems: "center",
    padding: Spacing.md,
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  featureTitle: {
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  featureDescription: {
    color: Colors.text.secondary,
    textAlign: "center",
  },
  comingSoonCard: {
    marginBottom: Spacing.lg,
  },
  comingSoonTitle: {
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  comingSoonDescription: {
    color: Colors.text.secondary,
  },
});
