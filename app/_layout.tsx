/**
 * ROOT LAYOUT - Authentication & Navigation Controller
 *
 * This is the main layout component that handles:
 * 1. Firebase Authentication state management
 * 2. Protected route navigation using Expo Router
 * 3. Automatic redirection based on authentication status
 *
 * KEY ARCHITECTURE DECISIONS:
 * - No external state management library (Redux/Zustand) is used
 * - Authentication state is managed locally using React's useState
 * - Firebase Auth provides global auth state through onAuthStateChanged listener
 * - Expo Router's file-based routing with groups for protected routes
 *
 * WHY NO STATE MANAGEMENT LIBRARY:
 * - Firebase Auth already provides global state management for authentication
 * - App is focused and doesn't require complex state sharing between components
 * - React's built-in state + Firebase listeners provide sufficient state management
 * - Reduces bundle size and complexity for this use case
 *
 * ROUTE PROTECTION STRATEGY:
 * - Uses Expo Router's route groups: /(auth) for protected routes
 * - Monitors route segments to determine if user is in protected area
 * - Automatically redirects based on authentication state
 */

import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { Stack, useRouter, useSegments } from "expo-router";
import * as Updates from "expo-updates";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function RootLayout() {
  // Authentication state - managed locally since Firebase provides global auth state
  const [initializing, setInitializing] = useState(true); // Prevents premature redirects during app startup
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null); // Current authenticated user

  // Expo Router hooks for navigation control
  const router = useRouter(); // Programmatic navigation
  const segments = useSegments(); // Current route segments for protection logic

  /**
   * Firebase Authentication State Listener
   * This callback is triggered whenever the user's authentication state changes
   * (login, logout, token refresh, etc.)
   */
  const onAuthStateChanged = (user: FirebaseAuthTypes.User | null) => {
    console.log("onAuthStateChanged", user);
    setUser(user); // Update local state with current user
    if (initializing) setInitializing(false); // Mark initialization as complete
  };

  /**
   * Setup Firebase Auth Listener
   * Subscribes to authentication state changes and cleans up on unmount
   */
  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
    return subscriber; // Cleanup function - unsubscribes when component unmounts
  }, []);

  /**
   * ROUTE PROTECTION LOGIC
   * This effect handles automatic navigation based on authentication state
   *
   * Route Groups Explanation:
   * - /(auth)/* - Protected routes (home, directions, etc.)
   * - /* - Public routes (landing, login, signup)
   */
  useEffect(() => {
    if (initializing) return; // Wait until Firebase auth state is determined

    const inAuthGroup = segments[0] === "(auth)"; // Check if currently in protected route group

    if (user && !inAuthGroup) {
      // User is authenticated but on public page -> redirect to protected area
      router.replace("/(auth)/home");
    } else if (!user && inAuthGroup) {
      // User is not authenticated but trying to access protected route -> redirect to landing
      router.replace("/");
    }
  }, [user, segments, initializing]); // Re-run when auth state or route changes

  // ✅ EAS Update Check on App Start
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (e) {
        console.log("Error checking for updates:", e);
      }
    };

    checkForUpdates();
  }, []);

  /**
   * Loading State - Show spinner while determining authentication status
   * Prevents flash of wrong screen during app startup
   */
  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  /**
   * Navigation Stack Configuration
   * - index: Landing page (public)
   * - (auth): Route group for all protected screens
   */
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
    </Stack>
  );
}
