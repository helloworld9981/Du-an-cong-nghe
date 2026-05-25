// // Platform-safe wrapper for react-native-maps
// // Only import on native platforms (iOS/Android), provides fallback for web

// import React from "react";
// import { Platform, StyleSheet, Text, View } from "react-native";

// // Re-export types - these are safe to import on any platform
// export type {
//   LatLng,
//   MapMarkerProps,
//   MapPolylineProps,
//   MapViewProps,
//   Region,
// } from "react-native-maps";
// export type MapViewType = import("react-native-maps").default;

// // Conditional exports based on platform
// export const isNative = Platform.OS !== "web";

// // Web fallback component
// export const MapFallback: React.FC = () => (
//   <View style={styles.fallback}>
//     <Text style={styles.fallbackText}>🗺️</Text>
//     <Text style={styles.fallbackSubtext}>Map is not available on web</Text>
//   </View>
// );

// const styles = StyleSheet.create({
//   fallback: {
//     flex: 1,
//     backgroundColor: "#F3F4F6",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   fallbackText: {
//     fontSize: 48,
//     marginBottom: 16,
//   },
//   fallbackSubtext: {
//     color: "#6B7280",
//     fontSize: 16,
//   },
// });

// // Only load react-native-maps on native
// // Using require() with Platform check prevents Metro bundler from including it in web bundle
// let MapView: typeof import("react-native-maps").default;
// let Marker: typeof import("react-native-maps").Marker;
// let Polyline: typeof import("react-native-maps").Polyline;
// let PROVIDER_DEFAULT: any;

// if (Platform.OS !== "web") {
//   const RNMaps = require("react-native-maps");
//   MapView = RNMaps.default;
//   Marker = RNMaps.Marker;
//   Polyline = RNMaps.Polyline;
//   PROVIDER_DEFAULT = RNMaps.PROVIDER_DEFAULT;
// }

// export { MapView, Marker, Polyline, PROVIDER_DEFAULT };
