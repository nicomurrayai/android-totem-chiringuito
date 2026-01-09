import "react-native-get-random-values";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Stack } from "expo-router";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false, 
});

if (typeof window !== "undefined") {
  // @ts-ignore
  window.addEventListener = window.addEventListener || (() => {});
  // @ts-ignore
  window.removeEventListener = window.removeEventListener || (() => {});
}

export default function RootLayout() {
  return (
    <ConvexProvider client={convex}>
      <Stack screenOptions={{ headerShown: false }} />
    </ConvexProvider>
  );
}