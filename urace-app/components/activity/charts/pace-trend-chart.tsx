import { IActivity } from "@/types/activity";
import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Platform, Text, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";

interface PaceTrendChartProps {
  activities: IActivity[];
  filterType: string;
}

export default function PaceTrendChart({
  activities,
  filterType,
}: PaceTrendChartProps) {
  const isAndroid = Platform.OS === "android";

  const paceData = useMemo(() => {
    if (activities.length === 0) return { chartData: [], stats: null };

    // Filter activities that have valid pace
    const validActivities = activities
      .filter((a) => a.pace > 0 && a.pace < 30) // Reasonable pace range (min/km)
      .sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );

    if (validActivities.length === 0) return { chartData: [], stats: null };

    // Filter activities by time period first
    const now = new Date();
    let filteredByTime: typeof validActivities = [];

    switch (filterType) {
      case "day": {
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        filteredByTime = validActivities.filter((a) => {
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
        filteredByTime = validActivities.filter((a) => {
          const d = new Date(a.startDate);
          return d >= monday && d < nextMonday;
        });
        break;
      }
      case "month": {
        const year = now.getFullYear();
        const month = now.getMonth();
        filteredByTime = validActivities.filter((a) => {
          const d = new Date(a.startDate);
          return d.getFullYear() === year && d.getMonth() === month;
        });
        break;
      }
      case "year": {
        const year = now.getFullYear();
        filteredByTime = validActivities.filter((a) => {
          const d = new Date(a.startDate);
          return d.getFullYear() === year;
        });
        break;
      }
      default:
        filteredByTime = validActivities;
    }

    if (filteredByTime.length === 0) return { chartData: [], stats: null };

    // Calculate stats from filtered activities directly (not from grouped chartData)
    const allPaces = filteredByTime.map((a) => a.pace);
    const stats = {
      avg: allPaces.reduce((a, b) => a + b, 0) / allPaces.length,
      best: Math.min(...allPaces),
      worst: Math.max(...allPaces),
    };

    // Calculate average pace based on filter type for chart display
    const chartData: {
      value: number;
      label?: string;
      dataPointText?: string;
    }[] = [];

    switch (filterType) {
      case "day": {
        // For today, show each activity
        filteredByTime.forEach((activity, idx) => {
          const date = new Date(activity.startDate);
          chartData.push({
            value: activity.pace,
            label: `${date.getHours()}:${date.getMinutes().toString().padStart(2, "0")}`,
          });
        });
        break;
      }
      case "week": {
        // For week, group by day
        const weekDays = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
        const today = new Date();
        const currentDay = today.getDay();
        const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
        const monday = new Date(today);
        monday.setDate(today.getDate() + mondayOffset);
        monday.setHours(0, 0, 0, 0);
        const nextMonday = new Date(monday);
        nextMonday.setDate(monday.getDate() + 7);

        weekDays.forEach((day, index) => {
          const dayPaces: number[] = [];
          filteredByTime.forEach((activity) => {
            const activityDate = new Date(activity.startDate);
            if (activityDate >= monday && activityDate < nextMonday) {
              let dayIndex = activityDate.getDay();
              dayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
              if (dayIndex === index) {
                dayPaces.push(activity.pace);
              }
            }
          });
          const avgPace =
            dayPaces.length > 0
              ? dayPaces.reduce((a, b) => a + b, 0) / dayPaces.length
              : 0;
          chartData.push({
            value: avgPace,
            label: day,
          });
        });
        break;
      }
      case "month": {
        // For month, group by week
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const weekRanges = [
          { start: 1, end: 7, label: "W1" },
          { start: 8, end: 14, label: "W2" },
          { start: 15, end: 21, label: "W3" },
          { start: 22, end: daysInMonth, label: "W4" },
        ];

        weekRanges.forEach((range) => {
          const weekPaces: number[] = [];
          filteredByTime.forEach((activity) => {
            const activityDate = new Date(activity.startDate);
            if (
              activityDate.getFullYear() === year &&
              activityDate.getMonth() === month
            ) {
              const day = activityDate.getDate();
              if (day >= range.start && day <= range.end) {
                weekPaces.push(activity.pace);
              }
            }
          });
          const avgPace =
            weekPaces.length > 0
              ? weekPaces.reduce((a, b) => a + b, 0) / weekPaces.length
              : 0;
          chartData.push({
            value: avgPace,
            label: range.label,
          });
        });
        break;
      }
      case "year": {
        // For year, group by month
        const monthLabels = [
          "J",
          "F",
          "M",
          "A",
          "M",
          "J",
          "J",
          "A",
          "S",
          "O",
          "N",
          "D",
        ];
        const currentYear = new Date().getFullYear();

        monthLabels.forEach((label, index) => {
          const monthPaces: number[] = [];
          filteredByTime.forEach((activity) => {
            const activityDate = new Date(activity.startDate);
            if (
              activityDate.getFullYear() === currentYear &&
              activityDate.getMonth() === index
            ) {
              monthPaces.push(activity.pace);
            }
          });
          const avgPace =
            monthPaces.length > 0
              ? monthPaces.reduce((a, b) => a + b, 0) / monthPaces.length
              : 0;
          chartData.push({
            value: avgPace,
            label: label,
          });
        });
        break;
      }
    }

    return { chartData, stats };
  }, [activities, filterType]);

  if (!paceData.stats) {
    return null;
  }

  const formatPace = (pace: number) => {
    const minutes = Math.floor(pace);
    const seconds = Math.round((pace - minutes) * 60);
    return `${minutes}'${seconds.toString().padStart(2, "0")}"`;
  };

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
            backgroundColor: "#10B98115",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Feather
            name="trending-up"
            size={isAndroid ? 18 : 20}
            color="#10B981"
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
            Pace Trend
          </Text>
          <Text
            style={{
              fontSize: isAndroid ? 11 : 12,
              color: "#9CA3AF",
            }}
            allowFontScaling={false}
          >
            Average pace over time (min/km)
          </Text>
        </View>
      </View>

      {/* Stats Row */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: isAndroid ? 16 : 20,
          backgroundColor: "#F9FAFB",
          borderRadius: isAndroid ? 12 : 14,
          padding: isAndroid ? 12 : 14,
        }}
      >
        <View style={{ alignItems: "center", flex: 1 }}>
          <Text
            style={{
              fontSize: isAndroid ? 16 : 18,
              fontWeight: "700",
              color: "#10B981",
            }}
            allowFontScaling={false}
          >
            {formatPace(paceData.stats.best)}
          </Text>
          <Text
            style={{
              fontSize: isAndroid ? 10 : 11,
              color: "#9CA3AF",
              marginTop: 2,
            }}
            allowFontScaling={false}
          >
            Best Pace
          </Text>
        </View>
        <View
          style={{
            width: 1,
            backgroundColor: "#E5E7EB",
          }}
        />
        <View style={{ alignItems: "center", flex: 1 }}>
          <Text
            style={{
              fontSize: isAndroid ? 16 : 18,
              fontWeight: "700",
              color: "#4F6AEE",
            }}
            allowFontScaling={false}
          >
            {formatPace(paceData.stats.avg)}
          </Text>
          <Text
            style={{
              fontSize: isAndroid ? 10 : 11,
              color: "#9CA3AF",
              marginTop: 2,
            }}
            allowFontScaling={false}
          >
            Avg Pace
          </Text>
        </View>
        <View
          style={{
            width: 1,
            backgroundColor: "#E5E7EB",
          }}
        />
        <View style={{ alignItems: "center", flex: 1 }}>
          <Text
            style={{
              fontSize: isAndroid ? 16 : 18,
              fontWeight: "700",
              color: "#F59E0B",
            }}
            allowFontScaling={false}
          >
            {formatPace(paceData.stats.worst)}
          </Text>
          <Text
            style={{
              fontSize: isAndroid ? 10 : 11,
              color: "#9CA3AF",
              marginTop: 2,
            }}
            allowFontScaling={false}
          >
            Slowest
          </Text>
        </View>
      </View>

      {/* Line Chart */}
      <View
        style={{
          backgroundColor: "#F9FAFB",
          borderRadius: isAndroid ? 12 : 14,
          padding: isAndroid ? 12 : 14,
          overflow: "hidden",
        }}
      >
        <LineChart
          data={paceData.chartData}
          height={isAndroid ? 100 : 120}
          spacing={
            filterType === "year"
              ? isAndroid
                ? 20
                : 24
              : filterType === "month"
                ? isAndroid
                  ? 60
                  : 72
                : filterType === "week"
                  ? isAndroid
                    ? 36
                    : 44
                  : isAndroid
                    ? 40
                    : 50
          }
          initialSpacing={isAndroid ? 16 : 20}
          endSpacing={isAndroid ? 16 : 20}
          color="#10B981"
          thickness={2}
          startFillColor="rgba(16, 185, 129, 0.2)"
          endFillColor="rgba(16, 185, 129, 0.01)"
          areaChart
          hideDataPoints={false}
          dataPointsColor="#10B981"
          dataPointsRadius={isAndroid ? 4 : 5}
          curved
          yAxisThickness={0}
          xAxisThickness={0}
          hideRules
          xAxisLabelTextStyle={{
            color: "#9CA3AF",
            fontSize: isAndroid ? 9 : 10,
            textAlign: "center",
          }}
          yAxisTextStyle={{
            color: "#9CA3AF",
            fontSize: isAndroid ? 9 : 10,
          }}
          hideYAxisText
          disableScroll
          pointerConfig={{
            pointerStripHeight: isAndroid ? 100 : 120,
            pointerStripColor: "#10B98130",
            pointerStripWidth: 2,
            pointerColor: "#10B981",
            radius: 6,
            pointerLabelWidth: 100,
            pointerLabelHeight: 90,
            activatePointersOnLongPress: true,
            autoAdjustPointerLabelPosition: true,
            pointerLabelComponent: (items: any) => {
              const value = items[0]?.value;
              if (!value || value === 0) return null;
              return (
                <View
                  style={{
                    backgroundColor: "#10B981",
                    padding: 8,
                    borderRadius: 8,
                  }}
                >
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 12,
                      fontWeight: "600",
                    }}
                  >
                    {formatPace(value)}
                  </Text>
                </View>
              );
            },
          }}
        />
      </View>
    </View>
  );
}
