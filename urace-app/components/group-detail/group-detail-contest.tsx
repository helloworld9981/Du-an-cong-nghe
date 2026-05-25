import { ContestStatus } from "@/enums/contest";
import { IContest } from "@/types/contest";
import { useBottomSheetStore } from "@/zustand/bottomSheetStore";
import { useContestStore } from "@/zustand/contestStore";
import { AntDesign } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ContestCard from "../contest/contest-card";
import NoData from "../ui/no-data";

const isAndroid = Platform.OS === "android";

export default function GroupDetailContests({
  isAdmin,
  currentContestTab,
  setCurrentContestTab,
  groupId,
  contests,
  isLoading,
  refreshContest,
  setRefreshContest,
  fetchContests,
}: {
  isAdmin: boolean;
  currentContestTab: number;
  setCurrentContestTab: (currentContestTab: number) => void;
  groupId: string;
  contests: IContest[];
  isLoading: boolean;
  refreshContest: boolean;
  setRefreshContest: (refreshContest: boolean) => void;
  fetchContests: () => void;
}) {
  const { setIsCreatingContest } = useContestStore();

  const { openSheet } = useBottomSheetStore();

  const noDataContent = useMemo(() => {
    return currentContestTab === 0
      ? "It's quiet here...Time to shake things up with a contest."
      : "No history yet. Past contests will show up here once they end.";
  }, [currentContestTab]);
  const noDataBtnText = useMemo(() => {
    return currentContestTab === 0 ? "Create contest" : undefined;
  }, [currentContestTab]);

  const filteredContests = useMemo(() => {
    return currentContestTab === 0
      ? contests.filter((contest) => new Date(contest.endAt) > new Date())
      : contests.filter((contest) => new Date(contest.endAt) <= new Date());
  }, [currentContestTab, contests]);
  const handleFabPress = () => {
    openSheet("createContest", {
      isEditing: false,
      groupId,
    });
  };

  const onRefresh = useCallback(async () => {
    setRefreshContest(true);
    await fetchContests();
    setRefreshContest(false);
  }, [fetchContests]);

  return (
    <View style={{ flex: 1 }}>
      <View className={isAndroid ? "mb-3" : "mb-4"}>
        <View
          className={`flex-row items-center bg-gray-50 rounded-2xl ${isAndroid ? "p-1" : "p-1.5"}`}
        >
          <TouchableOpacity
            onPress={() => setCurrentContestTab(0)}
            activeOpacity={0.7}
            className="flex-1"
          >
            {currentContestTab === 0 ? (
              <LinearGradient
                colors={["#4F6AEE", "#9B4BE2"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className={`rounded-xl ${isAndroid ? "py-2 px-2" : "py-2.5 px-4"}`}
              >
                <Text
                  className={`text-white font-semibold text-center ${isAndroid ? "text-xs" : "text-sm"}`}
                  allowFontScaling={false}
                >
                  Active contests
                </Text>
              </LinearGradient>
            ) : (
              <View
                className={`rounded-xl ${isAndroid ? "py-2 px-2" : "py-2.5 px-4"}`}
              >
                <Text
                  className={`text-gray-600 font-medium text-center ${isAndroid ? "text-xs" : "text-sm"}`}
                  allowFontScaling={false}
                >
                  Active contests
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setCurrentContestTab(1)}
            activeOpacity={0.7}
            className="flex-1"
          >
            {currentContestTab === 1 ? (
              <LinearGradient
                colors={["#4F6AEE", "#9B4BE2"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className={`rounded-xl ${isAndroid ? "py-2 px-2" : "py-2.5 px-4"}`}
              >
                <Text
                  className={`text-white font-semibold text-center ${isAndroid ? "text-xs" : "text-sm"}`}
                  allowFontScaling={false}
                >
                  Past contests
                </Text>
              </LinearGradient>
            ) : (
              <View
                className={`rounded-xl ${isAndroid ? "py-2 px-2" : "py-2.5 px-4"}`}
              >
                <Text
                  className={`text-gray-600 font-medium text-center ${isAndroid ? "text-xs" : "text-sm"}`}
                  allowFontScaling={false}
                >
                  Past contests
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
      {isLoading && (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4F6AEE" />
        </View>
      )}
      {filteredContests?.length === 0 && !isLoading && (
        <ScrollView
          className="mt-2"
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingBottom: isAdmin ? (isAndroid ? 130 : 140) : 100,
          }}
        >
          <NoData
            content={noDataContent}
            buttonText={noDataBtnText}
            buttonIcon={
              <AntDesign
                name="plus"
                size={isAndroid ? 14 : 16}
                color={"#fff"}
              />
            }
            handleSubmit={() => {
              openSheet("createContest", {
                isEditing: false,
                groupId,
              });
            }}
          />
        </ScrollView>
      )}
      {filteredContests?.length > 0 && !isLoading && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingBottom: isAdmin ? (isAndroid ? 130 : 140) : 100,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshContest}
              onRefresh={onRefresh}
              tintColor="#4F6AEE"
              colors={["#4F6AEE", "#9B4BE2"]}
            />
          }
        >
          {filteredContests.map((contest, idx) => (
            <TouchableOpacity
              key={idx}
              className={isAndroid ? "mb-2" : "mb-3"}
              activeOpacity={0.8}
              onPress={() =>
                router.push(`/(tabs)/group/${groupId}/contest/${contest._id}`)
              }
            >
              <ContestCard
                name={contest.name}
                status={
                  new Date(contest.endAt) <= new Date()
                    ? ContestStatus.Ended
                    : ContestStatus.Active
                }
                startDate={contest.startAt}
                endDate={contest.endAt}
                type={contest.contestType}
                activityType={contest.activityType}
                memberCount={contest.numberOfParticipants}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {isAdmin && (
        <View
          style={{
            position: "absolute",
            bottom: isAndroid ? 110 : 120,
            right: isAndroid ? 16 : 20,
            zIndex: 999,
          }}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleFabPress}
            style={{
              shadowColor: "#4F6AEE",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.4,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <LinearGradient
              colors={["#4F6AEE", "#9B4BE2"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: isAndroid ? 52 : 60,
                height: isAndroid ? 52 : 60,
                borderRadius: isAndroid ? 26 : 30,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <AntDesign name="plus" size={isAndroid ? 24 : 28} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
