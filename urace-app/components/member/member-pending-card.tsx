import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";

const isAndroid = Platform.OS === "android";

export default function MemberPendingCard({
  name,
  email,
  handleAcceptRequest,
  handleDeclineRequest,
}: {
  name: string;
  email: string;
  handleAcceptRequest: () => void;
  handleDeclineRequest: () => void;
}) {
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
        colors={["#F59E0B", "#F97316"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          width: isAndroid ? 3 : 4,
          borderTopLeftRadius: 16,
          borderBottomLeftRadius: 16,
        }}
      />

      <View className={`flex-1 ${isAndroid ? "p-3" : "p-4"}`}>
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-1 mr-3">
            <Text
              className={`font-bold text-gray-800 ${isAndroid ? "text-sm" : "text-base"}`}
              numberOfLines={1}
              allowFontScaling={false}
            >
              {name}
            </Text>
          </View>
          <View
            className={`rounded-lg flex-row items-center ${isAndroid ? "px-2 py-1" : "px-2.5 py-1.5"}`}
            style={{ backgroundColor: "#FEF3C7" }}
          >
            <Ionicons
              name="time-outline"
              size={isAndroid ? 12 : 14}
              color="#D97706"
            />
            <Text
              className={`font-semibold ml-1.5 ${isAndroid ? "text-[10px]" : "text-xs"}`}
              style={{ color: "#D97706" }}
              allowFontScaling={false}
            >
              Pending
            </Text>
          </View>
        </View>

        <View
          className={`flex-row items-center ${isAndroid ? "mb-3" : "mb-4"}`}
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

        <View className="flex-row gap-2">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleDeclineRequest}
            style={{ flex: 1 }}
          >
            <View
              className={`rounded-xl flex-row items-center justify-center ${isAndroid ? "py-2.5" : "py-3"}`}
              style={{
                backgroundColor: "#FEF2F2",
                borderWidth: 1,
                borderColor: "#FECACA",
              }}
            >
              <Feather name="x" size={isAndroid ? 16 : 18} color="#EF4444" />
              <Text
                className={`font-semibold ml-2 ${isAndroid ? "text-xs" : "text-sm"}`}
                style={{ color: "#EF4444" }}
                allowFontScaling={false}
              >
                Decline
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleAcceptRequest}
            style={{ flex: 1 }}
          >
            <LinearGradient
              colors={["#22C55E", "#16A34A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className={`rounded-xl flex-row items-center justify-center ${isAndroid ? "py-2.5" : "py-3"}`}
            >
              <Feather
                name="check"
                size={isAndroid ? 16 : 18}
                color="#FFFFFF"
              />
              <Text
                className={`font-semibold ml-2 text-white ${isAndroid ? "text-xs" : "text-sm"}`}
                allowFontScaling={false}
              >
                Accept
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
