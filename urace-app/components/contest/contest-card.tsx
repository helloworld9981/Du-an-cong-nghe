import { ContestStatus } from "@/enums/contest";
import { formatToMonthDay, getDaysRemaining } from "@/utils/date";
import {
  FontAwesome6,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import moment from "moment";
import React, { useMemo } from "react";
import { Platform, Text, View } from "react-native";

const isAndroid = Platform.OS === "android";

export default function ContestCard({
  name,
  status,
  startDate,
  endDate,
  type,
  activityType,
  memberCount,
}: {
  name: string;
  status: ContestStatus;
  startDate: any;
  endDate: any;
  type: string;
  activityType: string;
  memberCount: number;
}) {
  const isActive = useMemo(() => {
    return status === ContestStatus.Active && new Date(startDate) <= new Date();
  }, [status, startDate]);

  const isUpcoming = useMemo(() => {
    return status === ContestStatus.Active && new Date(startDate) > new Date();
  }, [status, startDate]);

  const daysLeft = useMemo(() => {
    if (isActive) {
      return getDaysRemaining(new Date(endDate), new Date());
    } else if (isUpcoming) {
      return getDaysRemaining(new Date(startDate), new Date());
    }
    return 0;
  }, [isActive, isUpcoming, startDate, endDate]);

  const activityTypeConfig = useMemo(() => {
    switch (activityType) {
      case "Run":
        return {
          label: "Running",
          icon: "run",
          color: "#4F6AEE",
          bgColor: "#EEF2FF",
        };
      case "Cycle":
      case "Ride":
        return {
          label: "Cycling",
          icon: "bike",
          color: "#F59E0B",
          bgColor: "#FEF3C7",
        };
      case "Swim":
        return {
          label: "Swimming",
          icon: "swim",
          color: "#06B6D4",
          bgColor: "#CFFAFE",
        };
      default:
        return {
          label: activityType,
          icon: "run",
          color: "#4F6AEE",
          bgColor: "#EEF2FF",
        };
    }
  }, [activityType]);

  const contestTypeConfig = useMemo(() => {
    if (type === "Team") {
      return {
        label: "Team",
        icon: "people",
        color: "#2563EB",
        bgColor: "#DBEAFE",
      };
    }
    return {
      label: "Individual",
      icon: "person",
      color: "#9333EA",
      bgColor: "#F3E8FF",
    };
  }, [type]);

  const gradientColors = useMemo(() => {
    if (status === ContestStatus.Ended) {
      return ["#6B7280", "#9CA3AF"];
    }
    if (isActive) {
      return ["#16A34A", "#22C55E"];
    }
    return ["#3B82F6", "#60A5FA"];
  }, [status, isActive]);

  return (
    <View
      className="bg-white rounded-2xl overflow-hidden flex-row"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 8,
      }}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          width: isAndroid ? 3 : 4,
          borderTopLeftRadius: 16,
          borderBottomLeftRadius: 16,
        }}
      />

      <View className={`flex-1 ${isAndroid ? "p-3" : "p-4"}`}>
        <View className="flex-row items-start justify-between">
          <View className="flex-1 mr-3">
            <Text
              className={`font-bold text-gray-800 ${isAndroid ? "text-sm" : "text-base"}`}
              numberOfLines={2}
              allowFontScaling={false}
            >
              {name}
            </Text>
          </View>

          <View
            className={`rounded-full flex-row items-center ${isAndroid ? "px-2 py-1" : "px-3 py-1.5"}`}
            style={{
              backgroundColor:
                status === ContestStatus.Ended
                  ? "#F3F4F6"
                  : isActive
                    ? "#DCFCE7"
                    : "#DBEAFE",
            }}
          >
            <View
              className={`rounded-full mr-1.5 ${isAndroid ? "w-1.5 h-1.5" : "w-2 h-2"}`}
              style={{
                backgroundColor:
                  status === ContestStatus.Ended
                    ? "#6B7280"
                    : isActive
                      ? "#16A34A"
                      : "#3B82F6",
              }}
            />
            <Text
              className={`font-semibold ${isAndroid ? "text-[10px]" : "text-xs"}`}
              style={{
                color:
                  status === ContestStatus.Ended
                    ? "#6B7280"
                    : isActive
                      ? "#16A34A"
                      : "#3B82F6",
              }}
              allowFontScaling={false}
            >
              {status === ContestStatus.Ended
                ? "Ended"
                : isActive
                  ? `${daysLeft}d left`
                  : `In ${daysLeft}d`}
            </Text>
          </View>
        </View>

        <View
          className={`flex-row items-center gap-x-2 ${isAndroid ? "mt-2" : "mt-3"}`}
        >
          <View
            className={`flex-row items-center rounded-lg ${isAndroid ? "px-2 py-1" : "px-2.5 py-1.5"}`}
            style={{ backgroundColor: contestTypeConfig.bgColor }}
          >
            <Ionicons
              name={contestTypeConfig.icon as any}
              size={isAndroid ? 12 : 14}
              color={contestTypeConfig.color}
            />
            <Text
              className={`font-semibold ml-1.5 ${isAndroid ? "text-[10px]" : "text-xs"}`}
              style={{ color: contestTypeConfig.color }}
              allowFontScaling={false}
            >
              {contestTypeConfig.label}
            </Text>
          </View>

          <View
            className={`flex-row items-center rounded-lg ${isAndroid ? "px-2 py-1" : "px-2.5 py-1.5"}`}
            style={{ backgroundColor: activityTypeConfig.bgColor }}
          >
            <MaterialCommunityIcons
              name={activityTypeConfig.icon as any}
              size={isAndroid ? 12 : 14}
              color={activityTypeConfig.color}
            />
            <Text
              className={`font-semibold ml-1.5 ${isAndroid ? "text-[10px]" : "text-xs"}`}
              style={{ color: activityTypeConfig.color }}
              allowFontScaling={false}
            >
              {activityTypeConfig.label}
            </Text>
          </View>
        </View>

        <View className={`h-px bg-gray-100 ${isAndroid ? "my-2" : "my-3"}`} />

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View
              className={`rounded-lg bg-gray-50 items-center justify-center mr-2 ${isAndroid ? "w-7 h-7" : "w-8 h-8"}`}
            >
              <Ionicons
                name="calendar-outline"
                size={isAndroid ? 14 : 16}
                color="#6B7280"
              />
            </View>
            <View className="flex-1">
              <Text
                className={`text-gray-400 font-medium ${isAndroid ? "text-[10px]" : "text-xs"}`}
                allowFontScaling={false}
              >
                {isActive || isUpcoming ? "Ends" : "Ended"}
              </Text>
              <Text
                className={`font-semibold text-gray-700 ${isAndroid ? "text-xs" : "text-sm"}`}
                numberOfLines={1}
                allowFontScaling={false}
              >
                {moment(new Date(endDate)).format("DD/MM/YYYY, HH:mm")}
              </Text>
            </View>
          </View>

          <View
            className={`flex-row items-center bg-gray-50 rounded-lg ${isAndroid ? "px-2 py-1.5" : "px-2.5 py-2"} ml-2`}
          >
            <FontAwesome6
              name="user-group"
              size={isAndroid ? 12 : 14}
              color="#6B7280"
            />
            <Text
              className={`font-semibold text-gray-700 ml-1.5 ${isAndroid ? "text-[10px]" : "text-xs"}`}
              allowFontScaling={false}
            >
              {memberCount}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
