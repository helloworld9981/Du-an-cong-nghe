import {
  CancelRequestToJoin,
  DeleteGroup,
  LeaveGroup,
  GetContestsInGroup,
  GetGroup,
  GetGroupMembers,
  GetUserJoinStatus,
  GetUserRoleInGroup,
  RequestToJoinGroup,
} from "@/api/group/group";
import GroupDetailContests from "@/components/group-detail/group-detail-contest";
import GroupDetailMember from "@/components/group-detail/group-detail-member";
import ActionConfirmationModal from "@/components/groups/action-confirmation-modal";
import GroupOverviewCard from "@/components/groups/group-overview-card";
import NoData from "@/components/ui/no-data";
import { groupDetailNavigationOptions } from "@/constants/navigation";
import useDebounce from "@/hooks/useDebounce";
import { IContest } from "@/types/contest";
import { IGroupDetail } from "@/types/group";
import { IMember } from "@/types/member";
import { useAuthStore } from "@/zustand/authStore";
import { useBottomSheetStore } from "@/zustand/bottomSheetStore";
import { useContestStore } from "@/zustand/contestStore";
import { useGroupStore } from "@/zustand/groupStore";
import { useMemberStore } from "@/zustand/memberStore";
import {
  Feather,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Platform,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/hooks/useTheme";

export default function Index() {
  const isAndroid = Platform.OS === "android";
  const { t } = useTranslation();
  const colors = useTheme();
  const backgroundColor = colors.background;
  const cardBackgroundColor = (colors as any).card ?? "#FFFFFF";
  const mutedBackgroundColor = (colors as any).muted ?? "#F3F4F6";
  const statusBarStyle =
    colors.background === "#000000" ? "light-content" : "dark-content";

  const [group, setGroup] = useState<IGroupDetail>();
  const { groupId } = useLocalSearchParams();
  const targetGroupId = Array.isArray(groupId) ? groupId[0] : groupId;
  const { user } = useAuthStore();
  const { setGroupId, setSelectedGroup, refetchGroupDetail, setIsGroupAdmin } =
    useGroupStore();
  const [hasRequestToJoin, setHasRequestToJoin] = useState<number>(0);
  const [joinStatusRefetch, setJoinStatusRefetch] = useState<number>(0);

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showLeaveModal, setShowLeaveModal] = useState<boolean>(false);
  const [showJoinModal, setShowJoinModal] = useState<boolean>(false);
  const [showCancelRequestModal, setShowCancelRequestModal] =
    useState<boolean>(false);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [userGroupRole, setUserGroupRole] = useState<string | null>(null);
  const [isCheckingRole, setIsCheckingRole] = useState<boolean>(true);

  // refetch contest in group when refresh the scroll view
  const [refreshContest, setRefreshContest] = useState<boolean>(false);

  // contest tab
  const [currentContestTab, setCurrentContestTab] = useState<number>(0);
  const [contests, setContests] = useState<IContest[]>([]);
  const { refetchContests } = useContestStore();
  const [isLoadingContest, setIsLoadingContest] = useState(false);
  const fetchContestsInGroup = () => {
    setIsLoadingContest(true);
    GetContestsInGroup(targetGroupId)
      .then((res) => {
        setContests(res.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoadingContest(false));
  };

  useEffect(() => {
    fetchContestsInGroup();
  }, [refetchContests]);

  // member tab
  const [groupMembers, setGroupMembers] = useState<IMember[]>([]);
  const [searchName, setSearchName] = useState<string>("");
  const debouncedSearch = useDebounce(searchName, 500);
  const { refetchMembers, setRefetchMembers } = useMemberStore();
  const [isLoadingMember, setIsLoadingMember] = useState(false);

  const { openSheet } = useBottomSheetStore();

  const handleFetchMembers = (search: string) => {
    setIsLoadingMember(true);
    GetGroupMembers(targetGroupId, search)
      .then((res) => {
        setGroupMembers(res.data.members);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoadingMember(false));
  };
  useEffect(() => {
    handleFetchMembers(debouncedSearch);
  }, [refetchMembers, debouncedSearch]);

  const isMember = useMemo(() => {
    return userGroupRole === "member";
  }, [userGroupRole]);

  const isAdmin = useMemo(() => {
    console.log("userGroupRole:", userGroupRole);
    const result = userGroupRole === "admin" || userGroupRole === "owner";
    console.log("isAdmin:", result);
    return result;
  }, [userGroupRole]);

  // Sync isAdmin to global store for child components to use
  useEffect(() => {
    setIsGroupAdmin(isAdmin);
  }, [isAdmin, setIsGroupAdmin]);

  // navigation
  const [activeNavigationTab, setActiveNavigationTab] = useState<number>(0);
  const navigationQuantities = useMemo(() => {
    if (
      contests &&
      groupMembers &&
      (!group?.isPrivate || isAdmin || isMember)
    ) {
      return [contests.length, groupMembers.length];
    }
    return undefined;
  }, [contests, groupMembers, isAdmin, isMember, group]);

  const actionBtnIcon = useMemo(() => {
    if (isAdmin) {
      return <FontAwesome5 name="edit" size={16} color="#ffffff" />;
    } else {
      if (hasRequestToJoin === 1) {
        return (
          <MaterialCommunityIcons name="cancel" size={16} color={"#ffffff"} />
        );
      } else {
        if (isMember) return null;
      }
    }
    return <Ionicons name="enter-outline" size={16} color="#ffffff" />;
  }, [isAdmin, hasRequestToJoin, isMember]);
  const actionBtnText = useMemo(() => {
    return isAdmin
      ? t("group_detail.edit_group")
      : hasRequestToJoin === 1
        ? t("group_detail.cancel_request")
        : !isMember
          ? t("group_detail.join_group")
          : undefined;
  }, [isAdmin, hasRequestToJoin, isMember, t]);

  const getNavigationLabel = (value: number, fallback: string) => {
    if (value === 0) return t("group_detail.tabs.contests");
    if (value === 1) return t("group_detail.tabs.members");
    return fallback;
  };
  const onSubmitActionBtn = () => {
    if (!isAdmin) {
      if (hasRequestToJoin === 0) {
        setShowJoinModal(true);
      } else {
        setShowCancelRequestModal(true);
      }
    } else {
      openSheet("createGroup", {
        isEditing: true,
        group,
      });
    }
  };

  const handleDeleteGroup = () => {
    setIsActionLoading(true);
    DeleteGroup(targetGroupId)
      .then((res) => {
        setShowDeleteModal(false);
        toast.success(t("group_detail.toast.delete_success"));
        router.replace("/group");
      })
      .catch((err) => {
        toast.error(err.data?.message || t("group_detail.toast.delete_failed"));
      })
      .finally(() => {
        setIsActionLoading(false);
      });
  };

  const handleLeaveGroup = () => {
  setIsActionLoading(true);

  LeaveGroup(targetGroupId)
    .then(() => {
      setShowLeaveModal(false);
      toast.success(t("group_detail.toast.leave_success"));

      // quay về danh sách group
      router.replace("/group");
    })
    .catch((err) => {
      toast.error(err?.data?.message || t("group_detail.toast.leave_failed"));
    })
    .finally(() => {
      setIsActionLoading(false);
    });
};

  const handleRequestToJoin = () => {
    setIsActionLoading(true);
    const payload = {
      userId: user?.id,
    };
    RequestToJoinGroup(targetGroupId, payload)
      .then((res) => {
        if (res.data) {
          setShowJoinModal(false);
          toast.success(t("group_detail.toast.request_success"));
          setJoinStatusRefetch(joinStatusRefetch + 1);
        }
      })
      .catch((err) => {
        if (err.status === 400) {
          toast.error(err.data.message);
        } else {
          toast.error(t("group_detail.toast.request_failed"));
        }
      })
      .finally(() => {
        setIsActionLoading(false);
      });
  };

  const handleCancelRequest = () => {
    setIsActionLoading(true);
    const payload = {
      userId: user?.id,
    };
    CancelRequestToJoin(targetGroupId, payload)
      .then((res) => {
        if (res.data) {
          setShowCancelRequestModal(false);
          toast.success(t("group_detail.toast.cancel_request_success"));
          setJoinStatusRefetch(joinStatusRefetch + 1);
          setRefetchMembers(refetchMembers + 1);
        }
      })
      .catch((err) => {
        if (err.status === 400) {
          toast.error(err.data.message);
        } else {
          toast.error(t("group_detail.toast.cancel_request_failed"));
        }
      })
      .finally(() => {
        setIsActionLoading(false);
      });
  };

  const fetchGroup = () => {
    GetGroup(targetGroupId)
      .then((res) => {
        setGroup(res.data);
        setSelectedGroup(res.data);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchGroup();
    setGroupId(targetGroupId);
  }, [refetchGroupDetail, targetGroupId, setGroupId]);

  useEffect(() => {
    setIsCheckingRole(true);
    Promise.all([
      GetUserJoinStatus(targetGroupId).then((res) => {
        if (res.data) {
          setHasRequestToJoin(res.data.hasJoinRequest);
        }
      }),
      GetUserRoleInGroup(targetGroupId)
        .then((res) => {
          if (res.data) {
            setUserGroupRole(res.data.role);
          }
        })
        .catch((err) => console.error(err)),
    ]).finally(() => {
      setIsCheckingRole(false);
    });
  }, [joinStatusRefetch]);

  const { width } = useWindowDimensions();
  const horizontalPadding = isAndroid ? 12 : 16;

  return (
    <View style={{ flex: 1, backgroundColor }}>
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={backgroundColor}
        translucent={false}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor }} edges={["top"]}>
        {/* Header Section */}
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
              backgroundColor: cardBackgroundColor,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 4,
              elevation: 3,
            }}
            onPress={() => router.push("/(tabs)/group")}
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
            {t("group_detail.title")}
          </Text>
        </View>

        <View style={{ paddingHorizontal: horizontalPadding }}>
          <GroupOverviewCard
            groupName={group?.name}
            groupDescription={group?.description}
            groupCreatedAt={group?.createdAt}
            groupMemberCount={groupMembers.length}
            isPrivate={group?.isPrivate}
            actionBtnIcon={actionBtnIcon}
            actionBtnText={actionBtnText}
            onSubmit={onSubmitActionBtn}
            deleteBtnIcon={
              isAdmin ? (
                <Feather name="trash" size={16} color={"#fff"} />
              ) : undefined
            }
            deleteBtnText={isAdmin ? t("group_detail.delete_group") : undefined}
            onDelete={() => setShowDeleteModal(true)}
            isMember={isMember}
            leaveBtnIcon={
              isMember && !isAdmin ? (
                  <Feather name="log-out" size={16} color="#EF4444" />
              ): undefined
            }
            leaveBtnText={isMember && !isAdmin ? t("group_detail.leave_group") : undefined}
            onLeave={() => setShowLeaveModal(true)}
          />
        </View>

        {/* Confirmation Modals */}
        <ActionConfirmationModal
          visible={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteGroup}
          title={t("group_detail.modal.delete_title")}
          message={t("group_detail.modal.delete_message", { groupName: group?.name })}
          confirmText={t("group_detail.modal.delete_confirm")}
          cancelText={t("common.cancel")}
          actionType="delete"
          isLoading={isActionLoading}
        />
        <ActionConfirmationModal
          visible={showLeaveModal}
          onClose={() => setShowLeaveModal(false)}
          onConfirm={handleLeaveGroup}
          title={t("group_detail.modal.leave_title")}
          message={t("group_detail.modal.leave_message")}
          confirmText={t("group_detail.modal.leave_confirm")}
          cancelText={t("common.cancel")}
          actionType="warning"
          isLoading={isActionLoading}
        />

        <ActionConfirmationModal
          visible={showJoinModal}
          onClose={() => setShowJoinModal(false)}
          onConfirm={handleRequestToJoin}
          title={t("group_detail.modal.join_title")}
          message={t("group_detail.modal.join_message", { groupName: group?.name })}
          confirmText={t("group_detail.modal.join_confirm")}
          cancelText={t("common.cancel")}
          actionType="join"
          isLoading={isActionLoading}
        />

        <ActionConfirmationModal
          visible={showCancelRequestModal}
          onClose={() => setShowCancelRequestModal(false)}
          onConfirm={handleCancelRequest}
          title={t("group_detail.modal.cancel_request_title")}
          message={t("group_detail.modal.cancel_request_message")}
          confirmText={t("group_detail.modal.cancel_request_confirm")}
          cancelText={t("group_detail.modal.go_back")}
          actionType="cancel"
          isLoading={isActionLoading}
        />

        <View
          style={{
            marginHorizontal: horizontalPadding,
            marginTop: isAndroid ? 12 : 16,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              backgroundColor: mutedBackgroundColor,
              borderRadius: isAndroid ? 12 : 16,
              padding: isAndroid ? 4 : 6,
            }}
          >
            {groupDetailNavigationOptions.map((opt, idx) => (
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
                        ? cardBackgroundColor
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
                      fontSize: isAndroid ? 12 : 13,
                    }}
                    allowFontScaling={false}
                  >
                    {getNavigationLabel(opt.value, opt.label)}
                  </Text>
                  {navigationQuantities &&
                    navigationQuantities[idx] !== undefined && (
                      <View
                        style={{
                          marginLeft: 6,
                          borderRadius: 10,
                          paddingHorizontal: isAndroid ? 6 : 8,
                          paddingVertical: 2,
                          backgroundColor:
                            activeNavigationTab === opt.value
                              ? "#4F6AEE"
                              : "#D1D5DB",
                        }}
                      >
                        <Text
                          style={{
                            fontWeight: "700",
                            color:
                              activeNavigationTab === opt.value
                                ? cardBackgroundColor
                                : "#6B7280",
                            fontSize: isAndroid ? 10 : 11,
                          }}
                          allowFontScaling={false}
                        >
                          {navigationQuantities[idx]}
                        </Text>
                      </View>
                    )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ flex: 1, marginTop: isAndroid ? 10 : 12 }}>
          {/* Show loading while checking role for private groups */}
          {group?.isPrivate && isCheckingRole ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#9CA3AF", fontSize: 14 }}>{t("common.loading")}</Text>
            </View>
          ) : activeNavigationTab === 0 ? (
            !group?.isPrivate || userGroupRole !== null ? (
              <View style={{ flex: 1, paddingHorizontal: horizontalPadding }}>
                <GroupDetailContests
                  isAdmin={isAdmin}
                  currentContestTab={currentContestTab}
                  setCurrentContestTab={setCurrentContestTab}
                  groupId={targetGroupId}
                  contests={contests}
                  isLoading={isLoadingContest}
                  refreshContest={refreshContest}
                  setRefreshContest={setRefreshContest}
                  fetchContests={fetchContestsInGroup}
                />
              </View>
            ) : (
              <View
                style={{
                  paddingHorizontal: horizontalPadding,
                  marginTop: 8,
                }}
              >
                <NoData
                  title={t("group_detail.private_group_title")}
                  content={t("group_detail.private_contests_content")}
                  imageSource={require("../../../../assets/images/private-group-no-data.png")}
                />
              </View>
            )
          ) : !group?.isPrivate || userGroupRole !== null ? (
            <View style={{ flex: 1, paddingHorizontal: horizontalPadding }}>
              <GroupDetailMember
                isAdmin={isAdmin}
                groupId={targetGroupId}
                groupMembers={groupMembers}
                searchName={searchName}
                setSearchName={setSearchName}
                isLoading={isLoadingMember}
              />
            </View>
          ) : (
            <View
              style={{
                paddingHorizontal: horizontalPadding,
                marginTop: 8,
              }}
            >
              <NoData
                title={t("group_detail.private_group_title")}
                content={t("group_detail.private_members_content")}
                imageSource={require("../../../../assets/images/private-group-no-data.png")}
              />
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}
