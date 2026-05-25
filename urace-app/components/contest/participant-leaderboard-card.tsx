import { useContestStore } from "@/zustand/contestStore";
import { Feather, FontAwesome6, Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ParticipantLeaderboardCard({
  rank,
  name,
  username,
  totalDistance,
  averagePace,
  fastestPace,
  isTeamLeaderboard = false,
  teamName,
  stravaId,
  userId,
  onViewActivities,
}: {
  rank: number;
  name: string;
  username?: string;
  totalDistance: number;
  averagePace: number;
  fastestPace: number;
  isTeamLeaderboard?: boolean;
  teamName?: string;
  stravaId?: number;
  userId?: string;
  onViewActivities?: () => void;
}) {
  const isAndroid = Platform.OS === "android";
  const [isExpanded, setIsExpanded] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const animatedHeight = useRef(new Animated.Value(0)).current;

  const { selectedContest } = useContestStore();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animatedHeight, {
        toValue: isExpanded ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      }),
      Animated.timing(rotateAnim, {
        toValue: isExpanded ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      }),
    ]).start();
  }, [isExpanded]);

  const toggleAccordion = () => {
    setIsExpanded(!isExpanded);
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const rankConfig = useMemo(() => {
    switch (rank) {
      case 1:
        return {
          icon: (
            <FontAwesome6
              name="trophy"
              size={isAndroid ? 18 : 20}
              color="#FFBE0D"
            />
          ),
          bgColor: "#FFFBEB",
          borderColor: "#FCD34D",
          badgeColor: "#F59E0B",
        };
      case 2:
        return {
          icon: (
            <FontAwesome6
              name="trophy"
              size={isAndroid ? 18 : 20}
              color="#9CA3AF"
            />
          ),
          bgColor: "#F9FAFB",
          borderColor: "#D1D5DB",
          badgeColor: "#6B7280",
        };
      case 3:
        return {
          icon: (
            <FontAwesome6
              name="trophy"
              size={isAndroid ? 18 : 20}
              color="#CD7F32"
            />
          ),
          bgColor: "#FEF3E2",
          borderColor: "#F5D0A9",
          badgeColor: "#D97706",
        };
      default:
        return {
          icon: null,
          bgColor: "#FFFFFF",
          borderColor: "#F3F4F6",
          badgeColor: "#9CA3AF",
        };
    }
  }, [rank, isAndroid]);

  const isCompleted = useMemo(() => {
    return totalDistance >= (selectedContest?.minDistance || 0);
  }, [totalDistance, selectedContest]);

  const remainingDistance = useMemo(() => {
    const minDist = selectedContest?.minDistance || 0;
    return Math.max(0, minDist - totalDistance);
  }, [totalDistance, selectedContest]);

  return (
    <View
      style={{
        backgroundColor: rankConfig.bgColor,
        borderRadius: isAndroid ? 14 : 16,
        borderWidth: rank <= 3 ? 2 : 1,
        borderColor: rankConfig.borderColor,
        overflow: "hidden",
      }}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={toggleAccordion}
        style={{
          padding: isAndroid ? 12 : 14,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: isAndroid ? 36 : 40,
            height: isAndroid ? 36 : 40,
            borderRadius: isAndroid ? 10 : 12,
            backgroundColor:
              rank <= 3 ? `${rankConfig.badgeColor}15` : "#F3F4F6",
            alignItems: "center",
            justifyContent: "center",
            marginRight: isAndroid ? 10 : 12,
          }}
        >
          {rankConfig.icon ? (
            rankConfig.icon
          ) : (
            <Text
              style={{
                fontSize: isAndroid ? 14 : 16,
                fontWeight: "700",
                color: "#374151",
              }}
              allowFontScaling={false}
            >
              {rank}
            </Text>
          )}
        </View>
        <View
          style={{
            width: isAndroid ? 44 : 48,
            height: isAndroid ? 44 : 48,
            borderRadius: isAndroid ? 22 : 24,
            backgroundColor: "#F3F4F6",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            marginRight: isAndroid ? 10 : 12,
          }}
        >
          <Image
            source={require("../../assets/images/DefaultAvatar.png")}
            style={{
              width: isAndroid ? 44 : 48,
              height: isAndroid ? 44 : 48,
            }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: isAndroid ? 14 : 15,
              fontWeight: "600",
              color: "#1F2937",
            }}
            numberOfLines={1}
            allowFontScaling={false}
          >
            {name}
          </Text>
          <Text
            style={{
              fontSize: isAndroid ? 11 : 12,
              color: "#9CA3AF",
              fontWeight: "500",
              marginTop: 2,
            }}
            numberOfLines={1}
            allowFontScaling={false}
          >
            @{isTeamLeaderboard ? stravaId : username}
          </Text>
          {!isTeamLeaderboard && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 6,
                gap: 4,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: isCompleted ? "#DCFCE7" : "#FEE2E2",
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                  gap: 4,
                }}
              >
                <Feather
                  name={isCompleted ? "check-circle" : "clock"}
                  size={10}
                  color={isCompleted ? "#16A34A" : "#DC2626"}
                />
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "600",
                    color: isCompleted ? "#16A34A" : "#DC2626",
                  }}
                  allowFontScaling={false}
                >
                  {isCompleted
                    ? "Completed"
                    : `${remainingDistance.toFixed(1)}km left`}
                </Text>
              </View>
            </View>
          )}

          {isTeamLeaderboard && teamName && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 6,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#EEF2FF",
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                  gap: 4,
                }}
              >
                <Feather name="users" size={10} color="#4F6AEE" />
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "600",
                    color: "#4F6AEE",
                  }}
                  allowFontScaling={false}
                >
                  {teamName}
                </Text>
              </View>
            </View>
          )}
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text
            style={{
              fontSize: isAndroid ? 16 : 18,
              fontWeight: "700",
              color: "#1F2937",
            }}
            allowFontScaling={false}
          >
            {totalDistance.toFixed(1)}
          </Text>
          <Text
            style={{
              fontSize: isAndroid ? 10 : 11,
              color: "#9CA3AF",
              fontWeight: "500",
            }}
            allowFontScaling={false}
          >
            km
          </Text>
        </View>

        <Animated.View
          style={{
            transform: [{ rotate: rotateInterpolate }],
            marginLeft: isAndroid ? 8 : 10,
          }}
        >
          <Feather
            name="chevron-down"
            size={isAndroid ? 18 : 20}
            color="#9CA3AF"
          />
        </Animated.View>
      </TouchableOpacity>
      <Animated.View
        style={{
          maxHeight: animatedHeight.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 200],
          }),
          opacity: animatedHeight,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: rank <= 3 ? rankConfig.borderColor : "#F3F4F6",
            paddingHorizontal: isAndroid ? 12 : 14,
            paddingVertical: isAndroid ? 12 : 14,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-around",
            }}
          >
            <View style={{ alignItems: "center" }}>
              <View
                style={{
                  width: isAndroid ? 40 : 44,
                  height: isAndroid ? 40 : 44,
                  borderRadius: isAndroid ? 12 : 14,
                  backgroundColor: "#F3F4F6",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 6,
                }}
              >
                <Ionicons
                  name="speedometer-outline"
                  size={isAndroid ? 18 : 20}
                  color="#6B7280"
                />
              </View>
              <Text
                style={{
                  fontSize: isAndroid ? 14 : 15,
                  fontWeight: "700",
                  color: "#1F2937",
                }}
                allowFontScaling={false}
              >
                {averagePace.toFixed(2)}
              </Text>
              <Text
                style={{
                  fontSize: isAndroid ? 10 : 11,
                  color: "#9CA3AF",
                  marginTop: 2,
                }}
                allowFontScaling={false}
              >
                Avg. Pace
              </Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <View
                style={{
                  width: isAndroid ? 40 : 44,
                  height: isAndroid ? 40 : 44,
                  borderRadius: isAndroid ? 12 : 14,
                  backgroundColor: "#F3F4F6",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 6,
                }}
              >
                <Feather
                  name="zap"
                  size={isAndroid ? 18 : 20}
                  color="#6B7280"
                />
              </View>
              <Text
                style={{
                  fontSize: isAndroid ? 14 : 15,
                  fontWeight: "700",
                  color: "#1F2937",
                }}
                allowFontScaling={false}
              >
                {fastestPace.toFixed(2)}
              </Text>
              <Text
                style={{
                  fontSize: isAndroid ? 10 : 11,
                  color: "#9CA3AF",
                  marginTop: 2,
                }}
                allowFontScaling={false}
              >
                Best Pace
              </Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <View
                style={{
                  width: isAndroid ? 40 : 44,
                  height: isAndroid ? 40 : 44,
                  borderRadius: isAndroid ? 12 : 14,
                  backgroundColor: "#F3F4F6",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 6,
                }}
              >
                <Feather
                  name="map-pin"
                  size={isAndroid ? 18 : 20}
                  color="#6B7280"
                />
              </View>
              <Text
                style={{
                  fontSize: isAndroid ? 14 : 15,
                  fontWeight: "700",
                  color: "#1F2937",
                }}
                allowFontScaling={false}
              >
                {totalDistance.toFixed(1)}
              </Text>
              <Text
                style={{
                  fontSize: isAndroid ? 10 : 11,
                  color: "#9CA3AF",
                  marginTop: 2,
                }}
                allowFontScaling={false}
              >
                Total km
              </Text>
            </View>
          </View>

          {onViewActivities && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onViewActivities}
              style={{
                marginTop: isAndroid ? 14 : 16,
                backgroundColor: "#4F6AEE15",
                borderRadius: isAndroid ? 10 : 12,
                paddingVertical: isAndroid ? 10 : 12,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Feather name="list" size={isAndroid ? 14 : 16} color="#4F6AEE" />
              <Text
                style={{
                  fontSize: isAndroid ? 13 : 14,
                  fontWeight: "600",
                  color: "#4F6AEE",
                }}
                allowFontScaling={false}
              >
                View Activities
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </View>
  );
}
