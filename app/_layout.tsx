import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Stack } from "expo-router";

const convex = new ConvexReactClient("https://trustworthy-gull-905.convex.cloud" , {
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