import { Feather, FontAwesome6 } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Platform, Text, View } from "react-native";

export default function LeaderboardTeamCard({
  rank,
  teamName,
  totalDistance,
  averagePace,
  totalTracklog,
  currentMetric,
}: {
  rank: number;
  teamName: string;
  totalDistance: number;
  averagePace: number;
  totalTracklog: number;
  currentMetric: string;
}) {
  const isAndroid = Platform.OS === "android";

  const rankConfig = useMemo(() => {
    switch (rank) {
      case 1:
        return {
          icon: (
            <FontAwesome6
              name="trophy"
              size={isAndroid ? 18 : 20}
              color="#FFBE0D"
            />
          ),
          bgColor: "#FFFBEB",
          borderColor: "#FCD34D",
          badgeBg: "#FEF3C7",
        };
      case 2:
        return {
          icon: (
            <FontAwesome6
              name="trophy"
              size={isAndroid ? 18 : 20}
              color="#9CA3AF"
            />
          ),
          bgColor: "#F9FAFB",
          borderColor: "#D1D5DB",
          badgeBg: "#F3F4F6",
        };
      case 3:
        return {
          icon: (
            <FontAwesome6
              name="trophy"
              size={isAndroid ? 18 : 20}
              color="#CD7F32"
            />
          ),
          bgColor: "#FEF3E2",
          borderColor: "#F5D0A9",
          badgeBg: "#FFEDD5",
        };
      default:
        return {
          icon: null,
          bgColor: "#FFFFFF",
          borderColor: "#E5E7EB",
          badgeBg: "#F3F4F6",
        };
    }
  }, [rank, isAndroid]);

  const metricConfig = useMemo(() => {
    switch (currentMetric) {
      case "totalDistance":
        return {
          value: `${totalDistance.toFixed(1)}`,
          unit: "km",
          icon: "map-pin",
          color: "#3B82F6",
        };
      case "averagePace":
        return {
          value: averagePace === 0 ? "N/A" : `${averagePace.toFixed(1)}`,
          unit: averagePace === 0 ? "" : "min/km",
          icon: "zap",
          color: "#F59E0B",
        };
      case "totalTracklog":
        return {
          value: totalTracklog === 0 ? "N/A" : `${totalTracklog}`,
          unit: totalTracklog === 0 ? "" : "days",
          icon: "calendar",
          color: "#10B981",
        };
      default:
        return {
          value: "-",
          unit: "",
          icon: "activity",
          color: "#6B7280",
        };
    }
  }, [currentMetric, totalDistance, averagePace, totalTracklog]);

  return (
    <View
      style={{
        backgroundColor: rankConfig.bgColor,
        borderRadius: isAndroid ? 14 : 16,
        borderWidth: rank <= 3 ? 2 : 1,
        borderColor: rankConfig.borderColor,
        padding: isAndroid ? 14 : 16,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: isAndroid ? 36 : 40,
          height: isAndroid ? 36 : 40,
          borderRadius: isAndroid ? 10 : 12,
          backgroundColor: rankConfig.badgeBg,
          alignItems: "center",
          justifyContent: "center",
          marginRight: isAndroid ? 12 : 14,
        }}
      >
        {rankConfig.icon ? (
          rankConfig.icon
        ) : (
          <Text
            style={{
              fontSize: isAndroid ? 14 : 16,
              fontWeight: "700",
              color: "#374151",
            }}
            allowFontScaling={false}
          >
            {rank}
          </Text>
        )}
      </View>

      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Feather name="users" size={isAndroid ? 14 : 16} color="#6B7280" />
          <Text
            style={{
              fontSize: isAndroid ? 14 : 15,
              fontWeight: "600",
              color: "#1F2937",
            }}
            numberOfLines={1}
            allowFontScaling={false}
          >
            {teamName}
          </Text>
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: `${metricConfig.color}15`,
          paddingHorizontal: isAndroid ? 10 : 12,
          paddingVertical: isAndroid ? 6 : 8,
          borderRadius: isAndroid ? 8 : 10,
          gap: 6,
        }}
      >
        <Feather
          name={metricConfig.icon as any}
          size={isAndroid ? 14 : 16}
          color={metricConfig.color}
        />
        <Text
          style={{
            fontSize: isAndroid ? 14 : 15,
            fontWeight: "700",
            color: metricConfig.color,
          }}
          allowFontScaling={false}
        >
          {metricConfig.value}
        </Text>
        {metricConfig.unit && (
          <Text
            style={{
              fontSize: isAndroid ? 10 : 11,
              fontWeight: "500",
              color: metricConfig.color,
              opacity: 0.8,
            }}
            allowFontScaling={false}
          >
            {metricConfig.unit}
          </Text>
        )}
      </View>
    </View>
  );
}
