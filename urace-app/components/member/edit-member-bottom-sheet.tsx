import { UpdateMemberRole } from "@/api/group/group";
import { userRoles } from "@/constants/user";
import { useMemberStore } from "@/zustand/memberStore";
import { EvilIcons, Feather, Ionicons } from "@expo/vector-icons";
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
  TouchableOpacity,
  View,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { toast } from "sonner-native";
import AppGradient from "../ui/app-gradient";

export default function EditMemberBottomSheet({
  visible,
  onClose,
  selectedName,
  selectedEmail,
  selectedRole,
  selectedUserId,
  groupId,
}: {
  visible: boolean;
  onClose: () => void;
  selectedName?: string;
  selectedEmail?: string;
  selectedRole?: string;
  selectedUserId?: string;
  groupId?: string;
}) {
  const isAndroid = Platform.OS === "android";

  const height = Dimensions.get("window").height;
  const SHEET_HEIGHT = isAndroid ? height * 0.65 : height * 0.55;
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const isClosingByDrag = useRef(false);
  const DRAG_THRESHOLD = SHEET_HEIGHT * 0.25;

  const [role, setRole] = useState(selectedRole === "admin" ? 0 : 1);
  const [isLoading, setIsLoading] = useState(false);

  const { refetchMembers, setRefetchMembers } = useMemberStore();

  const editingRole = useMemo(() => {
    return role === 0 ? "admin" : "member";
  }, [role]);

  // Reset role when opening with new member
  useEffect(() => {
    if (visible) {
      setRole(selectedRole === "admin" ? 0 : 1);
    }
  }, [visible, selectedRole]);

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

  const handleSubmit = () => {
    setIsLoading(true);
    const payload = {
      role: editingRole,
    };
    UpdateMemberRole(groupId ?? "", selectedUserId ?? "", payload)
      .then((res) => {
        if (res.data) {
          onClose();
          setRefetchMembers(refetchMembers + 1);
          toast.success("Update member's role successfully");
        }
      })
      .catch((err) => {
        toast.error("There is error occured when updating role");
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
          Update Role
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
        {/* Member Info Card */}
        <View
          className="mb-5 p-4 rounded-2xl"
          style={{ backgroundColor: "#F8F9FF" }}
        >
          <View className="flex-row items-center">
            <View
              className="w-12 h-12 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: "#EEF0FF" }}
            >
              <Ionicons name="person" size={24} color="#4F6AEE" />
            </View>
            <View className="flex-1">
              <Text
                className="text-base font-semibold text-gray-800"
                allowFontScaling={false}
                numberOfLines={1}
              >
                {selectedName}
              </Text>
              <Text
                className="text-sm text-gray-500 mt-0.5"
                allowFontScaling={false}
                numberOfLines={1}
              >
                {selectedEmail}
              </Text>
            </View>
          </View>
        </View>

        {/* Role Selection */}
        <View className="mb-5">
          <View className="flex-row items-center mb-2">
            <Ionicons
              name="shield-checkmark-outline"
              size={18}
              color="#4F6AEE"
              style={{ marginRight: 6 }}
            />
            <Text
              className="text-sm font-semibold text-gray-800"
              allowFontScaling={false}
            >
              Select Role
            </Text>
            <Text className="text-red-500 ml-1">*</Text>
          </View>
          <View
            className="rounded-2xl border border-gray-200"
            style={{
              backgroundColor: "#F8FAFC",
              paddingVertical: isAndroid ? 4 : 6,
              paddingHorizontal: 16,
            }}
          >
            <Dropdown
              data={userRoles}
              maxHeight={200}
              labelField="label"
              valueField="value"
              value={role}
              onChange={(item) => {
                setRole(item.value);
              }}
              placeholderStyle={{
                color: "#9CA3AF",
                fontSize: isAndroid ? 14 : 15,
              }}
              selectedTextStyle={{
                color: "#1F2937",
                fontSize: isAndroid ? 14 : 15,
                fontWeight: "500",
              }}
              containerStyle={{
                borderRadius: 14,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
              itemTextStyle={{
                fontSize: isAndroid ? 14 : 15,
                color: "#374151",
              }}
              activeColor="#F3F4F6"
              placeholder="Select role"
              renderLeftIcon={() => (
                <Ionicons
                  name={role === 0 ? "shield-checkmark" : "person"}
                  size={18}
                  color={role === 0 ? "#F59E0B" : "#6B7280"}
                  style={{ marginRight: 10 }}
                />
              )}
            />
          </View>
          <Text
            className="text-xs text-gray-500 mt-2 ml-1"
            allowFontScaling={false}
          >
            {role === 0
              ? "Admin can manage group settings and members"
              : "Member can participate in group activities"}
          </Text>
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
                  Updating...
                </Text>
              ) : (
                <>
                  <Feather
                    name="edit-2"
                    size={isAndroid ? 16 : 18}
                    color="#FFF"
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    className="text-sm font-bold text-white"
                    allowFontScaling={false}
                  >
                    Update Role
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
