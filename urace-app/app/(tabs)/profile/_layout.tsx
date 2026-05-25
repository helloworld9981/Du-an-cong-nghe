import { Stack } from "expo-router";
import React from "react";
import "@/config/i18n";

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="detail-information" />
      <Stack.Screen name="change-password" />
    </Stack>
  );
}
