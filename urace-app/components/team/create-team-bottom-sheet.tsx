import { CreateTeam } from "@/api/contest/contest";
import { inputStyle } from "@/constants/style";
import { useTeamStore } from "@/zustand/teamStore";
import { AntDesign, EvilIcons, Ionicons } from "@expo/vector-icons";
import clsx from "clsx";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Keyboard,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { toast } from "sonner-native";
import AppGradient from "../ui/app-gradient";

export default function CreateTeamBottomSheet({
  visible,
  onClose,
  contestId,
}: {
  visible: boolean;
  onClose: () => void;
  contestId?: string;
}) {
  const isAndroid = Platform.OS === "android";

  const height = Dimensions.get("window").height;
  const SHEET_HEIGHT = isAndroid ? height * 0.55 : height * 0.5;
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const isClosingByDrag = useRef(false);
  const DRAG_THRESHOLD = SHEET_HEIGHT * 0.25;

  const [inputTeamName, setInputTeamName] = useState<string>("");
  const [inputTeamNameError, setInputTeamNameError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const { refetchTeams, setRefetchTeams } = useTeamStore();

  // Function to close bottom sheet smoothly via drag
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

  useEffect(() => {
    if (!visible) {
      if (!isClosingByDrag.current) {
        dragY.setValue(0);
      }
    }
  }, [visible, dragY]);

  useEffect(() => {
    if (visible) {
      // Reset form when opening
      setInputTeamName("");
      setInputTeamNameError("");

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
  }, [visible, SHEET_HEIGHT, slideAnim]);

  useEffect(() => {
    const keyboardShowEvent = isAndroid
      ? "keyboardDidShow"
      : "keyboardWillShow";
    const keyboardHideEvent = isAndroid
      ? "keyboardDidHide"
      : "keyboardWillHide";

    const keyboardShow = Keyboard.addListener(keyboardShowEvent, (e) => {
      const keyboardHeight = e.endCoordinates.height;
      const offset = isAndroid ? keyboardHeight * 0.4 : keyboardHeight * 0.35;
      Animated.timing(slideAnim, {
        toValue: -offset,
        duration: isAndroid ? 100 : 250,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }).start();
    });

    const keyboardHide = Keyboard.addListener(keyboardHideEvent, () => {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: isAndroid ? 100 : 250,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }).start();
    });

    return () => {
      keyboardShow.remove();
      keyboardHide.remove();
    };
  }, [isAndroid, slideAnim]);

  const handleSubmit = () => {
    if (!inputTeamName.trim()) {
      setInputTeamNameError("Team name cannot be empty");
      return;
    }
    setIsLoading(true);
    const payload = {
      name: inputTeamName.trim(),
    };
    CreateTeam(contestId ?? "", payload)
      .then((res) => {
        if (res.data) {
          toast.success("Create team successfully");
          setRefetchTeams(refetchTeams + 1);
          onClose();
        }
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || "Failed to create team");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // Combine slideAnim and dragY for the final transform
  const translateY = Animated.add(slideAnim, dragY);

  return (
    <Animated.View
      className="bg-white w-[100vw] relative rounded-t-[24px]"
      style={{
        transform: [{ translateY }],
        height: SHEET_HEIGHT,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 20,
      }}
    >
      {/* Draggable Handle Area */}
      <Animated.View
        {...panResponder.panHandlers}
        className="items-center pt-3 pb-3"
        style={{
          width: "100%",
          minHeight: 30,
        }}
      >
        <View
          className="w-12 h-1.5 rounded-full"
          style={{ backgroundColor: "#D0D0D0" }}
        />
        <Text className="text-xs text-gray-400 mt-1" allowFontScaling={false}>
          Swipe down to close
        </Text>
      </Animated.View>

      {/* Header */}
      <View className="flex-row items-center justify-center px-4 pb-4 border-b border-gray-100">
        <Text
          className="text-lg font-bold text-gray-900"
          allowFontScaling={false}
        >
          Create New Team
        </Text>
        <Pressable
          className="absolute right-4 top-0"
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View
            className="rounded-full p-1"
            style={{ backgroundColor: "#F5F5F5" }}
          >
            <EvilIcons
              name="close"
              size={isAndroid ? 22 : 26}
              color="#666666"
            />
          </View>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 24,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Team Name Input */}
        <View className="mb-5">
          <View className="flex-row items-center mb-2">
            <Ionicons
              name="people-outline"
              size={18}
              color="#4F6AEE"
              style={{ marginRight: 6 }}
            />
            <Text
              className="text-sm font-semibold text-gray-800"
              allowFontScaling={false}
            >
              Team Name
            </Text>
            <Text className="text-red-500 ml-1">*</Text>
          </View>
          <TextInput
            className={clsx(
              "w-full px-4 py-3.5 rounded-2xl text-sm text-gray-900",
              inputTeamNameError
                ? "border-2 border-red-400"
                : "border border-gray-200"
            )}
            placeholder="Enter your team name"
            placeholderTextColor="#A0A0A0"
            style={{
              ...inputStyle,
              fontSize: isAndroid ? 14 : 15,
              backgroundColor: "#F8FAFC",
            }}
            value={inputTeamName}
            onChangeText={(text) => {
              setInputTeamName(text);
              if (inputTeamNameError) setInputTeamNameError("");
            }}
            onFocus={() => setInputTeamNameError("")}
            allowFontScaling={false}
            maxLength={50}
          />
          {inputTeamNameError ? (
            <View className="flex-row items-center mt-2">
              <Ionicons name="alert-circle" size={14} color="#EF4444" />
              <Text
                className="text-red-500 text-xs ml-1"
                allowFontScaling={false}
              >
                {inputTeamNameError}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Submit Button */}
        <View className="mt-4">
          <AppGradient>
            <TouchableOpacity
              className="flex-row items-center justify-center py-1"
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <Text
                  className="text-sm font-bold text-white"
                  allowFontScaling={false}
                >
                  Creating...
                </Text>
              ) : (
                <>
                  <AntDesign
                    name="plus"
                    color="#FFF"
                    size={isAndroid ? 16 : 18}
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    className="text-sm font-bold text-white"
                    allowFontScaling={false}
                  >
                    Create Team
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </AppGradient>
        </View>
      </ScrollView>
    </Animated.View>
  );
}
