import { CreateGroup, UpdateGroup } from "@/api/group/group";
import { inputStyle } from "@/constants/style";
import { CreateGroupRequest } from "@/types/group";
import { useAuthStore } from "@/zustand/authStore";
import { useGroupStore } from "@/zustand/groupStore";
import { AntDesign, EvilIcons, Feather, Ionicons } from "@expo/vector-icons";
import clsx from "clsx";
import React, { useEffect, useMemo, useRef, useState } from "react";
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

export default function CreateGroupBottomSheet({
  visible,
  onClose,
  isEditing = false,
  group,
}: {
  visible: boolean;
  onClose: () => void;
  isEditing?: boolean;
  group?: any;
}) {
  const isAndroid = Platform.OS === "android";

  const [inputDescription, setInputDescription] = useState<string>(
    isEditing ? (group?.description ?? "") : ""
  );
  const [descriptionHeight, setDescriptionHeight] = useState<number>(0);
  const minDescHeight = isAndroid ? 80 : 100;
  const maxDescHeight = isAndroid ? 140 : 180;
  const computedDescHeight = useMemo(() => {
    if (!descriptionHeight) return minDescHeight;
    return Math.min(Math.max(descriptionHeight, minDescHeight), maxDescHeight);
  }, [descriptionHeight, minDescHeight, maxDescHeight]);

  const [inputName, setInputName] = useState<string>(
    isEditing ? (group?.name ?? "") : ""
  );
  const [isPrivate, setIsPrivate] = useState<boolean>(
    isEditing ? (group?.isPrivate ?? true) : true
  );

  const groupPrivacyGuide = useMemo(() => {
    return !isPrivate
      ? "Anyone can view this group's details and activities"
      : "Only members can view this group's details and activities";
  }, [isPrivate]);

  const height = Dimensions.get("window").height;
  const SHEET_HEIGHT = isAndroid ? height * 0.75 : height * 0.7;

  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const isClosingByDrag = useRef(false);
  const DRAG_THRESHOLD = SHEET_HEIGHT * 0.25; // Close if dragged 25% of sheet height

  // validation handling
  const [inputNameError, setInputNameError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Function to close bottom sheet smoothly via drag
  const closeByDrag = (velocity: number) => {
    isClosingByDrag.current = true;
    // Faster animation if velocity is high
    const duration = velocity > 1 ? 150 : 200;

    Animated.timing(dragY, {
      toValue: SHEET_HEIGHT,
      duration,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start(() => {
      // Set slideAnim to closed position to prevent re-animation
      slideAnim.setValue(SHEET_HEIGHT);
      dragY.setValue(0);
      onClose();
      // Reset the flag after a short delay to ensure useEffect doesn't re-trigger animation
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

  const { user } = useAuthStore();

  const {
    refetchGroups,
    setRefetchGroups,
    refetchGroupDetail,
    setRefetchGroupDetail,
    setIsEditingGroup,
  } = useGroupStore();

  useEffect(() => {
    if (visible) {
      if (!isEditing) {
        setInputName("");
        setInputDescription("");
        setIsPrivate(true);
        setInputNameError("");
      } else {
        setInputName(group?.name ?? "");
        setInputDescription(group?.description ?? "");
        setIsPrivate(group?.isPrivate ?? true);
      }
    }
  }, [visible, isEditing, group]);

  useEffect(() => {
    if (visible) {
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
    if (!inputName.trim()) {
      setInputNameError("Group name cannot be empty");
      return;
    }
    setIsLoading(true);
    const payload: CreateGroupRequest = {
      name: inputName.trim(),
      description: inputDescription.trim(),
      isPrivate,
      createdBy: user?.id ?? "",
    };
    CreateGroup(payload)
      .then((res) => {
        if (res.status === 201) {
          onClose();
          setRefetchGroups(refetchGroups + 1);
          setTimeout(() => {
            toast.success("Group created successfully");
          }, 200);
        }
      })
      .catch(() => {
        toast.error("Failed to create group. Please try again.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleEditGroup = () => {
    if (!inputName.trim()) {
      setInputNameError("Group name cannot be empty");
      return;
    }
    setIsLoading(true);
    const payload = {
      name: inputName.trim(),
      description: inputDescription.trim(),
      isPrivate: isPrivate,
    };
    UpdateGroup(group._id, payload)
      .then((res) => {
        if (res.data) {
          toast.success("Group updated successfully");
          setRefetchGroupDetail(refetchGroupDetail + 1);
          setIsEditingGroup(false);
        }
      })
      .catch((err) => {
        toast.error(err?.data?.message ?? "Failed to update group");
      })
      .finally(() => {
        setIsLoading(false);
        onClose();
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

      <View className="flex-row items-center justify-center px-4 pb-4 border-b border-gray-100">
        <Text
          className="text-lg font-bold text-gray-900"
          allowFontScaling={false}
        >
          {isEditing ? "Edit Group" : "Create New Group"}
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
              Group Name
            </Text>
            <Text className="text-red-500 ml-1">*</Text>
          </View>
          <TextInput
            className={clsx(
              "w-full px-4 py-3.5 rounded-2xl text-sm text-gray-900",
              inputNameError
                ? "border-2 border-red-400"
                : "border border-gray-200"
            )}
            placeholder="Enter your group name"
            placeholderTextColor="#A0A0A0"
            style={{
              ...inputStyle,
              fontSize: isAndroid ? 14 : 15,
            }}
            value={inputName}
            onChangeText={(text) => {
              setInputName(text);
              if (inputNameError) setInputNameError("");
            }}
            onFocus={() => setInputNameError("")}
            allowFontScaling={false}
            maxLength={50}
          />
          {inputNameError ? (
            <View className="flex-row items-center mt-2">
              <Ionicons name="alert-circle" size={14} color="#EF4444" />
              <Text
                className="text-red-500 text-xs ml-1"
                allowFontScaling={false}
              >
                {inputNameError}
              </Text>
            </View>
          ) : null}
        </View>

        <View className="mb-5">
          <View className="flex-row items-center mb-2">
            <Ionicons
              name="document-text-outline"
              size={18}
              color="#4F6AEE"
              style={{ marginRight: 6 }}
            />
            <Text
              className="text-sm font-semibold text-gray-800"
              allowFontScaling={false}
            >
              Description
            </Text>
            <Text className="text-gray-400 text-xs ml-2">(Optional)</Text>
          </View>
          <TextInput
            className="w-full px-4 rounded-2xl text-sm text-gray-900 border border-gray-200"
            placeholder="Tell members about your group..."
            placeholderTextColor="#A0A0A0"
            style={{
              ...inputStyle,
              textAlignVertical: "top",
              paddingTop: 14,
              paddingBottom: 14,
              height: computedDescHeight,
              fontSize: isAndroid ? 14 : 15,
            }}
            multiline={true}
            value={inputDescription}
            onChangeText={setInputDescription}
            onContentSizeChange={(e) => {
              const h = e.nativeEvent.contentSize.height;
              setDescriptionHeight(h);
            }}
            scrollEnabled={computedDescHeight >= maxDescHeight}
            autoCorrect
            autoCapitalize="sentences"
            allowFontScaling={false}
            maxLength={500}
          />
        </View>

        <View
          className="mb-4 p-4 rounded-2xl"
          style={{ backgroundColor: "#F8F9FF" }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{
                  backgroundColor: isPrivate ? "#EEF0FF" : "#FFF3E0",
                }}
              >
                <Ionicons
                  name={isPrivate ? "lock-closed" : "globe-outline"}
                  size={20}
                  color={isPrivate ? "#4F6AEE" : "#FB8C00"}
                />
              </View>
              <View className="flex-1">
                <Text
                  className="text-sm font-semibold text-gray-800"
                  allowFontScaling={false}
                >
                  {isPrivate ? "Private Group" : "Public Group"}
                </Text>
                <Text
                  className="text-xs text-gray-500 mt-0.5"
                  allowFontScaling={false}
                  numberOfLines={2}
                >
                  {groupPrivacyGuide}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => setIsPrivate(!isPrivate)}
              className="ml-3"
            >
              <View
                className={clsx(
                  "w-14 h-8 rounded-full flex-row items-center px-1",
                  isPrivate ? "justify-end" : "justify-start"
                )}
                style={{
                  backgroundColor: isPrivate ? "#4F6AEE" : "#E0E0E0",
                }}
              >
                <View
                  className="w-6 h-6 rounded-full bg-white"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 2,
                    elevation: 3,
                  }}
                />
              </View>
            </Pressable>
          </View>
        </View>

        {/* Submit Button */}
        <View className="mt-4">
          <AppGradient>
            <TouchableOpacity
              className="flex-row items-center justify-center py-1"
              onPress={isEditing ? handleEditGroup : handleSubmit}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <Text
                  className="text-sm font-bold text-white"
                  allowFontScaling={false}
                >
                  {isEditing ? "Updating..." : "Creating..."}
                </Text>
              ) : (
                <>
                  {isEditing ? (
                    <Feather
                      name="edit-2"
                      size={isAndroid ? 16 : 18}
                      color="#FFF"
                      style={{ marginRight: 8 }}
                    />
                  ) : (
                    <AntDesign
                      name="plus"
                      color="#FFF"
                      size={isAndroid ? 16 : 18}
                      style={{ marginRight: 8 }}
                    />
                  )}
                  <Text
                    className="text-sm font-bold text-white"
                    allowFontScaling={false}
                  >
                    {isEditing ? "Update Group" : "Create Group"}
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
