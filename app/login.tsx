/**
 * LOGIN PAGE - User Authentication
 *
 * Handles user sign-in using Firebase Authentication with email/password.
 *
 * Key Features:
 * - Form validation for email and password
 * - Firebase Auth integration with proper error handling
 * - Automatic navigation after successful login (handled by root layout)
 * - Responsive design with keyboard avoidance
 *
 * Authentication Flow:
 * 1. User enters email/password and submits
 * 2. Form validation runs locally
 * 3. Firebase Auth attempts sign-in
 * 4. On success: onAuthStateChanged in root layout triggers redirect to /(auth)/home
 * 5. On error: Display user-friendly error message
 *
 * Error Handling:
 * - Maps Firebase error codes to human-readable messages
 * - Provides specific feedback for common issues (wrong password, user not found, etc.)
 */

import auth from "@react-native-firebase/auth";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button } from "../src/components/ui/Button";
import { Card } from "../src/components/ui/Card";
import { Input } from "../src/components/ui/Input";
import { Colors } from "../src/constants/Colors";
import { Spacing } from "../src/constants/Spacing";

export default function LoginPage() {
  const router = useRouter();

  // Form state management
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false); // Prevents multiple submit attempts
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  ); // Form validation errors

  /**
   * Client-side form validation
   * Validates email format and password length before attempting Firebase auth
   */
  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    // Email validation
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email";
    }

    // Password validation (Firebase requires minimum 6 characters)
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Return true if no errors
  };

  /**
   * Firebase Authentication Handler
   * Attempts to sign in user and handles various error scenarios
   */
  const handleLogin = async () => {
    if (!validateForm()) return; // Exit early if validation fails

    setLoading(true);
    try {
      // Firebase Auth sign-in attempt
      await auth().signInWithEmailAndPassword(email, password);
      // Note: Navigation will be handled automatically by the auth state listener in _layout.tsx
      // No manual navigation needed here
    } catch (error) {
      // Map Firebase error codes to user-friendly messages
      let errorMessage = "Login failed. Please try again.";

      if ((error as any).code === "auth/user-not-found") {
        errorMessage = "No account found with this email.";
      } else if ((error as any).code === "auth/wrong-password") {
        errorMessage = "Incorrect password.";
      } else if ((error as any).code === "auth/invalid-email") {
        errorMessage = "Invalid email address.";
      } else if ((error as any).code === "auth/too-many-requests") {
        errorMessage = "Too many failed attempts. Please try again later.";
      }

      Alert.alert("Login Error", errorMessage);
    } finally {
      setLoading(false); // Reset loading state regardless of outcome
    }
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

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Card variant="elevated" style={styles.formCard}>
            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email}
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              error={errors.password}
            />

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={styles.loginButton}
            />
          </Card>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <Button
              title="Create Account"
              onPress={handleSignupPress}
              variant="ghost"
              size="small"
              textStyle={{
                color: "#000",
              }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.screen.paddingHorizontal,
    paddingVertical: Spacing.screen.paddingVertical,
  },
  header: {
    alignItems: "center",
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: Spacing.lg,
  },
  title: {
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    color: Colors.text.secondary,
    textAlign: "center",
  },
  formCard: {
    marginBottom: Spacing.xl,
  },
  loginButton: {
    marginTop: Spacing.md,
    backgroundColor: "grey",
  },
  footer: {
    alignItems: "center",
    gap: Spacing.sm,
  },
  footerText: {
    color: Colors.text.secondary,
  },
});
