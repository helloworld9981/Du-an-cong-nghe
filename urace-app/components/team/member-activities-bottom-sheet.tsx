import { GetMemberActivities } from "@/api/team/team";
import { IActivity } from "@/types/activity";
import { EvilIcons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import ActivityCard from "../activity/activity-card";
import NoData from "../ui/no-data";

export default function MemberActivitiesBottomSheet({
  visible,
  onClose,
  teamId,
  memberId,
  memberName,
}: {
  visible: boolean;
  onClose: () => void;
  teamId?: string;
  memberId?: string;
  memberName?: string;
}) {
  const isAndroid = Platform.OS === "android";

  const height = Dimensions.get("window").height;
  const SHEET_HEIGHT = height * 0.85;
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  const [activities, setActivities] = useState<IActivity[]>([]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          duration: 300,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SHEET_HEIGHT,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }),
      ]).start();
    }
  }, [visible, SHEET_HEIGHT]);

  useEffect(() => {
    GetMemberActivities(teamId, memberId ?? "")
      .then((res) => {
        if (res.data) {
          setActivities(res.data);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <Animated.View
      className="bg-white w-[100vw] relative rounded-[20px]"
      style={{ transform: [{ translateY: slideAnim }], height: SHEET_HEIGHT }}
    >
      <View style={{ flex: 1 }}>
        <Text
          className="text-base font-bold text-center mt-4"
          allowFontScaling={false}
        >
          {`${memberName}'s activities`}
        </Text>
        <Pressable className="absolute right-3 top-3" onPress={onClose}>
          <EvilIcons
            name="close"
            size={isAndroid ? 24 : 30}
            color={"#9C9B9B"}
          />
        </Pressable>

        <View className="px-2 mt-4">
          {activities.length === 0 ? (
            <NoData
              title="No activities found"
              content="This member has no activities in this contest"
              isHideShadowOpacity={true}
            />
          ) : (
            <View className="flex flex-col space-y-4">
              {activities.map((activity, idx) => (
                <View key={idx}>
                  <ActivityCard
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
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}
