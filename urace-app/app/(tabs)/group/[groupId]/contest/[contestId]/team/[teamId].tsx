import {
  GetDetailTeam,
  GetDetailTeamStats,
  RemoveMemberFromTeam,
} from "@/api/team/team";
import DetailTeamOverviewCard from "@/components/team/detail-team-overview-card";
import DetailTeamStat from "@/components/team/detail-team-stat";
import TeamMemberCard from "@/components/team/team-member-card";
import { IContestTeam } from "@/types/contest";
import { ITeamStat } from "@/types/team";
import { useContestStore } from "@/zustand/contestStore";
import { useTeamStore } from "@/zustand/teamStore";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";

export default function Index() {
  const isAndroid = Platform.OS === "android";
  const horizontalPadding = isAndroid ? 12 : 16;

  const { teamId } = useLocalSearchParams();
  const targetTeamId = Array.isArray(teamId) ? teamId[0] : teamId;

  const [team, setTeam] = useState<IContestTeam>();
  const [teamStat, setTeamStat] = useState<ITeamStat>();
  const [activeNavigationTab, setActiveNavigationTab] = useState(0);

  const { refetchDetailTeam, setRefetchDetailTeam } = useTeamStore();
  const { selectedContest } = useContestStore();

  const isUpcoming = useMemo(() => {
    if (!selectedContest?.startAt) return false;
    return new Date(selectedContest.startAt) > new Date();
  }, [selectedContest]);

  const navigationOptions = [
    { label: "Statistics", icon: "bar-chart-2" },
    { label: "Members", icon: "users" },
  ];

  useEffect(() => {
    GetDetailTeam(targetTeamId)
      .then((res) => {
        if (res.data) {
          setTeam(res.data);
        }
      })
      .catch((err) => console.error(err));
  }, [refetchDetailTeam, targetTeamId]);

  useEffect(() => {
    GetDetailTeamStats(targetTeamId)
      .then((res) => {
        if (res.data) {
          setTeamStat(res.data);
        }
      })
      .catch((err) => console.error(err));
  }, [refetchDetailTeam, targetTeamId]);

  const handleRemoveMember = (userId: string) => {
    RemoveMemberFromTeam(targetTeamId, userId)
      .then((res) => {
        if (res.data) {
          setRefetchDetailTeam(refetchDetailTeam + 1);
          toast.success("Member removed successfully");
        }
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || "Failed to remove member");
      });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "#F9FAFB" }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: horizontalPadding,
            paddingVertical: isAndroid ? 12 : 14,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: isAndroid ? 38 : 42,
              height: isAndroid ? 38 : 42,
              borderRadius: isAndroid ? 12 : 14,
              backgroundColor: "#FFFFFF",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 4,
              elevation: 3,
            }}
            activeOpacity={0.7}
          >
            <Feather
              name="arrow-left"
              size={isAndroid ? 20 : 22}
              color="#4F6AEE"
            />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: isAndroid ? 12 : 16 }}>
            <Text
              style={{
                fontSize: isAndroid ? 18 : 20,
                fontWeight: "700",
                color: "#1F2937",
              }}
              numberOfLines={1}
              allowFontScaling={false}
            >
              Team Details
            </Text>
            {team?.name && (
              <Text
                style={{
                  fontSize: isAndroid ? 12 : 13,
                  color: "#6B7280",
                  fontWeight: "500",
                  marginTop: 2,
                }}
                numberOfLines={1}
                allowFontScaling={false}
              >
                {team.name}
              </Text>
            )}
          </View>
        </View>
      </SafeAreaView>

      <View
        style={{
          paddingHorizontal: horizontalPadding,
          marginBottom: isAndroid ? 12 : 16,
        }}
      >
        <DetailTeamOverviewCard teamName={team?.name} />
      </View>

      <View
        style={{
          paddingHorizontal: horizontalPadding,
          marginBottom: isAndroid ? 12 : 16,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            backgroundColor: "#F3F4F6",
            borderRadius: isAndroid ? 12 : 14,
            padding: isAndroid ? 4 : 5,
          }}
        >
          {navigationOptions.map((opt, idx) => {
            const isActive = activeNavigationTab === idx;
            return (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.8}
                onPress={() => setActiveNavigationTab(idx)}
                style={{ flex: 1 }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: isAndroid ? 10 : 12,
                    paddingHorizontal: isAndroid ? 12 : 16,
                    borderRadius: isAndroid ? 10 : 12,
                    backgroundColor: isActive ? "#FFFFFF" : "transparent",
                    shadowColor: isActive ? "#000" : "transparent",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isActive ? 0.08 : 0,
                    shadowRadius: 4,
                    elevation: isActive ? 3 : 0,
                    gap: 6,
                  }}
                >
                  <Feather
                    name={opt.icon as any}
                    size={isAndroid ? 14 : 16}
                    color={isActive ? "#4F6AEE" : "#9CA3AF"}
                  />
                  <Text
                    style={{
                      fontWeight: isActive ? "600" : "500",
                      color: isActive ? "#4F6AEE" : "#9CA3AF",
                      fontSize: isAndroid ? 13 : 14,
                    }}
                    allowFontScaling={false}
                  >
                    {opt.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={{ flex: 1 }}>
        {activeNavigationTab === 0 ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: horizontalPadding,
              paddingBottom: isAndroid ? 80 : 100,
            }}
            showsVerticalScrollIndicator={false}
          >
            <DetailTeamStat
              totalDistance={teamStat?.stats.totalDistance ?? 0}
              totalTrackDays={teamStat?.stats.totalTracklog ?? 0}
              averagePace={teamStat?.stats?.averagePace ?? 0}
              fatestPace={teamStat?.stats?.fatestPace ?? 0}
              maxDistance={teamStat?.stats?.maxDistance ?? 0}
            />
          </ScrollView>
        ) : !team?.members || team.members.length === 0 ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: isAndroid ? 24 : 32,
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
              No members yet
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
              This team doesn't have any members yet.
            </Text>
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: horizontalPadding,
              paddingBottom: isAndroid ? 80 : 100,
            }}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: isAndroid ? 12 : 16,
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
                <Feather
                  name="users"
                  size={isAndroid ? 14 : 16}
                  color="#4F6AEE"
                />
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
                  Team Members
                </Text>
                <Text
                  style={{
                    fontSize: isAndroid ? 11 : 12,
                    color: "#9CA3AF",
                    fontWeight: "500",
                  }}
                  allowFontScaling={false}
                >
                  {team.members.length}{" "}
                  {team.members.length > 1 ? "members" : "member"}
                </Text>
              </View>
            </View>

            <View style={{ gap: isAndroid ? 10 : 12 }}>
              {team.members.map((member, idx) => (
                <TeamMemberCard
                  key={idx}
                  name={member.name}
                  email={member.username}
                  joinedAt={member.joinedAt}
                  handleRemoveMember={() => handleRemoveMember(member.userId)}
                  memberId={member.userId}
                  member={member}
                  teamId={targetTeamId}
                  showRemoveButton={isUpcoming}
                />
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  );
}
