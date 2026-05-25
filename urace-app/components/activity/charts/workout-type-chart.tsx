import { IActivity } from "@/types/activity";
import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Platform, Text, View } from "react-native";
import { PieChart } from "react-native-gifted-charts";

interface WorkoutTypeChartProps {
  activities: IActivity[];
  filterType: string;
}

const WORKOUT_COLORS: { [key: string]: string } = {
  Run: "#4F6AEE",
  Walk: "#10B981",
  Ride: "#F59E0B",
  Swim: "#06B6D4",
  Hike: "#8B5CF6",
  Workout: "#EC4899",
  Other: "#6B7280",
};

const WORKOUT_ICONS: { [key: string]: string } = {
  Run: "zap",
  Walk: "navigation",
  Ride: "circle",
  Swim: "droplet",
  Hike: "mountain",
  Workout: "heart",
  Other: "activity",
};

// Helper function to filter activities by time period
const filterActivitiesByTime = (
  activities: IActivity[],
  filterType: string
): IActivity[] => {
  const now = new Date();

  switch (filterType) {
    case "day": {
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return activities.filter((a) => {
        const d = new Date(a.startDate);
        return d >= today && d < tomorrow;
      });
    }
    case "week": {
      const currentDay = now.getDay();
      const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
      const monday = new Date(now);
      monday.setDate(now.getDate() + mondayOffset);
      monday.setHours(0, 0, 0, 0);
      const nextMonday = new Date(monday);
      nextMonday.setDate(monday.getDate() + 7);
      return activities.filter((a) => {
        const d = new Date(a.startDate);
        return d >= monday && d < nextMonday;
      });
    }
    case "month": {
      const year = now.getFullYear();
      const month = now.getMonth();
      return activities.filter((a) => {
        const d = new Date(a.startDate);
        return d.getFullYear() === year && d.getMonth() === month;
      });
    }
    case "year": {
      const year = now.getFullYear();
      return activities.filter((a) => {
        const d = new Date(a.startDate);
        return d.getFullYear() === year;
      });
    }
    default:
      return activities;
  }
};

export default function WorkoutTypeChart({
  activities,
  filterType,
}: WorkoutTypeChartProps) {
  const isAndroid = Platform.OS === "android";

  const filteredActivities = useMemo(() => {
    return filterActivitiesByTime(activities, filterType);
  }, [activities, filterType]);

  const workoutData = useMemo(() => {
    if (filteredActivities.length === 0) return [];

    const workoutCounts: { [key: string]: number } = {};

    filteredActivities.forEach((activity) => {
      const type = activity.workoutType || "Other";
      workoutCounts[type] = (workoutCounts[type] || 0) + 1;
    });

    const total = filteredActivities.length;
    const data = Object.entries(workoutCounts)
      .map(([type, count]) => ({
        value: count,
        color: WORKOUT_COLORS[type] || WORKOUT_COLORS.Other,
        text: `${Math.round((count / total) * 100)}%`,
        type,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.value - a.value);

    return data;
  }, [filteredActivities]);

  if (workoutData.length === 0) {
    return null;
  }

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
            backgroundColor: "#4F6AEE15",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Feather
            name="pie-chart"
            size={isAndroid ? 18 : 20}
            color="#4F6AEE"
          />
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
            Workout Distribution
          </Text>
          <Text
            style={{
              fontSize: isAndroid ? 11 : 12,
              color: "#9CA3AF",
            }}
            allowFontScaling={false}
          >
            By activity type
          </Text>
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <PieChart
            data={workoutData}
            donut
            radius={isAndroid ? 60 : 70}
            innerRadius={isAndroid ? 40 : 50}
            innerCircleColor="#FFFFFF"
            centerLabelComponent={() => (
              <View style={{ alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: isAndroid ? 20 : 24,
                    fontWeight: "800",
                    color: "#1F2937",
                  }}
                  allowFontScaling={false}
                >
                  {filteredActivities.length}
                </Text>
                <Text
                  style={{
                    fontSize: isAndroid ? 10 : 11,
                    color: "#9CA3AF",
                  }}
                  allowFontScaling={false}
                >
                  Total
                </Text>
              </View>
            )}
          />
        </View>

        <View
          style={{
            flex: 1,
            paddingLeft: isAndroid ? 12 : 16,
            gap: isAndroid ? 8 : 10,
          }}
        >
          {workoutData.slice(0, 4).map((item, index) => (
            <View
              key={`workout-legend-${index}`}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <View
                style={{
                  width: isAndroid ? 28 : 32,
                  height: isAndroid ? 28 : 32,
                  borderRadius: isAndroid ? 8 : 10,
                  backgroundColor: `${item.color}15`,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Feather
                  name={(WORKOUT_ICONS[item.type] || "activity") as any}
                  size={isAndroid ? 12 : 14}
                  color={item.color}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: isAndroid ? 12 : 13,
                    fontWeight: "600",
                    color: "#1F2937",
                  }}
                  allowFontScaling={false}
                >
                  {item.type}
                </Text>
                <Text
                  style={{
                    fontSize: isAndroid ? 10 : 11,
                    color: "#9CA3AF",
                  }}
                  allowFontScaling={false}
                >
                  {item.value} activities
                </Text>
              </View>
              <Text
                style={{
                  fontSize: isAndroid ? 12 : 13,
                  fontWeight: "700",
                  color: item.color,
                }}
                allowFontScaling={false}
              >
                {item.percentage}%
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
