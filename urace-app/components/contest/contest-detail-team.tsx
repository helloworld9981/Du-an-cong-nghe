import { GetTeamsForContest } from "@/api/contest/contest";
import { IContestTeam } from "@/types/contest";
import { useBottomSheetStore } from "@/zustand/bottomSheetStore";
import { useTeamStore } from "@/zustand/teamStore";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ContestTeamCard from "../team/contest-team-card";

export default function ContestDetailTeam({
  contestId,
  contestStartDate,
}: {
  contestId: string;
  contestStartDate?: Date | string;
}) {
  const isAndroid = Platform.OS === "android";
  const [teams, setTeams] = useState<IContestTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { refetchTeams, setAllTeams } = useTeamStore();
  const { openSheet } = useBottomSheetStore();

  const isUpcoming = contestStartDate
    ? new Date(contestStartDate) > new Date()
    : false;

  useEffect(() => {
    setIsLoading(true);
    GetTeamsForContest(contestId)
      .then((res) => {
        if (res.data) {
          setTeams(res.data);
          setAllTeams(res.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => {
        setIsLoading(false);
      });
  }, [refetchTeams, contestId]);

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: isAndroid ? 12 : 16,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
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
            <Feather name="users" size={isAndroid ? 14 : 16} color="#4F6AEE" />
          </View>
          <View>
            <Text
              style={{
                fontSize: isAndroid ? 14 : 15,
                fontWeight: "600",
                color: "#1F2937",
              }}
              allowFontScaling={false}
            >
              Teams
            </Text>
            {teams.length > 0 && (
              <Text
                style={{
                  fontSize: isAndroid ? 11 : 12,
                  color: "#9CA3AF",
                  fontWeight: "500",
                }}
                allowFontScaling={false}
              >
                {teams.length} {teams.length > 1 ? "teams" : "team"}
              </Text>
            )}
          </View>
        </View>

        {isUpcoming && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              openSheet("createTeam", {
                contestId,
              });
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
              <Feather name="plus" size={isAndroid ? 14 : 16} color="#FFFFFF" />
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: isAndroid ? 12 : 13,
                  fontWeight: "600",
                }}
                allowFontScaling={false}
              >
                Create
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
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
            Loading teams...
          </Text>
        </View>
      ) : teams.length === 0 ? (
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
            <Feather name="users" size={isAndroid ? 32 : 40} color="#9CA3AF" />
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
            No teams yet
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
            {isUpcoming
              ? "Create teams to get started with this contest."
              : "No teams were created for this contest."}
          </Text>
          {isUpcoming && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                openSheet("createTeam", {
                  contestId,
                });
              }}
              style={{ marginTop: isAndroid ? 16 : 20 }}
            >
              <LinearGradient
                colors={["#4F6AEE", "#9B4BE2"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: isAndroid ? 20 : 24,
                  paddingVertical: isAndroid ? 12 : 14,
                  borderRadius: isAndroid ? 12 : 14,
                  gap: 8,
                }}
              >
                <Feather
                  name="plus"
                  size={isAndroid ? 16 : 18}
                  color="#FFFFFF"
                />
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: isAndroid ? 14 : 15,
                    fontWeight: "600",
                  }}
                  allowFontScaling={false}
                >
                  Create Team
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={{ gap: isAndroid ? 10 : 12 }}>
          {teams.map((team, idx) => (
            <ContestTeamCard
              key={idx}
              name={team.name}
              numberOfMember={team.members.length}
              totalDistance={team.totalDistance}
              averagePace={team.averagePace}
              totalTracklog={team.totalTracklog}
              teamId={team._id}
              showAddMember={isUpcoming}
            />
          ))}
        </View>
      )}
    </View>
  );
}
