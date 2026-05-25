import { Entypo, Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import moment from "moment";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Text,
  TouchableOpacity,
  UIManager,
  View,
  useWindowDimensions,
} from "react-native";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function GroupOverviewCard({
  groupName,
  groupDescription,
  groupCreatedAt,
  groupMemberCount,
  isPrivate,
  actionBtnIcon,
  actionBtnText,
  onSubmit,
  deleteBtnIcon,
  deleteBtnText,
  onDelete,
  leaveBtnIcon,
  leaveBtnText,
  onLeave,
  isMember,
}: {
  groupName?: string;
  groupDescription?: string;
  groupCreatedAt?: Date;
  groupMemberCount?: number;
  isPrivate?: boolean;
  actionBtnIcon?: any;
  actionBtnText?: string;
  onSubmit?: () => void;
  deleteBtnIcon?: any;
  deleteBtnText?: string;
  onDelete?: () => void;
  leaveBtnIcon?: any;
  leaveBtnText?: string;
  onLeave?: () => void;
  isMember?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const { width } = useWindowDimensions();
  const isAndroid = Platform.OS === "android";

  // Check if we should show the member status section
  const showMemberStatus = isMember && !actionBtnText && !deleteBtnText;

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
        colors={isPrivate ? ["#9B4BE2", "#7C3AED"] : ["#4F6AEE", "#3B82F6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          paddingVertical: isAndroid ? 12 : 14,
          paddingHorizontal: isAndroid ? 14 : 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flex: 1, marginRight: 12 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginBottom: 4,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "rgba(255,255,255,0.2)",
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 12,
                gap: 4,
              }}
            >
              {isPrivate ? (
                <Entypo name="lock" size={10} color="#FFFFFF" />
              ) : (
                <MaterialIcons name="public" size={10} color="#FFFFFF" />
              )}
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 10,
                  fontWeight: "600",
                }}
                allowFontScaling={false}
              >
                {isPrivate ? "Private" : "Public"}
              </Text>
            </View>
          </View>
          <Text
            style={{
              fontSize: isAndroid ? 16 : 18,
              fontWeight: "700",
              color: "#FFFFFF",
            }}
            numberOfLines={1}
            allowFontScaling={false}
          >
            {groupName}
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: 8 }}>
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.2)",
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 14,
                fontWeight: "700",
              }}
              allowFontScaling={false}
            >
              {groupMemberCount || 0}
            </Text>
            <Text
              style={{
                color: "rgba(255,255,255,0.8)",
                fontSize: 9,
                fontWeight: "500",
              }}
              allowFontScaling={false}
            >
              Members
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View
        style={{
          padding: isAndroid ? 12 : 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        }}
      >
        {/* Member Status Section - shown when user is member with no action buttons */}
        {showMemberStatus && (
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              gap: isAndroid ? 10 : 12,
            }}
          >
            {/* Member Badge */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#10B98115",
                paddingHorizontal: isAndroid ? 10 : 12,
                paddingVertical: isAndroid ? 6 : 8,
                borderRadius: 10,
                gap: 6,
              }}
            >
              <View
                style={{
                  width: isAndroid ? 18 : 20,
                  height: isAndroid ? 18 : 20,
                  borderRadius: isAndroid ? 9 : 10,
                  backgroundColor: "#10B981",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Feather
                  name="check"
                  size={isAndroid ? 10 : 12}
                  color="#FFFFFF"
                />
              </View>
              <Text
                style={{
                  fontSize: isAndroid ? 12 : 13,
                  fontWeight: "600",
                  color: "#10B981",
                }}
                allowFontScaling={false}
              >
                Member
              </Text>
            </View>
            <View
              style={{
                width: 1,
                height: isAndroid ? 24 : 28,
                backgroundColor: "#E2E8F0",
              }}
            />

            {/* Created Date Info */}
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: isAndroid ? 10 : 11,
                  color: "#94A3B8",
                  fontWeight: "500",
                }}
                allowFontScaling={false}
              >
                Group created
              </Text>
              <Text
                style={{
                  fontSize: isAndroid ? 12 : 13,
                  color: "#475569",
                  fontWeight: "600",
                }}
                allowFontScaling={false}
              >
                {moment(groupCreatedAt).format("MMM DD, YYYY")}
              </Text>
            </View>
          </View>
        )}

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

        {/* Delete Button */}
        {deleteBtnText && (
          <TouchableOpacity
            style={{
              width: actionBtnText ? 44 : undefined,
              flex: actionBtnText ? undefined : 1,
              height: isAndroid ? 40 : 44,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#FEF2F2",
              borderWidth: 1,
              borderColor: "#FECACA",
            }}
            onPress={onDelete}
            activeOpacity={0.8}
          >
            <Feather name="trash-2" size={16} color="#EF4444" />
          </TouchableOpacity>
        )}

      {/* Leave Group Button */}
      {leaveBtnText &&(
      <TouchableOpacity
        style={{
          width: 44,
          height: isAndroid ? 40 : 44,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FEF2F2",
          borderWidth: 1,
          borderColor: "#FECACA",
        }}
        onPress={onLeave}
        activeOpacity={0.8}
      >
        <Feather name="log-out" size={16} color="#EF4444" />
      </TouchableOpacity>
    )}

        {/* Expand Button */}
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

      <Animated.View
        style={{
          maxHeight: animatedHeight.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 250],
          }),
          opacity: animatedHeight,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            paddingHorizontal: isAndroid ? 12 : 14,
            paddingBottom: isAndroid ? 12 : 14,
          }}
        >
          <View
            style={{
              height: 1,
              backgroundColor: "#E2E8F0",
              marginBottom: 12,
            }}
          />

          {/* Description */}
          <View
            style={{
              backgroundColor: "#F8FAFC",
              borderRadius: 12,
              padding: 12,
              borderLeftWidth: 3,
              borderLeftColor: isPrivate ? "#9B4BE2" : "#4F6AEE",
              marginBottom: 10,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 6,
                gap: 6,
              }}
            >
              <Feather
                name="file-text"
                size={12}
                color={isPrivate ? "#9B4BE2" : "#4F6AEE"}
              />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: "#64748B",
                }}
                allowFontScaling={false}
              >
                Description
              </Text>
            </View>
            <Text
              style={{
                fontSize: 13,
                color: "#475569",
                lineHeight: 18,
              }}
              allowFontScaling={false}
              numberOfLines={3}
            >
              {groupDescription || "No description available."}
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                backgroundColor: "#10B98115",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name="clock" size={12} color="#10B981" />
            </View>
            <View>
              <Text
                style={{
                  fontSize: 10,
                  color: "#94A3B8",
                  fontWeight: "500",
                }}
                allowFontScaling={false}
              >
                Created
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: "#1E293B",
                  fontWeight: "600",
                }}
                allowFontScaling={false}
              >
                {moment(groupCreatedAt).format("MMM DD, YYYY")}
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
