import { useBottomSheetStore } from "@/zustand/bottomSheetStore";
import { useContestStore } from "@/zustand/contestStore";
import { useGroupStore } from "@/zustand/groupStore";
import { useTeamStore } from "@/zustand/teamStore";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";

export default function ContestTeamCard({
  name,
  numberOfMember,
  totalDistance,
  averagePace,
  totalTracklog,
  teamId,
  showAddMember = true,
}: {
  name: string;
  numberOfMember: number;
  totalDistance?: number;
  averagePace?: number;
  totalTracklog?: number;
  teamId: string;
  showAddMember?: boolean;
}) {
  const isAndroid = Platform.OS === "android";

  const { setSelectedTeamId } = useTeamStore();
  const { groupId } = useGroupStore();
  const { contestId } = useContestStore();
  const { openSheet } = useBottomSheetStore();

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => {
        router.push(
          `/(tabs)/group/${groupId}/contest/${contestId}/team/${teamId}`
        );
        setSelectedTeamId(teamId);
      }}
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: isAndroid ? 16 : 18,
        shadowColor: "#4F6AEE",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: isAndroid ? 4 : 0,
        overflow: "hidden",
      }}
    >
      <LinearGradient
        colors={["#4F6AEE", "#9B4BE2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          height: 4,
          width: "100%",
        }}
      />
      <View
        style={{
          padding: isAndroid ? 14 : 16,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <LinearGradient
          colors={["#EEF2FF", "#F5F3FF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: isAndroid ? 48 : 52,
            height: isAndroid ? 48 : 52,
            borderRadius: isAndroid ? 14 : 16,
            alignItems: "center",
            justifyContent: "center",
            marginRight: isAndroid ? 12 : 14,
          }}
        >
          <Feather name="users" size={isAndroid ? 22 : 24} color="#4F6AEE" />
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: isAndroid ? 15 : 16,
              fontWeight: "700",
              color: "#1F2937",
            }}
            numberOfLines={1}
            allowFontScaling={false}
          >
            {name}
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 6,
            }}
          >
            <LinearGradient
              colors={["#4F6AEE15", "#9B4BE215"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 8,
                gap: 5,
              }}
            >
              <Feather name="user" size={11} color="#6366F1" />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: "#6366F1",
                }}
                allowFontScaling={false}
              >
                {numberOfMember} {numberOfMember > 1 ? "members" : "member"}
              </Text>
            </LinearGradient>
          </View>
        </View>
        {showAddMember && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={(e) => {
              e.stopPropagation();
              openSheet("addMemberToTeam", {
                groupId,
                contestId,
                teamId,
              });
              setSelectedTeamId(teamId);
            }}
            style={{
              width: isAndroid ? 38 : 42,
              height: isAndroid ? 38 : 42,
              borderRadius: isAndroid ? 10 : 12,
              backgroundColor: "#F0FDF4",
              alignItems: "center",
              justifyContent: "center",
              marginLeft: isAndroid ? 8 : 10,
              borderWidth: 1,
              borderColor: "#BBF7D0",
            }}
          >
            <Feather
              name="user-plus"
              size={isAndroid ? 16 : 18}
              color="#22C55E"
            />
          </TouchableOpacity>
        )}
        <View
          style={{
            width: isAndroid ? 32 : 36,
            height: isAndroid ? 32 : 36,
            borderRadius: isAndroid ? 8 : 10,
            backgroundColor: "#F8FAFC",
            alignItems: "center",
            justifyContent: "center",
            marginLeft: isAndroid ? 6 : 8,
          }}
        >
          <Feather
            name="chevron-right"
            size={isAndroid ? 18 : 20}
            color="#94A3B8"
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}
