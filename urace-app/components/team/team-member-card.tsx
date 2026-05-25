import { ITeamMember } from "@/types/contest";
import { Feather } from "@expo/vector-icons";
import moment from "moment";
import React from "react";
import { Image, Platform, Text, TouchableOpacity, View } from "react-native";

export default function TeamMemberCard({
  name,
  email,
  joinedAt,
  handleRemoveMember,
  memberId,
  member,
  teamId,
  showRemoveButton = true,
}: {
  name: string;
  email: string;
  joinedAt?: any;
  handleRemoveMember: () => void;
  memberId: string;
  member: ITeamMember;
  teamId?: string;
  showRemoveButton?: boolean;
}) {
  const isAndroid = Platform.OS === "android";

  return (
    <View
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: isAndroid ? 14 : 16,
        padding: isAndroid ? 14 : 16,
        flexDirection: "row",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: isAndroid ? 2 : 0,
        borderWidth: 1,
        borderColor: "#F3F4F6",
      }}
    >
      <View
        style={{
          width: isAndroid ? 48 : 52,
          height: isAndroid ? 48 : 52,
          borderRadius: isAndroid ? 24 : 26,
          backgroundColor: "#F3F4F6",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          marginRight: isAndroid ? 12 : 14,
        }}
      >
        <Image
          source={require("../../assets/images/DefaultAvatar.png")}
          style={{
            width: isAndroid ? 48 : 52,
            height: isAndroid ? 48 : 52,
          }}
        />
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: isAndroid ? 15 : 16,
            fontWeight: "600",
            color: "#1F2937",
          }}
          numberOfLines={1}
          allowFontScaling={false}
        >
          {name}
        </Text>
        <Text
          style={{
            fontSize: isAndroid ? 12 : 13,
            color: "#9CA3AF",
            fontWeight: "500",
            marginTop: 2,
          }}
          numberOfLines={1}
          allowFontScaling={false}
        >
          @{email}
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 6,
            gap: 4,
          }}
        >
          <Feather name="clock" size={11} color="#9CA3AF" />
          <Text
            style={{
              fontSize: isAndroid ? 10 : 11,
              color: "#9CA3AF",
              fontWeight: "500",
            }}
            allowFontScaling={false}
          >
            Joined {moment(new Date(joinedAt)).format("MMM DD, YYYY")}
          </Text>
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: isAndroid ? 8 : 10,
        }}
      >
        {showRemoveButton && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={(e) => {
              e.stopPropagation();
              handleRemoveMember();
            }}
            style={{
              width: isAndroid ? 36 : 40,
              height: isAndroid ? 36 : 40,
              borderRadius: isAndroid ? 10 : 12,
              backgroundColor: "#FEE2E2",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather
              name="trash-2"
              size={isAndroid ? 16 : 18}
              color="#EF4444"
            />
          </TouchableOpacity>
        )}

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
      </View>
    </View>
  );
}
