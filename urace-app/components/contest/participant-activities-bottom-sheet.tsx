import {
  GetIndividualContestActivities,
  GetTeamContestActivities,
  RejectActivity,
  RestoreActivity,
} from "@/api/contest/contest";
import { IActivity } from "@/types/activity";
import { useContestStore } from "@/zustand/contestStore";
import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { toast } from "sonner-native";
import ActivityCard from "../activity/activity-card";
import RejectActivityModal from "../activity/reject-activity-modal";
import RestoreActivityModal from "../activity/restore-activity-modal";

export default function ParticipantActivitiesBottomSheet({
  visible,
  onClose,
  contestId,
  userId,
  participantName,
  teamId,
  isAdmin = false,
}: {
  visible: boolean;
  onClose: () => void;
  contestId?: string;
  userId?: string;
  participantName?: string;
  teamId?: string;
  isAdmin?: boolean;
}) {
  const isAndroid = Platform.OS === "android";
  const horizontalPadding = isAndroid ? 16 : 20;

  const height = Dimensions.get("window").height;
  const SHEET_HEIGHT = height * 0.85;
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  const [isLoading, setIsLoading] = useState(false);
  const [activities, setActivities] = useState<IActivity[]>([]);

  // Reject modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<IActivity | null>(
    null,
  );
  const [isRejecting, setIsRejecting] = useState(false);

  // Restore modal states
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const { setRefetchContestDetail, refetchContestDetail, selectedContest } =
    useContestStore();

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          slideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          onClose();
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 10,
          }).start();
        }
      },
    }),
  ).current;

  useEffect(() => {
    if (visible && contestId) {
      setIsLoading(true);
      console.log("Fetching activities for:", { contestId, userId, teamId });

      const fetchPromise =
        teamId && userId
          ? GetTeamContestActivities(contestId, teamId, userId)
          : userId
            ? GetIndividualContestActivities(contestId, userId)
            : null;

      if (fetchPromise) {
        fetchPromise
          .then((res) => {
            console.log("Activities response:", res.data);
            if (res.data) {
              if (Array.isArray(res.data)) {
                setActivities(res.data);
              } else if (res.data.data && Array.isArray(res.data.data)) {
                setActivities(res.data.data);
              } else if (
                res.data.activities &&
                Array.isArray(res.data.activities)
              ) {
                setActivities(res.data.activities);
              } else {
                setActivities([]);
              }
            }
          })
          .catch((err) => {
            console.error("Error fetching activities:", err);
            setActivities([]);
          })
          .finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    }
  }, [visible, contestId, userId, teamId]);

  // Fetch activities function for refresh
  const fetchActivities = () => {
    if (!contestId) return;

    setIsLoading(true);
    const fetchPromise =
      teamId && userId
        ? GetTeamContestActivities(contestId, teamId, userId)
        : userId
          ? GetIndividualContestActivities(contestId, userId)
          : null;

    if (fetchPromise) {
      fetchPromise
        .then((res) => {
          if (res.data) {
            if (Array.isArray(res.data)) {
              setActivities(res.data);
            } else if (res.data.data && Array.isArray(res.data.data)) {
              setActivities(res.data.data);
            } else if (
              res.data.activities &&
              Array.isArray(res.data.activities)
            ) {
              setActivities(res.data.activities);
            } else {
              setActivities([]);
            }
          }
        })
        .catch((err) => {
          console.error("Error fetching activities:", err);
          setActivities([]);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  };

  // Handle reject activity
  const handleRejectClick = (activity: IActivity) => {
    setSelectedActivity(activity);
    setShowRejectModal(true);
  };

  const handleConfirmReject = async (reason: string, isFraud: boolean) => {
    if (!contestId || !selectedActivity) return;

    setIsRejecting(true);

    console.log("DEBUG - Reject activity info:", {
      _id: selectedActivity._id,
      stravaActivityId: selectedActivity.stravaActivityId,
      fullObject: selectedActivity,
    });
    // Check if there are other ID fields potentially available at runtime
    const anyActivity = selectedActivity as any;
    if (anyActivity.id || anyActivity.activityId) {
      console.log("DEBUG - Alternative IDs found:", {
        id: anyActivity.id,
        activityId: anyActivity.activityId,
      });
    }
    // Backend API typically expects the original Activity ID (workoutActivityId)
    // if the list item is a ContestActivity wrapper.
    // We prioritize workoutActivityId, falling back to _id if not present.
    const targetId = (
      selectedActivity.workoutActivityId || selectedActivity._id
    ).trim();
    console.log("DEBUG - Request Details:", {
      url: `api/contests/${contestId}/activities/${targetId}/reject`,
      idUsed: targetId,
      originalId: selectedActivity._id,
      workoutActivityId: selectedActivity.workoutActivityId,
    });

    try {
      await RejectActivity(contestId, targetId, {
        reason: reason || undefined,
        type:
          selectedContest?.contestType == "Individual" ? "individual" : "team",
      });
      toast.success("Activity rejected successfully");
      setShowRejectModal(false);
      setSelectedActivity(null);
      // Refresh activities list
      fetchActivities();
      // Trigger contest detail refetch to update statistics
      setRefetchContestDetail(refetchContestDetail + 1);
    } catch (error: any) {
      console.error("Error rejecting activity:", error);
      toast.error(
        error?.response?.data?.message ||
          "There was an error rejecting the activity",
      );
    } finally {
      setIsRejecting(false);
    }
  };

  // Handle restore activity click
  const handleRestoreClick = (activity: IActivity) => {
    setSelectedActivity(activity);
    setShowRestoreModal(true);
  };

  const handleConfirmRestore = async () => {
    if (!contestId || !selectedActivity) return;

    setIsRestoring(true);
    const targetId = selectedActivity.workoutActivityId || selectedActivity._id;

    try {
      await RestoreActivity(contestId, targetId, {
        type:
          selectedContest?.contestType == "Individual" ? "individual" : "team",
      });
      toast.success("Activity restored successfully");
      setShowRestoreModal(false);
      setSelectedActivity(null);
      // Refresh activities list
      fetchActivities();
      // Trigger contest detail refetch to update statistics
      setRefetchContestDetail(refetchContestDetail + 1);
    } catch (error: any) {
      console.error("Error restoring activity:", error);
      toast.error(
        error?.response?.data?.message ||
          "There was an error restoring the activity",
      );
    } finally {
      setIsRestoring(false);
    }
  };

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        duration: 300,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SHEET_HEIGHT,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }).start();
    }
  }, [visible]);

  const screenWidth = Dimensions.get("window").width;
  const totalDistance = activities.reduce((sum, a) => sum + a.distance, 0);

  return (
    <Animated.View
      style={{
        backgroundColor: "#FFFFFF",
        width: screenWidth,
        height: SHEET_HEIGHT,
        borderTopLeftRadius: isAndroid ? 24 : 28,
        borderTopRightRadius: isAndroid ? 24 : 28,
        transform: [{ translateY: slideAnim }],
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 20,
      }}
    >
      <View
        {...panResponder.panHandlers}
        style={{
          alignItems: "center",
          paddingTop: isAndroid ? 12 : 14,
          paddingBottom: isAndroid ? 8 : 10,
        }}
      >
        <View
          style={{
            width: 40,
            height: 5,
            backgroundColor: "#E5E7EB",
            borderRadius: 3,
          }}
        />
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: horizontalPadding,
          paddingBottom: isAndroid ? 16 : 20,
          borderBottomWidth: 1,
          borderBottomColor: "#F3F4F6",
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: isAndroid ? 18 : 20,
              fontWeight: "700",
              color: "#1F2937",
            }}
            allowFontScaling={false}
          >
            Activities
          </Text>
          {participantName && (
            <Text
              style={{
                fontSize: isAndroid ? 13 : 14,
                color: "#6B7280",
                marginTop: 4,
              }}
              allowFontScaling={false}
            >
              {participantName}
            </Text>
          )}
        </View>
        <Pressable
          onPress={onClose}
          style={{
            width: isAndroid ? 36 : 40,
            height: isAndroid ? 36 : 40,
            borderRadius: isAndroid ? 10 : 12,
            backgroundColor: "#F3F4F6",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Feather name="x" size={isAndroid ? 18 : 20} color="#6B7280" />
        </Pressable>
      </View>

      {!isLoading && activities.length > 0 && (
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: horizontalPadding,
            paddingVertical: isAndroid ? 12 : 16,
            backgroundColor: "#F9FAFB",
            gap: isAndroid ? 12 : 16,
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "#FFFFFF",
              borderRadius: isAndroid ? 12 : 14,
              padding: isAndroid ? 12 : 14,
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <View
              style={{
                width: isAndroid ? 32 : 36,
                height: isAndroid ? 32 : 36,
                borderRadius: isAndroid ? 8 : 10,
                backgroundColor: "#DBEAFE",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 6,
              }}
            >
              <Feather
                name="activity"
                size={isAndroid ? 14 : 16}
                color="#3B82F6"
              />
            </View>
            <Text
              style={{
                fontSize: isAndroid ? 18 : 20,
                fontWeight: "700",
                color: "#1F2937",
              }}
              allowFontScaling={false}
            >
              {activities.length}
            </Text>
            <Text
              style={{
                fontSize: isAndroid ? 11 : 12,
                color: "#9CA3AF",
              }}
              allowFontScaling={false}
            >
              Activities
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              backgroundColor: "#FFFFFF",
              borderRadius: isAndroid ? 12 : 14,
              padding: isAndroid ? 12 : 14,
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <View
              style={{
                width: isAndroid ? 32 : 36,
                height: isAndroid ? 32 : 36,
                borderRadius: isAndroid ? 8 : 10,
                backgroundColor: "#D1FAE5",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 6,
              }}
            >
              <Feather
                name="map-pin"
                size={isAndroid ? 14 : 16}
                color="#10B981"
              />
            </View>
            <Text
              style={{
                fontSize: isAndroid ? 18 : 20,
                fontWeight: "700",
                color: "#1F2937",
              }}
              allowFontScaling={false}
            >
              {totalDistance.toFixed(1)}
            </Text>
            <Text
              style={{
                fontSize: isAndroid ? 11 : 12,
                color: "#9CA3AF",
              }}
              allowFontScaling={false}
            >
              Total km
            </Text>
          </View>
        </View>
      )}

      <View style={{ flex: 1 }}>
        {isLoading ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
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
              Loading activities...
            </Text>
          </View>
        ) : activities.length === 0 ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: isAndroid ? 32 : 40,
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
                name="activity"
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
              This participant hasn't recorded any activities for this contest
            </Text>
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: horizontalPadding,
              paddingTop: isAndroid ? 12 : 16,
              paddingBottom: isAndroid ? 24 : 32,
              gap: isAndroid ? 10 : 12,
            }}
            showsVerticalScrollIndicator={false}
          >
            {activities.map((activity, idx) => {
              // Determine rejection status safely from multiple potential fields
              const isRejected =
                activity.isRejected ||
                (activity as any).status === "rejected" ||
                !!activity.rejectReason ||
                !!activity.rejectedAt ||
                activity.isFraud;

              return (
                <ActivityCard
                  key={idx}
                  workoutType={activity.workoutType}
                  name={activity.name}
                  startDate={activity.startDate}
                  distance={activity.distance}
                  movingTime={activity.movingTime}
                  pace={activity.pace}
                  stravaActivityId={activity.stravaActivityId}
                  recordType={activity.recordType}
                  totalElevationGain={activity.totalElevationGain}
                  elevLow={activity.elevLow}
                  elevHigh={activity.elevHigh}
                  splitsMetric={activity.splitsMetric}
                  isInBottomSheet={true}
                  isAdmin={isAdmin}
                  isRejected={isRejected}
                  isFraud={activity.isFraud}
                  rejectReason={activity.rejectReason}
                  onReject={() => handleRejectClick(activity)}
                  onRestore={() => handleRestoreClick(activity)}
                />
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Reject Activity Modal */}
      <RejectActivityModal
        visible={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setSelectedActivity(null);
        }}
        onConfirm={handleConfirmReject}
        isLoading={isRejecting}
        activityName={selectedActivity?.name}
      />

      {/* Restore Activity Modal */}
      <RestoreActivityModal
        visible={showRestoreModal}
        onClose={() => {
          setShowRestoreModal(false);
          setSelectedActivity(null);
        }}
        onConfirm={handleConfirmRestore}
        isLoading={isRestoring}
        activityName={selectedActivity?.name}
      />
    </Animated.View>
  );
}
