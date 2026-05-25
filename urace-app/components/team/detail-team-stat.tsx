import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Platform, Text, View } from "react-native";

export default function DetailTeamStat({
  totalDistance,
  averagePace,
  totalTrackDays,
  fatestPace,
  maxDistance,
}: {
  totalDistance: number;
  averagePace: number;
  totalTrackDays: number;
  fatestPace: number;
  maxDistance: number;
}) {
  const isAndroid = Platform.OS === "android";

  const stats = [
    {
      label: "Total Distance",
      value: `${totalDistance.toFixed(1)} km`,
      icon: "map-pin",
      color: "#3B82F6",
      bgColor: "#DBEAFE",
    },
    {
      label: "Average Pace",
      value: averagePace === 0 ? "N/A" : `${averagePace.toFixed(1)} min/km`,
      icon: "activity",
      color: "#8B5CF6",
      bgColor: "#EDE9FE",
    },
    {
      label: "Track Days",
      value: `${totalTrackDays}`,
      icon: "calendar",
      color: "#10B981",
      bgColor: "#D1FAE5",
    },
    {
      label: "Fastest Pace",
      value: fatestPace === 0 ? "N/A" : `${fatestPace.toFixed(1)} min/km`,
      icon: "zap",
      color: "#F59E0B",
      bgColor: "#FEF3C7",
    },
    {
      label: "Max Distance",
      value: `${maxDistance.toFixed(1)} km`,
      icon: "trending-up",
      color: "#EF4444",
      bgColor: "#FEE2E2",
    },
  ];

  return (
    <View style={{ gap: isAndroid ? 12 : 16 }}>
      <LinearGradient
        colors={["#4F6AEE", "#9B4BE2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: isAndroid ? 16 : 20,
          padding: isAndroid ? 16 : 20,
          shadowColor: "#4F6AEE",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: isAndroid ? 8 : 0,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: isAndroid ? 12 : 16,
            gap: 10,
          }}
        >
          <View
            style={{
              width: isAndroid ? 36 : 40,
              height: isAndroid ? 36 : 40,
              borderRadius: isAndroid ? 10 : 12,
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather
              name="bar-chart-2"
              size={isAndroid ? 18 : 20}
              color="#FFFFFF"
            />
          </View>
          <View>
            <Text
              style={{
                fontSize: isAndroid ? 16 : 18,
                fontWeight: "700",
                color: "#FFFFFF",
              }}
              allowFontScaling={false}
            >
              Team Statistics
            </Text>
            <Text
              style={{
                fontSize: isAndroid ? 11 : 12,
                color: "rgba(255, 255, 255, 0.8)",
                fontWeight: "500",
              }}
              allowFontScaling={false}
            >
              Performance overview
            </Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <View style={{ alignItems: "center" }}>
            <Text
              style={{
                fontSize: isAndroid ? 24 : 28,
                fontWeight: "800",
                color: "#FFFFFF",
              }}
              allowFontScaling={false}
            >
              {totalDistance.toFixed(1)}
            </Text>
            <Text
              style={{
                fontSize: isAndroid ? 11 : 12,
                color: "rgba(255, 255, 255, 0.8)",
                fontWeight: "500",
              }}
              allowFontScaling={false}
            >
              km total
            </Text>
          </View>
          <View
            style={{
              width: 1,
              backgroundColor: "rgba(255, 255, 255, 0.3)",
            }}
          />
          <View style={{ alignItems: "center" }}>
            <Text
              style={{
                fontSize: isAndroid ? 24 : 28,
                fontWeight: "800",
                color: "#FFFFFF",
              }}
              allowFontScaling={false}
            >
              {totalTrackDays}
            </Text>
            <Text
              style={{
                fontSize: isAndroid ? 11 : 12,
                color: "rgba(255, 255, 255, 0.8)",
                fontWeight: "500",
              }}
              allowFontScaling={false}
            >
              track days
            </Text>
          </View>
          <View
            style={{
              width: 1,
              backgroundColor: "rgba(255, 255, 255, 0.3)",
            }}
          />
          <View style={{ alignItems: "center" }}>
            <Text
              style={{
                fontSize: isAndroid ? 24 : 28,
                fontWeight: "800",
                color: "#FFFFFF",
              }}
              allowFontScaling={false}
            >
              {averagePace > 0 ? averagePace.toFixed(1) : "N/A"}
            </Text>
            <Text
              style={{
                fontSize: isAndroid ? 11 : 12,
                color: "rgba(255, 255, 255, 0.8)",
                fontWeight: "500",
              }}
              allowFontScaling={false}
            >
              avg. pace
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: isAndroid ? 16 : 20,
          padding: isAndroid ? 4 : 6,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: isAndroid ? 3 : 0,
        }}
      >
        {stats.map((stat, idx) => (
          <View
            key={idx}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: isAndroid ? 12 : 14,
              paddingHorizontal: isAndroid ? 12 : 16,
              borderBottomWidth: idx < stats.length - 1 ? 1 : 0,
              borderBottomColor: "#F3F4F6",
            }}
          >
            <View
              style={{
                width: isAndroid ? 40 : 44,
                height: isAndroid ? 40 : 44,
                borderRadius: isAndroid ? 12 : 14,
                backgroundColor: stat.bgColor,
                alignItems: "center",
                justifyContent: "center",
                marginRight: isAndroid ? 12 : 14,
              }}
            >
              <Feather
                name={stat.icon as any}
                size={isAndroid ? 18 : 20}
                color={stat.color}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: isAndroid ? 12 : 13,
                  color: "#6B7280",
                  fontWeight: "500",
                }}
                allowFontScaling={false}
              >
                {stat.label}
              </Text>
            </View>
            <Text
              style={{
                fontSize: isAndroid ? 15 : 16,
                fontWeight: "700",
                color: stat.color,
              }}
              allowFontScaling={false}
            >
              {stat.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
