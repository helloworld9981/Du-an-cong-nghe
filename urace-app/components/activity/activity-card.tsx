import { useBottomSheetStore } from "@/zustand/bottomSheetStore";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import moment from "moment";
import React from "react";
import { Platform, Pressable, Text, View } from "react-native";

export default function ActivityCard({
  workoutType,
  name,
  startDate,
  distance,
  movingTime,
  pace,
  stravaActivityId,
  recordType,
  totalElevationGain,
  elevLow,
  elevHigh,
  splitsMetric,
  isInBottomSheet = false,
  // Admin props
  isAdmin = false,
  isRejected = false,
  isFraud = false,
  rejectReason,
  onReject,
  onRestore,
}: {
  workoutType: string;
  name: string;
  startDate: string;
  distance: number;
  movingTime: number;
  pace: number;
  stravaActivityId?: number;
  recordType?: number;
  totalElevationGain?: number;
  elevLow?: number;
  elevHigh?: number;
  splitsMetric?: any[];
  isInBottomSheet?: boolean;
  // Admin props
  isAdmin?: boolean;
  isRejected?: boolean;
  isFraud?: boolean;
  rejectReason?: string;
  onReject?: () => void;
  onRestore?: () => void;
}) {
  const router = useRouter();
  const isAndroid = Platform.OS === "android";

  const { closeSheet } = useBottomSheetStore();

  const getWorkoutConfig = () => {
    if (workoutType === "Run") {
      return {
        icon: "trending-up",
        color: "#10B981",
        bgColor: "#D1FAE5",
        label: "Running",
      };
    }
    return {
      icon: "wind",
      color: "#3B82F6",
      bgColor: "#DBEAFE",
      label: "Cycling",
    };
  };

  const workoutConfig = getWorkoutConfig();

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins} min`;
  };

  return (
    <View
      style={{
        backgroundColor: isRejected
          ? "#FEF2F2"
          : isInBottomSheet
            ? "#F8FAFC"
            : "#FFFFFF",
        borderRadius: isAndroid ? 16 : 18,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isInBottomSheet ? 0 : 0.08,
        shadowRadius: 8,
        elevation: isInBottomSheet ? 0 : isAndroid ? 3 : 0,
        borderWidth: isRejected ? 1 : isInBottomSheet ? 1 : 0,
        borderColor: isRejected ? "#FECACA" : "#E5E7EB",
        opacity: isRejected ? 0.85 : 1,
      }}
    >
      <LinearGradient
        colors={
          isRejected
            ? ["#EF4444", "#DC2626"]
            : [workoutConfig.color, `${workoutConfig.color}CC`]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          height: 4,
          width: "100%",
        }}
      />

      <View style={{ padding: isAndroid ? 14 : 16 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: isAndroid ? 12 : 14,
          }}
        >
          <View
            style={{
              width: isAndroid ? 44 : 48,
              height: isAndroid ? 44 : 48,
              borderRadius: isAndroid ? 12 : 14,
              backgroundColor: workoutConfig.bgColor,
              alignItems: "center",
              justifyContent: "center",
              marginRight: isAndroid ? 12 : 14,
            }}
          >
            <Feather
              name={workoutConfig.icon as any}
              size={isAndroid ? 20 : 22}
              color={workoutConfig.color}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: isAndroid ? 15 : 16,
                fontWeight: "600",
                color: "#1F2937",
              }}
              numberOfLines={1}
              allowFontScaling={false}
            >
              {name}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 4,
                gap: 4,
              }}
            >
              <Feather name="clock" size={12} color="#9CA3AF" />
              <Text
                style={{
                  fontSize: isAndroid ? 11 : 12,
                  color: "#9CA3AF",
                  fontWeight: "500",
                }}
                allowFontScaling={false}
              >
                {moment(new Date(startDate)).format("ddd, DD MMM • HH:mm")}
              </Text>
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: workoutConfig.bgColor,
              paddingHorizontal: isAndroid ? 10 : 12,
              paddingVertical: isAndroid ? 5 : 6,
              borderRadius: isAndroid ? 8 : 10,
              gap: 4,
            }}
          >
            {workoutType === "Run" ? (
              <Ionicons
                name="footsteps"
                size={isAndroid ? 12 : 14}
                color={workoutConfig.color}
              />
            ) : (
              <Ionicons
                name="bicycle"
                size={isAndroid ? 12 : 14}
                color={workoutConfig.color}
              />
            )}
            <Text
              style={{
                fontSize: isAndroid ? 10 : 11,
                fontWeight: "600",
                color: workoutConfig.color,
              }}
              allowFontScaling={false}
            >
              {workoutConfig.label}
            </Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            backgroundColor: "#F8FAFC",
            borderRadius: isAndroid ? 12 : 14,
            padding: isAndroid ? 12 : 14,
          }}
        >
          <View style={{ flex: 1, alignItems: "center" }}>
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
                name="map-pin"
                size={isAndroid ? 14 : 16}
                color="#3B82F6"
              />
            </View>
            <Text
              style={{
                fontSize: isAndroid ? 16 : 18,
                fontWeight: "700",
                color: "#1F2937",
              }}
              allowFontScaling={false}
            >
              {distance.toFixed(2)}
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

          <View
            style={{
              width: 1,
              backgroundColor: "#E5E7EB",
              marginHorizontal: isAndroid ? 12 : 16,
            }}
          />

          <View style={{ flex: 1, alignItems: "center" }}>
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
                name="clock"
                size={isAndroid ? 14 : 16}
                color="#10B981"
              />
            </View>
            <Text
              style={{
                fontSize: isAndroid ? 16 : 18,
                fontWeight: "700",
                color: "#1F2937",
              }}
              allowFontScaling={false}
            >
              {formatTime(movingTime)}
            </Text>
            <Text
              style={{
                fontSize: isAndroid ? 10 : 11,
                color: "#9CA3AF",
                fontWeight: "500",
              }}
              allowFontScaling={false}
            >
              duration
            </Text>
          </View>

          <View
            style={{
              width: 1,
              backgroundColor: "#E5E7EB",
              marginHorizontal: isAndroid ? 12 : 16,
            }}
          />

          <View style={{ flex: 1, alignItems: "center" }}>
            <View
              style={{
                width: isAndroid ? 32 : 36,
                height: isAndroid ? 32 : 36,
                borderRadius: isAndroid ? 8 : 10,
                backgroundColor: "#FEF3C7",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 6,
              }}
            >
              <Feather name="zap" size={isAndroid ? 14 : 16} color="#F59E0B" />
            </View>
            <Text
              style={{
                fontSize: isAndroid ? 16 : 18,
                fontWeight: "700",
                color: "#1F2937",
              }}
              allowFontScaling={false}
            >
              {pace.toFixed(1)}
            </Text>
            <Text
              style={{
                fontSize: isAndroid ? 10 : 11,
                color: "#9CA3AF",
                fontWeight: "500",
              }}
              allowFontScaling={false}
            >
              min/km
            </Text>
          </View>
        </View>

        {/* Rejection Badge */}
        {isRejected && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#FEE2E2",
              paddingHorizontal: isAndroid ? 10 : 12,
              paddingVertical: isAndroid ? 8 : 10,
              borderRadius: isAndroid ? 8 : 10,
              marginTop: isAndroid ? 10 : 12,
              gap: 8,
            }}
          >
            <Feather
              name="x-circle"
              size={isAndroid ? 14 : 16}
              color="#EF4444"
            />
            <View style={{ flex: 1 }}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Text
                  style={{
                    fontSize: isAndroid ? 12 : 13,
                    fontWeight: "600",
                    color: "#B91C1C",
                  }}
                  allowFontScaling={false}
                >
                  Rejected
                </Text>
                {isFraud && (
                  <View
                    style={{
                      backgroundColor: "#DC2626",
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 4,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: isAndroid ? 9 : 10,
                        fontWeight: "700",
                        color: "#FFFFFF",
                      }}
                      allowFontScaling={false}
                    >
                      GIAN LẬN
                    </Text>
                  </View>
                )}
              </View>
              {rejectReason && (
                <Text
                  style={{
                    fontSize: isAndroid ? 10 : 11,
                    color: "#DC2626",
                    marginTop: 2,
                  }}
                  allowFontScaling={false}
                  numberOfLines={2}
                >
                  {rejectReason}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Footer with Strava ID and Admin Actions */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: isAndroid ? 10 : 12,
          }}
        >
          {/* Badge */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            {recordType === 1 ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#EFF6FF",
                  paddingHorizontal: isAndroid ? 8 : 10,
                  paddingVertical: isAndroid ? 4 : 5,
                  borderRadius: 6,
                  gap: 4,
                }}
              >
                <Feather
                  name="smartphone"
                  size={isAndroid ? 10 : 12}
                  color="#2563EB"
                />
                <Text
                  style={{
                    fontSize: isAndroid ? 9 : 10,
                    fontWeight: "600",
                    color: "#2563EB",
                  }}
                  allowFontScaling={false}
                >
                  System
                </Text>
              </View>
            ) : stravaActivityId ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#FFF7ED",
                  paddingHorizontal: isAndroid ? 8 : 10,
                  paddingVertical: isAndroid ? 4 : 5,
                  borderRadius: 6,
                  gap: 4,
                }}
              >
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: "#FC4C02",
                  }}
                />
                <Text
                  style={{
                    fontSize: isAndroid ? 9 : 10,
                    fontWeight: "600",
                    color: "#FC4C02",
                  }}
                  allowFontScaling={false}
                >
                  Strava #{stravaActivityId}
                </Text>
              </View>
            ) : null}

            {/* Ask AI Button */}
            <Pressable
              onPress={() => {
                const activityContext = {
                  name,
                  distance,
                  movingTime,
                  pace,
                  startDate,
                  workoutType,
                  totalElevationGain: totalElevationGain,
                  elevLow: elevLow,
                  elevHigh: elevHigh,
                  splitsMetric: splitsMetric,
                };
                router.push({
                  pathname: "/ask-ai",
                  params: {
                    activityContext: JSON.stringify(activityContext),
                  },
                });
                closeSheet();
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#F3E8FF",
                paddingHorizontal: isAndroid ? 8 : 10,
                paddingVertical: isAndroid ? 4 : 5,
                borderRadius: 6,
                gap: 4,
              }}
            >
              <Ionicons
                name="sparkles"
                size={isAndroid ? 10 : 12}
                color="#7C3AED"
              />
              <Text
                style={{
                  fontSize: isAndroid ? 9 : 10,
                  fontWeight: "600",
                  color: "#7C3AED",
                }}
                allowFontScaling={false}
              >
                Ask AI
              </Text>
            </Pressable>
          </View>

          {/* Admin Action Buttons */}
          {isAdmin && (
            <View style={{ flexDirection: "row", gap: 8 }}>
              {isRejected ? (
                <Pressable
                  onPress={onRestore}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#D1FAE5",
                    paddingHorizontal: isAndroid ? 10 : 12,
                    paddingVertical: isAndroid ? 6 : 8,
                    borderRadius: isAndroid ? 8 : 10,
                    gap: 6,
                  }}
                >
                  <Feather
                    name="rotate-ccw"
                    size={isAndroid ? 12 : 14}
                    color="#10B981"
                  />
                  <Text
                    style={{
                      fontSize: isAndroid ? 11 : 12,
                      fontWeight: "600",
                      color: "#10B981",
                    }}
                    allowFontScaling={false}
                  >
                    Restore
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={onReject}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#FEE2E2",
                    paddingHorizontal: isAndroid ? 10 : 12,
                    paddingVertical: isAndroid ? 6 : 8,
                    borderRadius: isAndroid ? 8 : 10,
                    gap: 6,
                  }}
                >
                  <Feather
                    name="x-circle"
                    size={isAndroid ? 12 : 14}
                    color="#EF4444"
                  />
                  <Text
                    style={{
                      fontSize: isAndroid ? 11 : 12,
                      fontWeight: "600",
                      color: "#EF4444",
                    }}
                    allowFontScaling={false}
                  >
                    Reject
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
