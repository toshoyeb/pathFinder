import { useRouter } from "expo-router";
import React from "react";
import {
  Dimensions,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button } from "../src/components/ui/Button";
import { Card } from "../src/components/ui/Card";
import { LottieAnimation } from "../src/components/ui/LottieAnimation";
import { Colors } from "../src/constants/Colors";
import { Spacing } from "../src/constants/Spacing";

const { width, height } = Dimensions.get("window");

export default function LandingPage() {
  const router = useRouter();

  const handleLoginPress = () => {
    router.push("/login");
  };

  const handleSignupPress = () => {
    router.push("/signup");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.background.primary}
      />

      {/* Lottie animation as the hero/branding */}
      <View style={styles.animationContainer}>
        <LottieAnimation
          source={require("../assets/landing.json")}
          style={styles.lottieAnimation}
          autoPlay
          loop
          speed={1}
        />
      </View>

      <Card variant="elevated" style={styles.featuresCard}>
        <Text style={styles.featuresTitle}>Why PathFinder?</Text>
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🗺️</Text>
            <Text style={styles.featureText}>Smart Route Optimization</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>⚡</Text>
            <Text style={styles.featureText}>Real-time Navigation</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🔒</Text>
            <Text style={styles.featureText}>Secure & Private</Text>
          </View>
        </View>
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          title="Get Started"
          onPress={handleSignupPress}
          variant="primary"
          size="large"
          style={styles.primaryButton}
        />
        <Button
          title="I already have an account"
          onPress={handleLoginPress}
          variant="ghost"
          size="medium"
          style={styles.secondaryButton}
          textStyle={styles.secondaryButtonText}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing.screen.paddingHorizontal,
  },
  animationContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing.xl,
    marginTop: Spacing.xl,
  },
  lottieAnimation: {
    width: width * 0.8,
    height: height * 0.3,
  },
  featuresCard: {
    marginBottom: Spacing.xl,
  },
  featuresTitle: {
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  featuresList: {
    gap: Spacing.md,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  featureIcon: {
    fontSize: 24,
    width: 32,
    textAlign: "center",
  },
  featureText: {
    color: Colors.text.secondary,
    flex: 1,
  },
  buttonContainer: {
    paddingBottom: Spacing.xl,
  },
  primaryButton: {
    marginBottom: Spacing.sm,
    backgroundColor: "grey",
  },
  secondaryButton: {
    // Additional styling if needed
  },
  secondaryButtonText: {
    color: Colors.text.secondary,
  },
});
