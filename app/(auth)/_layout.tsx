/**
 * PROTECTED ROUTES LAYOUT
 *
 * This layout wraps all authenticated/protected routes in the /(auth) group.
 * All screens in this group are only accessible to logged-in users.
 *
 * Protected Screens:
 * - home.tsx - Main dashboard/home screen
 * - directions.tsx - Route planning and navigation
 *
 * Route Protection:
 * - Protection is handled by the parent _layout.tsx which redirects
 *   unauthenticated users away from this group
 * - No additional auth checks needed at this level
 */

import { Stack } from "expo-router";

const Layout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* All screens in this group inherit headerShown: false */}
    </Stack>
  );
};

export default Layout;
