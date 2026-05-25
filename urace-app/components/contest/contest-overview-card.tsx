import { ContestStatus } from "@/enums/contest";
import { Feather, FontAwesome6, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import moment from "moment";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ContestOverviewCard({
  contestName,
  status,
  startDate,
  endDate,
  contestDescription,
  contestParticipant,
  contestType,
  contestActivityType,
  actionBtnIcon,
  actionBtnText,
  onSubmit,
}: {
  contestName?: string;
  status?: ContestStatus;
  startDate?: any;
  endDate?: any;
  contestDescription?: string;
  contestParticipant?: number;
  contestType?: string;
  contestActivityType?: string;
  actionBtnIcon?: any;
  actionBtnText?: string;
  onSubmit?: () => void;
}) {
  const isAndroid = Platform.OS === "android";
  const [isExpanded, setIsExpanded] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const animatedHeight = useRef(new Animated.Value(0)).current;

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

  const getStatusConfig = useMemo(() => {
    if (status === ContestStatus.Active) {
      if (new Date(startDate) > new Date()) {
        return {
          label: "Upcoming",
          bgColor: "#DBEAFE",
          textColor: "#2563EB",
          icon: "clock",
        };
      }
      return {
        label: "Active",
        bgColor: "#DCFCE7",
        textColor: "#16A34A",
        icon: "play-circle",
      };
    }
    return {
      label: "Ended",
      bgColor: "#FEE2E2",
      textColor: "#DC2626",
      icon: "check-circle",
    };
  }, [status, startDate]);

  const getContestTypeConfig = useMemo(() => {
    if (contestType === "Team") {
      return {
        label: "Team",
        bgColor: "#EEF2FF",
        textColor: "#4F46E5",
        icon: "users",
      };
    }
    return {
      label: "Individual",
      bgColor: "#FAE8FF",
      textColor: "#A855F7",
      icon: "user",
    };
  }, [contestType]);

  const activityTypeConfig = useMemo(() => {
    const configs: Record<string, { label: string; icon: string }> = {
      Run: { label: "Running", icon: "running" },
      Cycle: { label: "Cycling", icon: "bicycle" },
      Swim: { label: "Swimming", icon: "swimmer" },
      Ride: { label: "Riding", icon: "running" },
    };
    return (
      configs[contestActivityType || "Run"] || {
        label: "Activity",
        icon: "running",
      }
    );
  }, [contestActivityType]);

  return (
    <View
      style={{
        borderRadius: isAndroid ? 16 : 20,
        backgroundColor: "#FFFFFF",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: isAndroid ? 8 : 0,
        overflow: "hidden",
      }}
    >
      <LinearGradient
        colors={
          contestType === "Team"
            ? ["#4F46E5", "#7C3AED"]
            : ["#9333EA", "#DB2777"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          paddingVertical: isAndroid ? 14 : 16,
          paddingHorizontal: isAndroid ? 14 : 16,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flex: 1, marginRight: 12 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "rgba(255,255,255,0.2)",
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 12,
                alignSelf: "flex-start",
                gap: 4,
                marginBottom: 8,
              }}
            >
              <Feather
                name={getStatusConfig.icon as any}
                size={10}
                color="#FFFFFF"
              />
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 10,
                  fontWeight: "600",
                }}
                allowFontScaling={false}
              >
                {getStatusConfig.label}
              </Text>
            </View>
            <Text
              style={{
                fontSize: isAndroid ? 16 : 18,
                fontWeight: "700",
                color: "#FFFFFF",
              }}
              numberOfLines={2}
              allowFontScaling={false}
            >
              {contestName}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.2)",
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <FontAwesome6 name="user-group" size={14} color="#FFFFFF" />
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 14,
                fontWeight: "700",
                marginTop: 2,
              }}
              allowFontScaling={false}
            >
              {contestParticipant || 0}
            </Text>
            <Text
              style={{
                color: "rgba(255,255,255,0.8)",
                fontSize: 9,
                fontWeight: "500",
              }}
              allowFontScaling={false}
            >
              {(contestParticipant || 0) > 1 ? "Participants" : "Participant"}
            </Text>
          </View>
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginTop: 12,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "rgba(255,255,255,0.25)",
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 8,
              gap: 4,
            }}
          >
            <Feather
              name={getContestTypeConfig.icon as any}
              size={12}
              color="#FFFFFF"
            />
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 11,
                fontWeight: "600",
              }}
              allowFontScaling={false}
            >
              {getContestTypeConfig.label}
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "rgba(255,255,255,0.25)",
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 8,
              gap: 4,
            }}
          >
            <FontAwesome6
              name={activityTypeConfig.icon as any}
              size={12}
              color="#FFFFFF"
            />
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 11,
                fontWeight: "600",
              }}
              allowFontScaling={false}
            >
              {activityTypeConfig.label}
            </Text>
          </View>
        </View>
      </LinearGradient>
      <View
        style={{
          padding: isAndroid ? 14 : 16,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginBottom: isAndroid ? 12 : 14,
          }}
        >
          <View
            style={{
              width: isAndroid ? 32 : 36,
              height: isAndroid ? 32 : 36,
              borderRadius: isAndroid ? 8 : 10,
              backgroundColor: "#F1F5F9",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather
              name="calendar"
              size={isAndroid ? 14 : 16}
              color="#64748B"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 11,
                color: "#94A3B8",
                fontWeight: "500",
              }}
              allowFontScaling={false}
            >
              Duration
            </Text>
            <Text
              style={{
                fontSize: isAndroid ? 12 : 13,
                color: "#374151",
                fontWeight: "600",
              }}
              allowFontScaling={false}
            >
              {moment(startDate).format("MMM DD")} -{" "}
              {moment(endDate).format("MMM DD, YYYY")}
            </Text>
          </View>
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          {actionBtnText && (
            <TouchableOpacity
              onPress={onSubmit}
              activeOpacity={0.85}
              style={{ flex: 1 }}
            >
              <LinearGradient
                colors={["#4F6AEE", "#9B4BE2"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: 12,
                  paddingVertical: isAndroid ? 10 : 12,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                {actionBtnIcon}
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: isAndroid ? 12 : 13,
                    fontWeight: "600",
                  }}
                  allowFontScaling={false}
                >
                  {actionBtnText}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={{
              width: 44,
              height: isAndroid ? 40 : 44,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#F1F5F9",
            }}
            onPress={toggleAccordion}
            activeOpacity={0.7}
          >
            <Animated.View
              style={{
                transform: [{ rotate: rotateInterpolate }],
              }}
            >
              <Ionicons name="chevron-down" size={18} color="#64748B" />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>
      <Animated.View
        style={{
          maxHeight: animatedHeight.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 300],
          }),
          opacity: animatedHeight,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            paddingHorizontal: isAndroid ? 14 : 16,
            paddingBottom: isAndroid ? 14 : 16,
            borderTopWidth: 1,
            borderTopColor: "#F1F5F9",
          }}
        >
          <View style={{ marginTop: isAndroid ? 12 : 14 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                marginBottom: 6,
              }}
            >
              <Feather name="file-text" size={14} color="#4F6AEE" />
              <Text
                style={{
                  fontSize: isAndroid ? 13 : 14,
                  fontWeight: "600",
                  color: "#1F2937",
                }}
                allowFontScaling={false}
              >
                Description
              </Text>
            </View>
            <Text
              style={{
                fontSize: isAndroid ? 12 : 13,
                color: "#6B7280",
                lineHeight: isAndroid ? 18 : 20,
              }}
              allowFontScaling={false}
            >
              {contestDescription && contestDescription.length > 0
                ? contestDescription
                : "This contest has no description."}
            </Text>
          </View>
          <View style={{ marginTop: isAndroid ? 12 : 14 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                marginBottom: 6,
              }}
            >
              <Feather name="clock" size={14} color="#4F6AEE" />
              <Text
                style={{
                  fontSize: isAndroid ? 13 : 14,
                  fontWeight: "600",
                  color: "#1F2937",
                }}
                allowFontScaling={false}
              >
                Schedule
              </Text>
            </View>
            <View style={{ gap: 4 }}>
              <Text
                style={{
                  fontSize: isAndroid ? 12 : 13,
                  color: "#6B7280",
                }}
                allowFontScaling={false}
              >
                Start: {moment(startDate).format("DD/MM/YYYY, HH:mm")}
              </Text>
              <Text
                style={{
                  fontSize: isAndroid ? 12 : 13,
                  color: "#6B7280",
                }}
                allowFontScaling={false}
              >
                End: {moment(endDate).format("DD/MM/YYYY, HH:mm")}
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
