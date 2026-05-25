import { IActivity } from "@/types/activity";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo } from "react";
import { Platform, Text, View } from "react-native";

interface TimeStatsChartProps {
  activities: IActivity[];
  filterType: string;
}

export default function TimeStatsChart({
  activities,
  filterType,
}: TimeStatsChartProps) {
  const isAndroid = Platform.OS === "android";

  const timeStats = useMemo(() => {
    if (activities.length === 0) return null;

    const now = new Date();
    let filteredActivities: IActivity[] = [];

    switch (filterType) {
      case "day": {
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        filteredActivities = activities.filter((a) => {
          const d = new Date(a.startDate);
          return d >= today && d < tomorrow;
        });
        break;
      }
      case "week": {
        const currentDay = now.getDay();
        const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
        const monday = new Date(now);
        monday.setDate(now.getDate() + mondayOffset);
        monday.setHours(0, 0, 0, 0);
        const nextMonday = new Date(monday);
        nextMonday.setDate(monday.getDate() + 7);
        filteredActivities = activities.filter((a) => {
          const d = new Date(a.startDate);
          return d >= monday && d < nextMonday;
        });
        break;
      }
      case "month": {
        const year = now.getFullYear();
        const month = now.getMonth();
        filteredActivities = activities.filter((a) => {
          const d = new Date(a.startDate);
          return d.getFullYear() === year && d.getMonth() === month;
        });
        break;
      }
      case "year": {
        const year = now.getFullYear();
        filteredActivities = activities.filter((a) => {
          const d = new Date(a.startDate);
          return d.getFullYear() === year;
        });
        break;
      }
    }

    if (filteredActivities.length === 0) return null;

    const totalTime = filteredActivities.reduce(
      (sum, a) => sum + (a.movingTime || 0),
      0
    );
    const totalDistance = filteredActivities.reduce(
      (sum, a) => sum + (a.distance || 0),
      0
    );
    const avgPace =
      filteredActivities.filter((a) => a.pace > 0).length > 0
        ? filteredActivities
            .filter((a) => a.pace > 0)
            .reduce((sum, a) => sum + a.pace, 0) /
          filteredActivities.filter((a) => a.pace > 0).length
        : 0;

    // Estimate calories (rough estimation: ~60 cal per km for running)
    const estimatedCalories = Math.round(totalDistance * 60);

    return {
      totalTime,
      totalDistance,
      avgPace,
      estimatedCalories,
      activityCount: filteredActivities.length,
    };
  }, [activities, filterType]);

  if (!timeStats) return null;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatPace = (pace: number) => {
    if (pace === 0) return "-";
    const minutes = Math.floor(pace);
    const secs = Math.round((pace - minutes) * 60);
    return `${minutes}'${secs.toString().padStart(2, "0")}"`;
  };

  // Calculate progress (example: weekly goal of 30km)
  const weeklyGoal = 30;
  const progress = Math.min((timeStats.totalDistance / weeklyGoal) * 100, 100);

  return (
    <View
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: isAndroid ? 16 : 20,
        padding: isAndroid ? 16 : 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: isAndroid ? 16 : 20,
          gap: 10,
        }}
      >
        <View
          style={{
            width: isAndroid ? 36 : 40,
            height: isAndroid ? 36 : 40,
            borderRadius: isAndroid ? 10 : 12,
            backgroundColor: "#F59E0B15",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Feather name="clock" size={isAndroid ? 18 : 20} color="#F59E0B" />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: isAndroid ? 14 : 15,
              fontWeight: "600",
              color: "#1F2937",
            }}
            allowFontScaling={false}
          >
            Time & Performance
          </Text>
          <Text
            style={{
              fontSize: isAndroid ? 11 : 12,
              color: "#9CA3AF",
            }}
            allowFontScaling={false}
          >
            Summary statistics
          </Text>
        </View>
      </View>

      {/* Progress Section */}
      {filterType === "week" && (
        <View
          style={{
            marginBottom: isAndroid ? 16 : 20,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <Text
              style={{
                fontSize: isAndroid ? 12 : 13,
                fontWeight: "600",
                color: "#1F2937",
              }}
              allowFontScaling={false}
            >
              Weekly Goal Progress
            </Text>
            <Text
              style={{
                fontSize: isAndroid ? 12 : 13,
                fontWeight: "700",
                color: "#4F6AEE",
              }}
              allowFontScaling={false}
            >
              {timeStats.totalDistance.toFixed(1)} / {weeklyGoal} km
            </Text>
          </View>
          <View
            style={{
              height: isAndroid ? 10 : 12,
              backgroundColor: "#F3F4F6",
              borderRadius: 6,
              overflow: "hidden",
            }}
          >
            <LinearGradient
              colors={["#4F6AEE", "#9B4BE2"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                height: "100%",
                width: `${progress}%`,
                borderRadius: 6,
              }}
            />
          </View>
          <Text
            style={{
              fontSize: isAndroid ? 10 : 11,
              color: "#9CA3AF",
              marginTop: 4,
              textAlign: "right",
            }}
            allowFontScaling={false}
          >
            {progress.toFixed(0)}% complete
          </Text>
        </View>
      )}

      {/* Stats Grid */}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: isAndroid ? 10 : 12,
        }}
      >
        {/* Total Time */}
        <View
          style={{
            flex: 1,
            minWidth: "45%",
            backgroundColor: "#F9FAFB",
            borderRadius: isAndroid ? 12 : 14,
            padding: isAndroid ? 14 : 16,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginBottom: 8,
            }}
          >
            <Feather name="clock" size={isAndroid ? 14 : 16} color="#F59E0B" />
            <Text
              style={{
                fontSize: isAndroid ? 10 : 11,
                color: "#9CA3AF",
                fontWeight: "500",
              }}
              allowFontScaling={false}
            >
              Total Time
            </Text>
          </View>
          <Text
            style={{
              fontSize: isAndroid ? 20 : 24,
              fontWeight: "800",
              color: "#1F2937",
            }}
            allowFontScaling={false}
          >
            {formatTime(timeStats.totalTime)}
          </Text>
        </View>

        {/* Calories */}
        <View
          style={{
            flex: 1,
            minWidth: "45%",
            backgroundColor: "#F9FAFB",
            borderRadius: isAndroid ? 12 : 14,
            padding: isAndroid ? 14 : 16,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginBottom: 8,
            }}
          >
            <Feather name="zap" size={isAndroid ? 14 : 16} color="#EC4899" />
            <Text
              style={{
                fontSize: isAndroid ? 10 : 11,
                color: "#9CA3AF",
                fontWeight: "500",
              }}
              allowFontScaling={false}
            >
              Est. Calories
            </Text>
          </View>
          <Text
            style={{
              fontSize: isAndroid ? 20 : 24,
              fontWeight: "800",
              color: "#1F2937",
            }}
            allowFontScaling={false}
          >
            {timeStats.estimatedCalories.toLocaleString()}
          </Text>
        </View>

        {/* Avg Pace */}
        <View
          style={{
            flex: 1,
            minWidth: "45%",
            backgroundColor: "#F9FAFB",
            borderRadius: isAndroid ? 12 : 14,
            padding: isAndroid ? 14 : 16,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginBottom: 8,
            }}
          >
            <Feather
              name="trending-up"
              size={isAndroid ? 14 : 16}
              color="#10B981"
            />
            <Text
              style={{
                fontSize: isAndroid ? 10 : 11,
                color: "#9CA3AF",
                fontWeight: "500",
              }}
              allowFontScaling={false}
            >
              Avg Pace
            </Text>
          </View>
          <Text
            style={{
              fontSize: isAndroid ? 20 : 24,
              fontWeight: "800",
              color: "#1F2937",
            }}
            allowFontScaling={false}
          >
            {formatPace(timeStats.avgPace)}
          </Text>
        </View>

        {/* Activities */}
        <View
          style={{
            flex: 1,
            minWidth: "45%",
            backgroundColor: "#F9FAFB",
            borderRadius: isAndroid ? 12 : 14,
            padding: isAndroid ? 14 : 16,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginBottom: 8,
            }}
          >
            <Feather
              name="activity"
              size={isAndroid ? 14 : 16}
              color="#4F6AEE"
            />
            <Text
              style={{
                fontSize: isAndroid ? 10 : 11,
                color: "#9CA3AF",
                fontWeight: "500",
              }}
              allowFontScaling={false}
            >
              Activities
            </Text>
          </View>
          <Text
            style={{
              fontSize: isAndroid ? 20 : 24,
              fontWeight: "800",
              color: "#1F2937",
            }}
            allowFontScaling={false}
          >
            {timeStats.activityCount}
          </Text>
        </View>
      </View>
    </View>
  );
}
