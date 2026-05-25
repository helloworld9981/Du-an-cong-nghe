import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import moment from "moment";
import React from "react";
import { Platform, Text, View } from "react-native";

const isAndroid = Platform.OS === "android";

export default function MemberCard({
  name,
  role,
  email,
  joinedAt,
  isAddingMember = false,
  isTeamMember = false,
}: {
  name: string;
  role?: string;
  email: string;
  joinedAt?: any;
  isAddingMember?: boolean;
  isTeamMember?: boolean;
}) {
  const gradientColors =
    role === "admin" ? ["#F59E0B", "#F97316"] : ["#6B7280", "#9CA3AF"];

  const roleConfig = {
    label: role === "admin" ? "Admin" : "Member",
    bgColor: role === "admin" ? "#FEF3C7" : "#F3F4F6",
    color: role === "admin" ? "#D97706" : "#6B7280",
  };

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
              numberOfLines={1}
              allowFontScaling={false}
            >
              {name}
            </Text>
          </View>
          {!isAddingMember && !isTeamMember && (
            <View
              className={`rounded-lg flex-row items-center ${isAndroid ? "px-2 py-1" : "px-2.5 py-1.5"}`}
              style={{ backgroundColor: roleConfig.bgColor }}
            >
              <Ionicons
                name={role === "admin" ? "shield-checkmark" : "person"}
                size={isAndroid ? 12 : 14}
                color={roleConfig.color}
              />
              <Text
                className={`font-semibold ml-1.5 ${isAndroid ? "text-[10px]" : "text-xs"}`}
                style={{ color: roleConfig.color }}
                allowFontScaling={false}
              >
                {roleConfig.label}
              </Text>
            </View>
          )}
        </View>

        <View
          className={`flex-row items-center ${isAndroid ? "mt-2" : "mt-3"}`}
        >
          <View
            className={`rounded-lg bg-gray-50 items-center justify-center mr-2 ${isAndroid ? "w-7 h-7" : "w-8 h-8"}`}
          >
            <Ionicons
              name="mail-outline"
              size={isAndroid ? 14 : 16}
              color="#6B7280"
            />
          </View>
          <View className="flex-1">
            <Text
              className={`text-gray-400 font-medium ${isAndroid ? "text-[10px]" : "text-xs"}`}
              allowFontScaling={false}
            >
              Email
            </Text>
            <Text
              className={`font-semibold text-gray-700 ${isAndroid ? "text-xs" : "text-sm"}`}
              numberOfLines={1}
              allowFontScaling={false}
            >
              {email}
            </Text>
          </View>
        </View>

        {(!isAddingMember || isTeamMember) && joinedAt && (
          <>
            <View
              className={`h-px bg-gray-100 ${isAndroid ? "my-2" : "my-3"}`}
            />
            <View className="flex-row items-center">
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
                  Joined
                </Text>
                <Text
                  className={`font-semibold text-gray-700 ${isAndroid ? "text-xs" : "text-sm"}`}
                  allowFontScaling={false}
                >
                  {moment(new Date(joinedAt)).format("DD/MM/YYYY, HH:mm")}
                </Text>
              </View>
            </View>
          </>
        )}
      </View>
    </View>
  );
}
