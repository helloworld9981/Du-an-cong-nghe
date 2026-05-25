import {
  FontAwesome5,
  FontAwesome6,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo } from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";

const isAndroid = Platform.OS === "android";

export default function GroupCard({
  groupName,
  activityLevel,
  description,
  groupMember,
  totalContests,
  activeContests,
  handlePress,
  isRenderRoleBadge,
  isAdmin,
}: {
  groupName: string;
  activityLevel: string;
  description?: string;
  groupMember: number;
  totalContests: number;
  activeContests: number;
  handlePress?: () => void;
  isRenderRoleBadge?: boolean;
  isAdmin?: boolean;
}) {
  const activityConfig = useMemo(() => {
    switch (activityLevel) {
      case "Quiet":
        return {
          color: "#94A3B8",
          bgColor: "#F1F5F9",
          icon: "sleep" as const,
        };
      case "Active":
        return {
          color: "#22C55E",
          bgColor: "#DCFCE7",
          icon: "run" as const,
        };
      case "Hot":
        return {
          color: "#EF4444",
          bgColor: "#FEE2E2",
          icon: "fire" as const,
        };
      default:
        return {
          color: "#94A3B8",
          bgColor: "#F1F5F9",
          icon: "sleep" as const,
        };
    }
  }, [activityLevel]);

  const roleConfig = useMemo(() => {
    if (isAdmin) {
      return {
        text: "Admin",
        colors: ["#F59E0B", "#F97316"] as const,
        icon: "shield-crown" as const,
      };
    }
    return {
      text: "Member",
      colors: ["#4F6AEE", "#9B4BE2"] as const,
      icon: "account" as const,
    };
  }, [isAdmin]);

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      className="rounded-2xl overflow-hidden"
      style={{
        backgroundColor: "white",
        shadowColor: "#6366F1",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 6,
      }}
      onPress={handlePress}
    >
      <View className="flex-row">
        <LinearGradient
          colors={["#4F6AEE", "#9B4BE2"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{
            width: isAndroid ? 3 : 4,
            borderTopLeftRadius: 16,
            borderBottomLeftRadius: 16,
          }}
        />

        <View className={`flex-1 ${isAndroid ? "p-3" : "p-4"}`}>
          <View
            className={`flex-row items-start justify-between ${isAndroid ? "mb-1.5" : "mb-2"}`}
          >
            <View className="flex-1 mr-3">
              <Text
                className={`font-bold text-gray-800 ${isAndroid ? "text-sm" : "text-base"}`}
                numberOfLines={2}
                allowFontScaling={false}
              >
                {groupName}
              </Text>
            </View>
            <View className="flex-row items-center space-x-1.5">
              {isRenderRoleBadge && (
                <LinearGradient
                  colors={roleConfig.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className={`rounded-full flex-row items-center ${isAndroid ? "px-2 py-0.5" : "px-2.5 py-1"}`}
                >
                  <MaterialCommunityIcons
                    name={roleConfig.icon}
                    size={isAndroid ? 10 : 12}
                    color="white"
                  />
                  <Text
                    className={`font-semibold text-white ml-1 ${isAndroid ? "text-[8px]" : "text-[10px]"}`}
                    allowFontScaling={false}
                  >
                    {roleConfig.text}
                  </Text>
                </LinearGradient>
              )}
              <View
                className={`rounded-full flex-row items-center ${isAndroid ? "px-2 py-0.5" : "px-2.5 py-1"}`}
                style={{ backgroundColor: activityConfig.bgColor }}
              >
                <MaterialCommunityIcons
                  name={activityConfig.icon}
                  size={isAndroid ? 10 : 12}
                  color={activityConfig.color}
                />
                <Text
                  className={`font-semibold ml-1 ${isAndroid ? "text-[8px]" : "text-[10px]"}`}
                  style={{ color: activityConfig.color }}
                  allowFontScaling={false}
                >
                  {activityLevel}
                </Text>
              </View>
            </View>
          </View>

          {description && (
            <Text
              className={`text-gray-500 leading-5 ${isAndroid ? "text-[10px] mb-2" : "text-xs mb-3"}`}
              numberOfLines={2}
              allowFontScaling={false}
            >
              {description}
            </Text>
          )}

          <View
            className={`h-[1px] bg-gray-100 ${isAndroid ? "mb-2" : "mb-3"}`}
          />

          <View className="flex-row items-center justify-between">
            <View
              className={`flex-row items-center bg-gray-50 rounded-xl ${isAndroid ? "px-2 py-1.5" : "px-3 py-2"}`}
            >
              <View
                className={`bg-blue-100 rounded-full mr-2 ${isAndroid ? "p-1" : "p-1.5"}`}
              >
                <FontAwesome6
                  name="user-group"
                  size={isAndroid ? 8 : 12}
                  color="#3B82F6"
                />
              </View>
              <View>
                <Text
                  className={`font-bold text-gray-800 ${isAndroid ? "text-[10px]" : "text-xs"}`}
                  allowFontScaling={false}
                >
                  {groupMember}
                </Text>
                <Text
                  className={`text-gray-400 ${isAndroid ? "text-[7px]" : "text-[9px]"}`}
                  allowFontScaling={false}
                >
                  {groupMember > 1 ? "Members" : "Member"}
                </Text>
              </View>
            </View>

            <View
              className={`flex-row items-center bg-gray-50 rounded-xl ${isAndroid ? "px-2 py-1.5" : "px-3 py-2"}`}
            >
              <View
                className={`bg-purple-100 rounded-full mr-2 ${isAndroid ? "p-1" : "p-1.5"}`}
              >
                <FontAwesome5
                  name="trophy"
                  size={isAndroid ? 8 : 12}
                  color="#A855F7"
                />
              </View>
              <View>
                <Text
                  className={`font-bold text-gray-800 ${isAndroid ? "text-[10px]" : "text-xs"}`}
                  allowFontScaling={false}
                >
                  {totalContests}
                </Text>
                <Text
                  className={`text-gray-400 ${isAndroid ? "text-[7px]" : "text-[9px]"}`}
                  allowFontScaling={false}
                >
                  {totalContests > 1 ? "Contests" : "Contest"}
                </Text>
              </View>
            </View>

            <View
              className={`flex-row items-center bg-green-50 rounded-xl ${isAndroid ? "px-2 py-1.5" : "px-3 py-2"}`}
            >
              <View
                className={`bg-green-100 rounded-full mr-2 ${isAndroid ? "p-1" : "p-1.5"}`}
              >
                <FontAwesome5
                  name="running"
                  size={isAndroid ? 8 : 12}
                  color="#22C55E"
                />
              </View>
              <View>
                <Text
                  className={`font-bold text-green-600 ${isAndroid ? "text-[10px]" : "text-xs"}`}
                  allowFontScaling={false}
                >
                  {activeContests}
                </Text>
                <Text
                  className={`text-green-500 ${isAndroid ? "text-[7px]" : "text-[9px]"}`}
                  allowFontScaling={false}
                >
                  Active
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
