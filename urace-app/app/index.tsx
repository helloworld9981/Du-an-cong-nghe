import { GetMe } from "@/api/user/user";
import { useAuthStore } from "@/zustand/authStore";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function Index() {
  const { setUser } = useAuthStore();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const accessToken = await AsyncStorage.getItem("accessToken");

        if (accessToken !== null) {
          const res = await GetMe();
          if (res.data) {
            setIsAuthenticated(true);
            setUser({
              ...res.data,
              id: res.data._id,
            });
            setIsLoading(false);
          } else {
            router.replace("/login");
          }
        } else {
          router.replace("/login");
        }
      } catch (err) {
        router.replace("/login");
      }
    };
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <LinearGradient
        colors={["#4F46E5", "#7C3AED", "#9333EA"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Animated.View
            style={[styles.iconWrapper, { transform: [{ scale: pulseAnim }] }]}
          >
            <View style={styles.iconBackground}>
              <Ionicons name="fitness" size={60} color="#4F46E5" />
            </View>
          </Animated.View>

          {/* App Name */}
          <Text style={styles.appName}>URace</Text>
          <Text style={styles.tagline}>Run Together, Win Together</Text>
        </Animated.View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="rgba(255,255,255,0.9)" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
      </LinearGradient>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/onboarding" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  logoContainer: {
    alignItems: "center",
    zIndex: 10,
  },
  iconWrapper: {
    marginBottom: 24,
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  appName: {
    fontSize: 48,
    fontWeight: "800",
    color: "white",
    letterSpacing: 2,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 8,
    fontWeight: "500",
    letterSpacing: 1,
  },
  loadingContainer: {
    position: "absolute",
    bottom: 100,
    alignItems: "center",
  },
  loadingText: {
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 12,
    fontSize: 14,
    fontWeight: "500",
  },
  circle: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  circle1: {
    width: width * 1.5,
    height: width * 1.5,
    top: -width * 0.5,
    right: -width * 0.5,
  },
  circle2: {
    width: width * 1.2,
    height: width * 1.2,
    bottom: -width * 0.4,
    left: -width * 0.4,
  },
  circle3: {
    width: width * 0.8,
    height: width * 0.8,
    top: "40%",
    right: -width * 0.3,
  },
});
