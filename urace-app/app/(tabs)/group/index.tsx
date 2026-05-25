import { GetAllGroups, GetUserRoleInGroup } from "@/api/group/group";
import GroupCard from "@/components/groups/group-card";
import NoData from "@/components/ui/no-data";
import { groupNavigationOptions } from "@/constants/navigation";
import { IGroupDetail } from "@/types/group";
import { useBottomSheetStore } from "@/zustand/bottomSheetStore";
import { useGroupStore } from "@/zustand/groupStore";
import { AntDesign, Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "react-i18next";


interface IGroupWithRole extends IGroupDetail {
  userRole?: string;
}

const isAndroid = Platform.OS === "android";

export default function Index() {
  const [activeNavigationTab, setActiveNavigationTab] = useState<number>(0);
  const [groupQuantities, setGroupQuantities] = useState<number[]>([0, 0]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const colors = useTheme();
  const { t } = useTranslation();
  const cardBackground = (colors as any).card ?? colors.background;
  const mutedBackground = (colors as any).muted ?? cardBackground;
  const skeletonBackground = (colors as any).skeleton ?? mutedBackground;

  const [myGroups, setMyGroups] = useState<IGroupWithRole[]>();
  const [otherGroups, setOtherGroups] = useState<IGroupWithRole[]>();

  const { refetchGroups, isEditingGroup, selectedGroup } = useGroupStore();
  const { openSheet } = useBottomSheetStore();

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const fabScale = useRef(new Animated.Value(1)).current;

  const noDataContent = useMemo(() => {
    return activeNavigationTab === 0
      ? t("groups.no_joined_groups")
      : t("groups.no_available_groups");
  }, [activeNavigationTab, t]);

  const filteredGroups = useMemo(() => {
    const groups = activeNavigationTab === 0 ? myGroups : otherGroups;
    if (!searchQuery.trim()) return groups;
    return groups?.filter(
      (group) =>
        group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeNavigationTab, myGroups, otherGroups, searchQuery]);

  const noDataRenderCondition = useMemo(() => {
    return filteredGroups?.length === 0;
  }, [filteredGroups]);

  const fetchGroups = async () => {
    try {
      const res = await GetAllGroups();

      const myGroupsWithRoles = await Promise.all(
        res.data.myGroups.map(async (group: any) => {
          try {
            const roleRes = await GetUserRoleInGroup(group._id);
            return {
              ...group,
              userRole: roleRes.data?.role || "member",
            };
          } catch (error) {
            return {
              ...group,
              userRole: "member",
            };
          }
        })
      );
      setMyGroups(myGroupsWithRoles);
      setOtherGroups(res.data.otherGroups);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchGroups();
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchGroups();
    // Animate content on mount
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [refetchGroups]);

  useEffect(() => {
    if (myGroups || otherGroups) {
      setGroupQuantities([myGroups?.length ?? 0, otherGroups?.length ?? 0]);
    }
  }, [otherGroups, myGroups]);

  const navigateToGroupDetail = (groupId: string) => {
    router.push({
      pathname: "/(tabs)/group/[groupId]",
      params: { groupId },
    });
  };

  const { setIsCreatingGroup } = useGroupStore();

  const handleFabPress = () => {
    // FAB press animation
    Animated.sequence([
      Animated.timing(fabScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fabScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    openSheet("createGroup", {
      isEditing: isEditingGroup,
      group: selectedGroup,
    });
  };

  return (
   <View className="flex-1" style={{ backgroundColor: colors.background }}>

      <StatusBar barStyle="light-content" backgroundColor="#4F6AEE" />

      {/* Header with Gradient */}
      <LinearGradient
        colors={["#4F6AEE", "#9B4BE2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: isAndroid ? 40 : 60,
          paddingBottom: isAndroid ? 16 : 24,
          borderBottomLeftRadius: isAndroid ? 20 : 24,
          borderBottomRightRadius: isAndroid ? 20 : 24,
        }}
      >
        <View className={isAndroid ? "px-4" : "px-5"}>
          <View
            className={`flex-row items-center justify-between ${isAndroid ? "mb-3" : "mb-4"}`}
          >
            <View>
              <Text
                className={`text-white font-bold ${isAndroid ? "text-xl" : "text-2xl"}`}
                allowFontScaling={false}
              >
                {t("groups.title")}
              </Text>
              <Text
                className={`text-white/70 mt-1 ${isAndroid ? "text-xs" : "text-sm"}`}
                allowFontScaling={false}
              >
                {t("groups.subtitle")}
              </Text>
            </View>
            <View
              className={`bg-white/20 rounded-full ${isAndroid ? "p-1.5" : "p-2"}`}
            >
              <Ionicons
                name="people"
                size={isAndroid ? 20 : 24}
                color="white"
              />
            </View>
          </View>

          <View
            className={`flex-row items-center bg-white/20 rounded-2xl ${isAndroid ? "px-3 py-2" : "px-4 py-3"}`}
            style={{ marginTop: isAndroid ? 4 : 8 }}
          >
            <Feather
              name="search"
              size={isAndroid ? 16 : 20}
              color="rgba(255,255,255,0.8)"
            />
            <TextInput
              className={`flex-1 ml-3 text-white ${isAndroid ? "text-xs" : "text-sm"}`}
              placeholder={t("groups.search_placeholder")}
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              allowFontScaling={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Feather
                  name="x"
                  size={isAndroid ? 16 : 18}
                  color="rgba(255,255,255,0.8)"
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      <View className={`mx-4 ${isAndroid ? "mt-3" : "mt-4"}`}>
        <View
          className={`flex-row rounded-2xl ${isAndroid ? "p-1" : "p-1.5"}`}
          style={{ backgroundColor: mutedBackground }}
        >
          {groupNavigationOptions.map((opt, idx) => (
            <TouchableOpacity
              key={idx}
              className="flex-1"
              activeOpacity={0.8}
              onPress={() => setActiveNavigationTab(opt.value)}
            >
              <View
                className={`rounded-xl flex-row items-center justify-center ${
                  activeNavigationTab === opt.value ? "" : ""
                } ${isAndroid ? "py-2 px-2" : "py-3 px-4"}`}
                style={
                  activeNavigationTab === opt.value
                    ? {
                        backgroundColor: cardBackground,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.08,
                        shadowRadius: 4,
                        elevation: 3,
                        borderRadius: 12,
                      }
                    : {}
                }
              >
                <Text
                  className={`font-semibold ${
                    activeNavigationTab === opt.value
                      ? "text-[#4F6AEE]"
                      : "text-gray-400"
                  } ${isAndroid ? "text-xs" : "text-sm"}`}
                  allowFontScaling={false}
                >
                  {idx === 0 ? t("groups.my_groups") : t("groups.discover_groups")}
                </Text>
                <View
                  className={`ml-2 rounded-full ${
                    activeNavigationTab === opt.value
                      ? "bg-[#4F6AEE]"
                      : ""
                  } ${isAndroid ? "px-1.5 py-0.5" : "px-2 py-0.5"}`}
                  style={activeNavigationTab === opt.value ? undefined : { backgroundColor: mutedBackground }}
                >
                  <Text
                    className={`font-bold ${
                      activeNavigationTab === opt.value
                        ? "text-white"
                        : "text-gray-500"
                    } ${isAndroid ? "text-[10px]" : "text-xs"}`}
                    allowFontScaling={false}
                  >
                    {groupQuantities[idx]}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingBottom: 130,
            paddingTop: isAndroid ? 12 : 16,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#4F6AEE"
              colors={["#4F6AEE"]}
            />
          }
        >
          {isLoading ? (
            <View className={`px-4 ${isAndroid ? "space-y-2" : "space-y-3"}`}>
              {[1, 2, 3].map((_, idx) => (
                <View
                  key={idx}
                  className={`rounded-2xl animate-pulse ${isAndroid ? "p-3" : "p-4"}`}
                  style={{
                    backgroundColor: cardBackground,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
                >
                  <View className="flex-row justify-between items-center mb-3">
                    <View
                      className={`rounded-lg ${isAndroid ? "h-4 w-28" : "h-5 w-32"}`}
                      style={{ backgroundColor: skeletonBackground }}
                    />
                    <View
                      className={`rounded-full ${isAndroid ? "h-5 w-14" : "h-6 w-16"}`}
                      style={{ backgroundColor: skeletonBackground }}
                    />
                  </View>
                  <View
                    className={`w-full rounded-lg mb-2 ${isAndroid ? "h-3" : "h-4"}`}
                    style={{ backgroundColor: skeletonBackground }}
                  />
                  <View
                    className={`w-3/4 rounded-lg mb-4 ${isAndroid ? "h-3" : "h-4"}`}
                    style={{ backgroundColor: skeletonBackground }}
                  />
                  <View className="flex-row justify-between">
                    <View
                      className={`rounded-lg ${isAndroid ? "h-3 w-16" : "h-4 w-20"}`}
                      style={{ backgroundColor: skeletonBackground }}
                    />
                    <View
                      className={`rounded-lg ${isAndroid ? "h-3 w-20" : "h-4 w-24"}`}
                      style={{ backgroundColor: skeletonBackground }}
                    />
                    <View
                      className={`rounded-lg ${isAndroid ? "h-3 w-20" : "h-4 w-24"}`}
                      style={{ backgroundColor: skeletonBackground }}
                    />
                  </View>
                </View>
              ))}
            </View>
          ) : noDataRenderCondition ? (
            <View className="px-5 mt-4">
              <NoData
                content={
                  searchQuery
                    ? t("groups.no_search_result", { query: searchQuery })
                    : noDataContent
                }
                buttonText={searchQuery ? undefined : t("groups.create_group")}
                buttonIcon={
                  searchQuery ? undefined : (
                    <AntDesign
                      name="plus"
                      color={"#FFF"}
                      size={isAndroid ? 14 : 16}
                    />
                  )
                }
                imageSource={require("../../../assets/images/NoData02.png")}
                handleSubmit={() => {
                  openSheet("createGroup");
                }}
              />
            </View>
          ) : (
            <View className={`px-4 ${isAndroid ? "space-y-2" : "space-y-3"}`}>
              {filteredGroups?.map((group, idx) => (
                <Animated.View
                  key={group._id || idx}
                  style={{
                    opacity: fadeAnim,
                    transform: [
                      {
                        translateY: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        }),
                      },
                    ],
                  }}
                >
                  <GroupCard
                    groupName={group.name}
                    description={group.description}
                    groupMember={group.memberCount}
                    totalContests={group.stats.totalContestCount}
                    activeContests={group.stats.activeContestCount}
                    activityLevel={group.stats.activityLevel}
                    handlePress={() => navigateToGroupDetail(group._id)}
                    isRenderRoleBadge={activeNavigationTab === 0}
                    isAdmin={group.userRole === "admin"}
                  />
                </Animated.View>
              ))}
            </View>
          )}
        </ScrollView>
      </Animated.View>

      <Animated.View
        style={{
          position: "absolute",
          bottom: isAndroid ? 110 : 120,
          right: isAndroid ? 16 : 20,
          transform: [{ scale: fabScale }],
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
      </Animated.View>
    </View>
  );
}
