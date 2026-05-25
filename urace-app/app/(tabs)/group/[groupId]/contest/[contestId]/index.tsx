import { GetContest } from "@/api/contest/contest";
import { GetUserRoleInGroup } from "@/api/group/group";
import ContestDetailParticipants from "@/components/contest/contest-detail-participants";
import ContestDetailTeam from "@/components/contest/contest-detail-team";
import ContestOverviewCard from "@/components/contest/contest-overview-card";
import ContestTeamStat from "@/components/contest/contest-team-stat";
import ParticipantLeaderboard from "@/components/contest/participant-leaderboard";
import TeamMemberLeaderboard from "@/components/contest/team-member-leaderboard";
import {
  contestDetailNavigationOptions,
  contestTeamNavigationOptions,
} from "@/constants/navigation";
import { ContestStatus } from "@/enums/contest";
import { IDashboardContest } from "@/types/contest";
import { useBottomSheetStore } from "@/zustand/bottomSheetStore";
import { useContestStore } from "@/zustand/contestStore";
import { useGroupStore } from "@/zustand/groupStore";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DetailContest() {
  const isAndroid = Platform.OS === "android";
  const { width } = useWindowDimensions();
  const horizontalPadding = isAndroid ? 12 : 16;

  const { contestId, groupId } = useLocalSearchParams();
  const targetContestId = Array.isArray(contestId) ? contestId[0] : contestId;
  const targetGroupId = Array.isArray(groupId) ? groupId[0] : groupId;

  const [contest, setContest] = useState<IDashboardContest>();

  const [activeNavigationTab, setActiveNavigationTab] = useState<number>(0);

  const { setSelectedContest, refetchContestDetail, setContestId } =
    useContestStore();
  const { setGroupId, setIsGroupAdmin } = useGroupStore();

  const { openSheet } = useBottomSheetStore();

  useEffect(() => {
    if (targetGroupId) {
      setGroupId(targetGroupId);
      GetUserRoleInGroup(targetGroupId)
        .then((res) => {
          if (res.data) {
            const role = res.data.role;
            setIsGroupAdmin(role === "admin" || role === "owner");
          }
        })
        .catch((err) => {
          console.error("Failed to get user role in group:", err);
          setIsGroupAdmin(false);
        });
    }
  }, [targetGroupId]);

  useEffect(() => {
    GetContest(targetContestId)
      .then((res) => {
        if (res.data) {
          setContest(res.data);
          setSelectedContest(res.data);
          setContestId(targetContestId);
        }
      })
      .catch((err) => console.error(err));
  }, [refetchContestDetail]);

  const isTeamContest = useMemo(() => {
    if (contest) {
      return contest?.contestType === "Team";
    }
    return true;
  }, [contest]);

  const navigationOptions = useMemo(() => {
    return isTeamContest
      ? contestTeamNavigationOptions
      : contestDetailNavigationOptions;
  }, [isTeamContest]);

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F9FAFB"
        translucent={false}
      />
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <View
          style={{
            paddingTop: isAndroid ? 4 : 0,
            paddingBottom: isAndroid ? 8 : 10,
            paddingHorizontal: horizontalPadding,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            style={{
              width: isAndroid ? 36 : 40,
              height: isAndroid ? 36 : 40,
              borderRadius: 12,
              backgroundColor: "#FFFFFF",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 4,
              elevation: 3,
            }}
            onPress={() => router.push(`/(tabs)/group/${groupId}`)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-back"
              size={isAndroid ? 18 : 20}
              color="#4F6AEE"
            />
          </TouchableOpacity>
          <Text
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: isAndroid ? 16 : 18,
              fontWeight: "700",
              color: "#1F2937",
              marginRight: isAndroid ? 36 : 40,
            }}
            allowFontScaling={false}
          >
            Contest Details
          </Text>
        </View>
        <View
          style={{
            paddingHorizontal: horizontalPadding,
            marginTop: isAndroid ? 4 : 8,
          }}
        >
          <ContestOverviewCard
            contestName={contest?.name}
            status={
              new Date(contest?.endAt as any) <= new Date()
                ? ContestStatus.Ended
                : ContestStatus.Active
            }
            startDate={contest?.startAt}
            endDate={contest?.endAt}
            contestDescription={contest?.description}
            contestParticipant={contest?.numberOfParticipants}
            contestType={contest?.contestType}
            contestActivityType={contest?.activityType}
            actionBtnIcon={
              <FontAwesome5
                name="edit"
                size={isAndroid ? 14 : 16}
                color="#ffffff"
              />
            }
            actionBtnText="Edit contest"
            onSubmit={() => {
              openSheet("createContest", {
                isEditing: true,
                groupId,
                selectedContest: contest,
              });
            }}
          />
        </View>
        <View
          style={{
            marginHorizontal: horizontalPadding,
            marginTop: isAndroid ? 12 : 16,
            marginBottom: isAndroid ? 8 : 12,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "#F3F4F6",
              borderRadius: isAndroid ? 12 : 16,
              padding: isAndroid ? 4 : 6,
            }}
          >
            {navigationOptions.map((opt, idx) => (
              <TouchableOpacity
                key={idx}
                style={{ flex: 1 }}
                activeOpacity={0.8}
                onPress={() => setActiveNavigationTab(opt.value)}
              >
                <View
                  style={{
                    borderRadius: isAndroid ? 10 : 12,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: isAndroid ? 8 : 10,
                    paddingHorizontal: isAndroid ? 8 : 12,
                    backgroundColor:
                      activeNavigationTab === opt.value
                        ? "#FFFFFF"
                        : "transparent",
                    shadowColor:
                      activeNavigationTab === opt.value
                        ? "#000"
                        : "transparent",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: activeNavigationTab === opt.value ? 0.08 : 0,
                    shadowRadius: 4,
                    elevation: activeNavigationTab === opt.value ? 3 : 0,
                  }}
                >
                  <Text
                    style={{
                      fontWeight:
                        activeNavigationTab === opt.value ? "600" : "500",
                      color:
                        activeNavigationTab === opt.value
                          ? "#4F6AEE"
                          : "#9CA3AF",
                      fontSize: isAndroid ? 11 : 12,
                    }}
                    allowFontScaling={false}
                  >
                    {opt.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={{ flex: 1 }}>
          {activeNavigationTab === 0 && !isTeamContest && (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingHorizontal: horizontalPadding,
                paddingBottom: isAndroid ? 80 : 100,
              }}
              showsVerticalScrollIndicator={false}
            >
              <ContestDetailParticipants
                contestId={targetContestId}
                contestStartDate={contest?.startAt}
              />
            </ScrollView>
          )}

          {activeNavigationTab === 0 && isTeamContest && (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingHorizontal: horizontalPadding,
                paddingBottom: isAndroid ? 80 : 100,
              }}
              showsVerticalScrollIndicator={false}
            >
              <ContestDetailTeam
                contestId={targetContestId}
                contestStartDate={contest?.startAt}
              />
            </ScrollView>
          )}

          {isTeamContest && activeNavigationTab === 1 && (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingBottom: isAndroid ? 80 : 100,
              }}
              showsVerticalScrollIndicator={false}
            >
              <ContestTeamStat />
            </ScrollView>
          )}

          {isTeamContest && activeNavigationTab === 2 && (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingBottom: isAndroid ? 80 : 100,
              }}
              showsVerticalScrollIndicator={false}
            >
              <TeamMemberLeaderboard />
            </ScrollView>
          )}

          {!isTeamContest && activeNavigationTab === 1 && (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingHorizontal: horizontalPadding,
                paddingBottom: isAndroid ? 80 : 100,
              }}
              showsVerticalScrollIndicator={false}
            >
              <ParticipantLeaderboard />
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}
