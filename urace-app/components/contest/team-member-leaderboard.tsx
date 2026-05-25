import { GetTeamMemberLeaderboard } from "@/api/contest/contest";
import { IContestTeamMemberLeaderboard } from "@/types/contest";
import { useBottomSheetStore } from "@/zustand/bottomSheetStore";
import { useContestStore } from "@/zustand/contestStore";
import { useGroupStore } from "@/zustand/groupStore";
import { useTeamStore } from "@/zustand/teamStore";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ParticipantActivitiesBottomSheet from "./participant-activities-bottom-sheet";
import ParticipantLeaderboardCard from "./participant-leaderboard-card";

export default function TeamMemberLeaderboard() {
  const isAndroid = Platform.OS === "android";
  const horizontalPadding = isAndroid ? 12 : 16;

  const { allTeams, filteredTeamId } = useTeamStore();
  const { contestId, refetchContestDetail } = useContestStore();
  const [isLoading, setIsLoading] = useState(true);

  const { openSheet } = useBottomSheetStore();
  const { isGroupAdmin } = useGroupStore();

  const [selectedMember, setSelectedMember] = useState<{
    userId: string;
    name: string;
    teamId?: string;
  } | null>(null);
  const [isActivitiesSheetVisible, setIsActivitiesSheetVisible] =
    useState(false);

  const getFilteredTeamName = () => {
    if (filteredTeamId) {
      const team = allTeams.find((team: any) => team._id === filteredTeamId);
      return team?.name || "Team";
    }
    return "All Teams";
  };

  const [leaderboard, setLeaderboard] =
    useState<IContestTeamMemberLeaderboard>();

  useEffect(() => {
    setIsLoading(true);
    GetTeamMemberLeaderboard(contestId, filteredTeamId)
      .then((res) => {
        if (res.data) {
          setLeaderboard(res.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [filteredTeamId, contestId, refetchContestDetail]);

  const handleViewActivities = (
    userId: string,
    name: string,
    teamId: string,
  ) => {
    setSelectedMember({ userId, name, teamId });
    setIsActivitiesSheetVisible(true);
  };

  const handleCloseActivitiesSheet = () => {
    setIsActivitiesSheetVisible(false);
    setSelectedMember(null);
  };

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: horizontalPadding,
          marginBottom: isAndroid ? 12 : 16,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#EEF2FF",
            paddingHorizontal: isAndroid ? 12 : 14,
            paddingVertical: isAndroid ? 8 : 10,
            borderRadius: isAndroid ? 10 : 12,
            gap: 6,
            borderWidth: 1,
            borderColor: "#C7D2FE",
          }}
        >
          <Feather
            name={filteredTeamId ? "users" : "layers"}
            size={isAndroid ? 14 : 16}
            color="#4F6AEE"
          />
          <Text
            style={{
              fontSize: isAndroid ? 13 : 14,
              fontWeight: "600",
              color: "#4F6AEE",
            }}
            allowFontScaling={false}
          >
            {getFilteredTeamName()}
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            openSheet("filterTeam");
          }}
        >
          <LinearGradient
            colors={["#4F6AEE", "#9B4BE2"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: isAndroid ? 12 : 14,
              paddingVertical: isAndroid ? 8 : 10,
              borderRadius: isAndroid ? 10 : 12,
              gap: 6,
            }}
          >
            <Feather name="filter" size={isAndroid ? 14 : 16} color="#FFFFFF" />
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: isAndroid ? 12 : 13,
                fontWeight: "600",
              }}
              allowFontScaling={false}
            >
              Filter
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      <View
        style={{
          flex: 1,
          backgroundColor: "#FFFFFF",
          borderTopLeftRadius: isAndroid ? 20 : 24,
          borderTopRightRadius: isAndroid ? 20 : 24,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: isAndroid ? 8 : 0,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: horizontalPadding,
            paddingTop: isAndroid ? 16 : 20,
            paddingBottom: isAndroid ? 12 : 16,
            gap: 8,
          }}
        >
          <View
            style={{
              width: isAndroid ? 32 : 36,
              height: isAndroid ? 32 : 36,
              borderRadius: isAndroid ? 8 : 10,
              backgroundColor: "#4F6AEE15",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="award" size={isAndroid ? 14 : 16} color="#4F6AEE" />
          </View>
          <View>
            <Text
              style={{
                fontSize: isAndroid ? 16 : 18,
                fontWeight: "700",
                color: "#1F2937",
              }}
              allowFontScaling={false}
            >
              Member Rankings
            </Text>
            {leaderboard?.members && leaderboard.members.length > 0 && (
              <Text
                style={{
                  fontSize: isAndroid ? 11 : 12,
                  color: "#9CA3AF",
                  fontWeight: "500",
                }}
                allowFontScaling={false}
              >
                {leaderboard.members.length} members ranked
              </Text>
            )}
          </View>
        </View>

        {isLoading ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 60,
            }}
          >
            <ActivityIndicator size="large" color="#4F6AEE" />
            <Text
              style={{
                marginTop: 12,
                fontSize: isAndroid ? 13 : 14,
                color: "#6B7280",
              }}
              allowFontScaling={false}
            >
              Loading rankings...
            </Text>
          </View>
        ) : !leaderboard?.members || leaderboard.members.length === 0 ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: isAndroid ? 24 : 32,
              paddingVertical: 60,
            }}
          >
            <View
              style={{
                width: isAndroid ? 80 : 100,
                height: isAndroid ? 80 : 100,
                borderRadius: isAndroid ? 40 : 50,
                backgroundColor: "#F3F4F6",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: isAndroid ? 16 : 20,
              }}
            >
              <Feather
                name="users"
                size={isAndroid ? 32 : 40}
                color="#9CA3AF"
              />
            </View>
            <Text
              style={{
                fontSize: isAndroid ? 16 : 18,
                fontWeight: "600",
                color: "#374151",
                textAlign: "center",
              }}
              allowFontScaling={false}
            >
              No activities yet
            </Text>
            <Text
              style={{
                fontSize: isAndroid ? 13 : 14,
                color: "#9CA3AF",
                textAlign: "center",
                marginTop: 8,
                lineHeight: isAndroid ? 18 : 20,
              }}
              allowFontScaling={false}
            >
              Team members haven't recorded any activities for this contest yet.
            </Text>
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: horizontalPadding,
              gap: isAndroid ? 10 : 12,
              paddingBottom: isAndroid ? 80 : 100,
            }}
            showsVerticalScrollIndicator={false}
          >
            {leaderboard.members.map((member, idx) => (
              <ParticipantLeaderboardCard
                key={idx}
                rank={member.rank}
                name={member.userName}
                totalDistance={member.totalDistance}
                averagePace={member.averagePace}
                fastestPace={member.bestPace}
                teamName={member.teamName}
                isTeamLeaderboard={true}
                stravaId={member.stravaUserId}
                userId={member.userId}
                onViewActivities={() =>
                  handleViewActivities(
                    member.userId,
                    member.userName,
                    member.teamId,
                  )
                }
              />
            ))}
          </ScrollView>
        )}
      </View>

      <Modal
        visible={isActivitiesSheetVisible}
        transparent
        animationType="none"
        onRequestClose={handleCloseActivitiesSheet}
      >
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <Pressable
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
            }}
            onPress={handleCloseActivitiesSheet}
          />
          <ParticipantActivitiesBottomSheet
            visible={isActivitiesSheetVisible}
            onClose={handleCloseActivitiesSheet}
            contestId={contestId}
            userId={selectedMember?.userId}
            participantName={selectedMember?.name}
            teamId={selectedMember?.teamId}
            isAdmin={isGroupAdmin}
          />
        </View>
      </Modal>
    </View>
  );
}
