import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Platform, Text, View } from "react-native";
import { BarChart } from "react-native-gifted-charts";

interface DistanceChartProps {
  chartData: { value: number; label: string; frontColor: string }[];
  totalStats: { total: number; count: number; avg: number };
  filterType: string;
}

export default function DistanceChart({
  chartData,
  totalStats,
  filterType,
}: DistanceChartProps) {
  const isAndroid = Platform.OS === "android";

  const getFilterLabel = () => {
    switch (filterType) {
      case "day":
        return "Today";
      case "week":
        return "This Week";
      case "month":
        return "This Month";
      case "year":
        return "This Year";
      default:
        return "";
    }
  };

  return (
    <LinearGradient
      colors={["#4F6AEE", "#9B4BE2"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: isAndroid ? 16 : 20,
        padding: isAndroid ? 16 : 20,
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
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Feather name="activity" size={isAndroid ? 18 : 20} color="#FFFFFF" />
        </View>
        <View>
          <Text
            style={{
              fontSize: isAndroid ? 14 : 15,
              fontWeight: "600",
              color: "rgba(255, 255, 255, 0.9)",
            }}
            allowFontScaling={false}
          >
            Distance Overview
          </Text>
          <Text
            style={{
              fontSize: isAndroid ? 11 : 12,
              color: "rgba(255, 255, 255, 0.7)",
            }}
            allowFontScaling={false}
          >
            {getFilterLabel()}
          </Text>
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: isAndroid ? 16 : 20,
        }}
      >
        <View style={{ alignItems: "center", flex: 1 }}>
          <Text
            style={{
              fontSize: isAndroid ? 24 : 28,
              fontWeight: "800",
              color: "#FFFFFF",
            }}
            allowFontScaling={false}
          >
            {totalStats.total.toFixed(1)}
          </Text>
          <Text
            style={{
              fontSize: isAndroid ? 11 : 12,
              color: "rgba(255, 255, 255, 0.8)",
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
        <View style={{ alignItems: "center", flex: 1 }}>
          <Text
            style={{
              fontSize: isAndroid ? 24 : 28,
              fontWeight: "800",
              color: "#FFFFFF",
            }}
            allowFontScaling={false}
          >
            {totalStats.count}
          </Text>
          <Text
            style={{
              fontSize: isAndroid ? 11 : 12,
              color: "rgba(255, 255, 255, 0.8)",
            }}
            allowFontScaling={false}
          >
            active days
          </Text>
        </View>
        <View
          style={{
            width: 1,
            backgroundColor: "rgba(255, 255, 255, 0.3)",
          }}
        />
        <View style={{ alignItems: "center", flex: 1 }}>
          <Text
            style={{
              fontSize: isAndroid ? 24 : 28,
              fontWeight: "800",
              color: "#FFFFFF",
            }}
            allowFontScaling={false}
          >
            {totalStats.avg.toFixed(1)}
          </Text>
          <Text
            style={{
              fontSize: isAndroid ? 11 : 12,
              color: "rgba(255, 255, 255, 0.8)",
            }}
            allowFontScaling={false}
          >
            km/day avg
          </Text>
        </View>
      </View>

      <View
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.15)",
          borderRadius: isAndroid ? 12 : 14,
          padding: isAndroid ? 12 : 14,
        }}
      >
        <BarChart
          data={chartData}
          height={isAndroid ? 100 : 120}
          barWidth={
            filterType === "year"
              ? isAndroid
                ? 16
                : 18
              : filterType === "month"
                ? isAndroid
                  ? 40
                  : 48
                : filterType === "week"
                  ? isAndroid
                    ? 28
                    : 32
                  : isAndroid
                    ? 32
                    : 38
          }
          spacing={
            filterType === "year"
              ? isAndroid
                ? 8
                : 10
              : filterType === "month"
                ? isAndroid
                  ? 16
                  : 20
                : filterType === "week"
                  ? isAndroid
                    ? 12
                    : 14
                  : isAndroid
                    ? 12
                    : 14
          }
          initialSpacing={isAndroid ? 6 : 8}
          endSpacing={isAndroid ? 6 : 8}
          barBorderRadius={isAndroid ? 4 : 6}
          noOfSections={3}
          yAxisThickness={0}
          xAxisThickness={0}
          hideRules
          xAxisLabelTextStyle={{
            color: "rgba(255, 255, 255, 0.9)",
            fontSize:
              filterType === "month" ? (isAndroid ? 8 : 9) : isAndroid ? 9 : 10,
            textAlign: "center",
          }}
          yAxisTextStyle={{
            color: "rgba(255, 255, 255, 0.7)",
            fontSize: isAndroid ? 9 : 10,
          }}
          hideYAxisText
          disableScroll
        />
      </View>
    </LinearGradient>
  );
}
