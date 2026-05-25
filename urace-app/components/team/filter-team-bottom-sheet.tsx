import { useTeamStore } from "@/zustand/teamStore";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Keyboard,
  PanResponder,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function FilterTeamBottomSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const isAndroid = Platform.OS === "android";
  const { width, height } = Dimensions.get("window");
  const SHEET_HEIGHT = isAndroid ? height * 0.45 : height * 0.5;

  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const isClosingByDrag = useRef(false);
  const DRAG_THRESHOLD = SHEET_HEIGHT * 0.25;

  const { allTeams, filteredTeamId, setFilteredTeamId } = useTeamStore();

  const [currentFilteredTeamId, setCurrentFilteredTeamId] =
    useState<string>(filteredTeamId);

  const closeByDrag = (velocity: number) => {
    isClosingByDrag.current = true;
    const duration = velocity > 1 ? 150 : 200;

    Animated.timing(dragY, {
      toValue: SHEET_HEIGHT,
      duration,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start(() => {
      slideAnim.setValue(SHEET_HEIGHT);
      dragY.setValue(0);
      onClose();
      setTimeout(() => {
        isClosingByDrag.current = false;
      }, 50);
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderGrant: () => {
        Keyboard.dismiss();
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          dragY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > DRAG_THRESHOLD || gestureState.vy > 0.5) {
          closeByDrag(gestureState.vy);
        } else {
          Animated.spring(dragY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 15,
            stiffness: 150,
          }).start();
        }
      },
    })
  ).current;

  const translateY = Animated.add(slideAnim, dragY);

  useEffect(() => {
    if (visible) {
      setCurrentFilteredTeamId(filteredTeamId);
      Animated.timing(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        duration: 300,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }).start();
    } else {
      if (!isClosingByDrag.current) {
        Animated.timing(slideAnim, {
          toValue: SHEET_HEIGHT,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }).start();
      }
    }
  }, [visible, SHEET_HEIGHT, filteredTeamId]);

  return (
    <Animated.View
      style={{
        backgroundColor: "#FFFFFF",
        width: width,
        borderTopLeftRadius: isAndroid ? 20 : 24,
        borderTopRightRadius: isAndroid ? 20 : 24,
        transform: [{ translateY }],
        height: SHEET_HEIGHT,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 20,
      }}
    >
      <Animated.View
        {...panResponder.panHandlers}
        style={{
          alignItems: "center",
          paddingTop: isAndroid ? 12 : 14,
          paddingBottom: isAndroid ? 6 : 8,
          width: "100%",
        }}
      >
        <View
          style={{
            width: 48,
            height: 5,
            backgroundColor: "#D0D0D0",
            borderRadius: 3,
          }}
        />
      </Animated.View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: isAndroid ? 16 : 20,
          paddingBottom: isAndroid ? 12 : 16,
          borderBottomWidth: 1,
          borderBottomColor: "#F1F5F9",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View
            style={{
              width: isAndroid ? 36 : 40,
              height: isAndroid ? 36 : 40,
              borderRadius: isAndroid ? 10 : 12,
              backgroundColor: "#4F6AEE15",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="filter" size={isAndroid ? 16 : 18} color="#4F6AEE" />
          </View>
          <View>
            <Text
              style={{
                fontSize: isAndroid ? 16 : 18,
                fontWeight: "700",
                color: "#1F2937",
              }}
              allowFontScaling={false}
            >
              Filter by Team
            </Text>
            <Text
              style={{
                fontSize: isAndroid ? 11 : 12,
                color: "#9CA3AF",
                fontWeight: "500",
              }}
              allowFontScaling={false}
            >
              Select a team to filter rankings
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={onClose}
          style={{
            width: isAndroid ? 36 : 40,
            height: isAndroid ? 36 : 40,
            borderRadius: isAndroid ? 18 : 20,
            backgroundColor: "#F3F4F6",
            alignItems: "center",
            justifyContent: "center",
          }}
          activeOpacity={0.7}
        >
          <Feather name="x" size={isAndroid ? 18 : 20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: isAndroid ? 16 : 20,
          paddingVertical: isAndroid ? 16 : 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            fontSize: isAndroid ? 12 : 13,
            fontWeight: "600",
            color: "#6B7280",
            marginBottom: isAndroid ? 12 : 14,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
          allowFontScaling={false}
        >
          Available Teams
        </Text>

        <View style={{ gap: isAndroid ? 8 : 10 }}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setCurrentFilteredTeamId("")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: !currentFilteredTeamId ? "#EEF2FF" : "#FFFFFF",
              paddingVertical: isAndroid ? 12 : 14,
              paddingHorizontal: isAndroid ? 14 : 16,
              borderRadius: isAndroid ? 12 : 14,
              borderWidth: 1,
              borderColor: !currentFilteredTeamId ? "#4F6AEE" : "#E5E7EB",
            }}
          >
            <View
              style={{
                width: isAndroid ? 36 : 40,
                height: isAndroid ? 36 : 40,
                borderRadius: isAndroid ? 10 : 12,
                backgroundColor: !currentFilteredTeamId
                  ? "#4F6AEE15"
                  : "#F3F4F6",
                alignItems: "center",
                justifyContent: "center",
                marginRight: isAndroid ? 10 : 12,
              }}
            >
              <Feather
                name="layers"
                size={isAndroid ? 16 : 18}
                color={!currentFilteredTeamId ? "#4F6AEE" : "#6B7280"}
              />
            </View>
            <Text
              style={{
                flex: 1,
                fontSize: isAndroid ? 14 : 15,
                fontWeight: "600",
                color: !currentFilteredTeamId ? "#4F6AEE" : "#374151",
              }}
              allowFontScaling={false}
            >
              All Teams
            </Text>
            {!currentFilteredTeamId && (
              <View
                style={{
                  width: isAndroid ? 22 : 24,
                  height: isAndroid ? 22 : 24,
                  borderRadius: isAndroid ? 11 : 12,
                  backgroundColor: "#4F6AEE",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Feather name="check" size={14} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
          {allTeams?.map((team: any, idx: number) => {
            const isSelected = currentFilteredTeamId === team._id;
            return (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.8}
                onPress={() => setCurrentFilteredTeamId(team._id)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: isSelected ? "#EEF2FF" : "#FFFFFF",
                  paddingVertical: isAndroid ? 12 : 14,
                  paddingHorizontal: isAndroid ? 14 : 16,
                  borderRadius: isAndroid ? 12 : 14,
                  borderWidth: 1,
                  borderColor: isSelected ? "#4F6AEE" : "#E5E7EB",
                }}
              >
                <View
                  style={{
                    width: isAndroid ? 36 : 40,
                    height: isAndroid ? 36 : 40,
                    borderRadius: isAndroid ? 10 : 12,
                    backgroundColor: isSelected ? "#4F6AEE15" : "#F3F4F6",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: isAndroid ? 10 : 12,
                  }}
                >
                  <Feather
                    name="users"
                    size={isAndroid ? 16 : 18}
                    color={isSelected ? "#4F6AEE" : "#6B7280"}
                  />
                </View>
                <Text
                  style={{
                    flex: 1,
                    fontSize: isAndroid ? 14 : 15,
                    fontWeight: "600",
                    color: isSelected ? "#4F6AEE" : "#374151",
                  }}
                  numberOfLines={1}
                  allowFontScaling={false}
                >
                  {team.name}
                </Text>
                {isSelected && (
                  <View
                    style={{
                      width: isAndroid ? 22 : 24,
                      height: isAndroid ? 22 : 24,
                      borderRadius: isAndroid ? 11 : 12,
                      backgroundColor: "#4F6AEE",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Feather name="check" size={14} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View
        style={{
          paddingHorizontal: isAndroid ? 16 : 20,
          paddingTop: isAndroid ? 12 : 16,
          paddingBottom: isAndroid ? 20 : 34,
          borderTopWidth: 1,
          borderTopColor: "#F1F5F9",
          backgroundColor: "#FFFFFF",
        }}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            setFilteredTeamId(currentFilteredTeamId);
            onClose();
          }}
        >
          <LinearGradient
            colors={["#4F6AEE", "#9B4BE2"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderRadius: isAndroid ? 12 : 14,
              paddingVertical: isAndroid ? 14 : 16,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 8,
            }}
          >
            <Feather name="check-circle" size={18} color="#FFFFFF" />
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: isAndroid ? 14 : 15,
                fontWeight: "600",
              }}
              allowFontScaling={false}
            >
              Apply Filter
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}
