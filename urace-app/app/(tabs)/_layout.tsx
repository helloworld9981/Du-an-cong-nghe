import {
  Feather,
  FontAwesome,
  FontAwesome5,
  FontAwesome6,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const TAB_HEIGHT = Platform.OS === "android" ? 70 : 75;
  const ICON_SIZE = Platform.OS === "android" ? 22 : 24;

  const TabIcon = ({
    focused,
    children,
  }: {
    focused: boolean;
    children: React.ReactNode;
  }) => (
    <View style={styles.tabIconWrapper}>
      {focused && (
        <View style={styles.activeBackground}>
          <LinearGradient
            colors={["rgba(253, 232, 138, 0.2)", "rgba(253, 232, 138, 0.05)"]}
            style={styles.activeGradient}
          />
        </View>
      )}
      <View style={[styles.iconBox, focused && styles.iconBoxActive]}>
        {children}
      </View>
    </View>
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarInactiveTintColor: "rgba(255, 255, 255, 0.5)",
        tabBarActiveTintColor: "#FDE68A",
        tabBarAllowFontScaling: false,
        tabBarLabelStyle: {
          fontSize: Platform.OS === "android" ? 10 : 11,
          fontWeight: "600",
          marginTop: 6,
        },
        tabBarItemStyle: {
          paddingTop: 10,
          paddingBottom: Platform.OS === "android" ? 8 : 4,
        },
        tabBarStyle: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
          height: TAB_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
        },
        tabBarBackground: () => (
          <View style={styles.tabBarContainer}>
            <LinearGradient
              colors={["#6366F1", "#8B5CF6", "#A855F7"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientBackground}
            />
            <LinearGradient
              colors={["rgba(255,255,255,0.15)", "transparent"]}
              style={styles.topShine}
            />
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.dashboard"),
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused}>
              <MaterialCommunityIcons
                name="home"
                size={ICON_SIZE}
                color={focused ? "#FDE68A" : "rgba(255, 255, 255, 0.5)"}
              />
            </TabIcon>
          ),
        }}
      />

      <Tabs.Screen
        name="group"
        options={{
          title: t("tabs.groups"),
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused}>
              <FontAwesome6
                name="user-group"
                size={ICON_SIZE - 4}
                color={focused ? "#FDE68A" : "rgba(255, 255, 255, 0.5)"}
              />
            </TabIcon>
          ),
        }}
      />

      <Tabs.Screen
        name="activities"
        options={{
          title: t("tabs.activities"),
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused}>
              <FontAwesome5
                name="running"
                size={ICON_SIZE}
                color={focused ? "#FDE68A" : "rgba(255, 255, 255, 0.5)"}
              />
            </TabIcon>
          ),
        }}
      />

      <Tabs.Screen
        name="connect-strava"
        options={{
          title: t("tabs.connect"),
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused}>
              <Feather
                name="link-2"
                size={ICON_SIZE - 2}
                color={focused ? "#FDE68A" : "rgba(255, 255, 255, 0.5)"}
              />
            </TabIcon>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused}>
              <FontAwesome
                name="user"
                size={ICON_SIZE - 2}
                color={focused ? "#FDE68A" : "rgba(255, 255, 255, 0.5)"}
              />
            </TabIcon>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 20,
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  topShine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  tabIconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    width: 52,
    height: 36,
  },
  activeBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    overflow: "hidden",
  },
  activeGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  iconBox: {
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 32,
    borderRadius: 16,
  },
  iconBoxActive: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
});