import { Feather } from "@expo/vector-icons";
import React from "react";
import { Image, Platform, Text, TouchableOpacity, View } from "react-native";

export default function ContestParticipantCard({
  participantDisplayName,
  participantUsername,
  participantAvatar,
  onPress,
}: {
  participantDisplayName?: string;
  participantUsername?: string;
  participantAvatar?: string;
  onPress?: () => void;
}) {
  const isAndroid = Platform.OS === "android";

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: isAndroid ? 12 : 14,
        padding: isAndroid ? 12 : 14,
        flexDirection: "row",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: isAndroid ? 3 : 0,
        borderWidth: 1,
        borderColor: "#F3F4F6",
      }}
    >
      <View
        style={{
          width: isAndroid ? 44 : 48,
          height: isAndroid ? 44 : 48,
          borderRadius: isAndroid ? 22 : 24,
          backgroundColor: "#F3F4F6",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {participantAvatar ? (
          <Image
            source={{ uri: participantAvatar }}
            style={{
              width: isAndroid ? 44 : 48,
              height: isAndroid ? 44 : 48,
            }}
          />
        ) : (
          <Image
            source={require("../../assets/images/DefaultAvatar.png")}
            style={{
              width: isAndroid ? 44 : 48,
              height: isAndroid ? 44 : 48,
            }}
          />
        )}
      </View>

      {/* Info */}
      <View style={{ flex: 1, marginLeft: isAndroid ? 10 : 12 }}>
        <Text
          style={{
            fontSize: isAndroid ? 14 : 15,
            fontWeight: "600",
            color: "#1F2937",
          }}
          numberOfLines={1}
          allowFontScaling={false}
        >
          {participantDisplayName || "Unknown"}
        </Text>
        <Text
          style={{
            fontSize: isAndroid ? 12 : 13,
            fontWeight: "500",
            color: "#9CA3AF",
            marginTop: 2,
          }}
          numberOfLines={1}
          allowFontScaling={false}
        >
          @{participantUsername || "username"}
        </Text>
      </View>

      <View
        style={{
          width: isAndroid ? 28 : 32,
          height: isAndroid ? 28 : 32,
          borderRadius: isAndroid ? 8 : 10,
          backgroundColor: "#F3F4F6",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Feather
          name="chevron-right"
          size={isAndroid ? 16 : 18}
          color="#9CA3AF"
        />
      </View>
    </TouchableOpacity>
  );
}
