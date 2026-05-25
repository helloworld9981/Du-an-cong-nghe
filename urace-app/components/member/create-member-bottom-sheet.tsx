import { AddMemberToGroup } from "@/api/group/group";
import { SearchUser } from "@/api/user/user";
import { inputStyle } from "@/constants/style";
import useDebounce from "@/hooks/useDebounce";
import { IMember } from "@/types/member";
import { useMemberStore } from "@/zustand/memberStore";
import { AntDesign, EvilIcons, Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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
import NoData from "../ui/no-data";
import MemberCard from "./member-card";

export default function CreateMemberBottomSheet({
  visible,
  onClose,
  groupId,
}: {
  visible: boolean;
  onClose: () => void;
  groupId?: string;
}) {
  const isAndroid = Platform.OS === "android";

  const height = Dimensions.get("window").height;
  const SHEET_HEIGHT = isAndroid ? height * 0.8 : height * 0.75;
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const isClosingByDrag = useRef(false);
  const DRAG_THRESHOLD = SHEET_HEIGHT * 0.25;

  const [searchName, setSearchName] = useState<string>("");
  const debouncedSearch = useDebounce(searchName, 500);

  const [searchMembers, setSearchMembers] = useState<IMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [isSelected, setIsSelected] = useState(false);
  const [selectedName, setSelectedName] = useState<string>("");
  const [selectedEmail, setSelectedEmail] = useState<string>("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  const { refetchMembers, setRefetchMembers } = useMemberStore();

  const handleFetchSearchedMembers = (search: string) => {
    setIsLoading(true);
    SearchUser(search)
      .then((res) => {
        setSearchMembers(res.data || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    handleFetchSearchedMembers(debouncedSearch);
  }, [debouncedSearch]);

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
      // Reset state when opening
      setSearchName("");
      setIsSelected(false);
      setSelectedName("");
      setSelectedEmail("");
      setSelectedUserId("");

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
    const payload = {
      userId: selectedUserId,
    };
    AddMemberToGroup(groupId ?? "", payload)
      .then((res) => {
        if (res.data) {
          toast.success("Add member successfully");
          setRefetchMembers(refetchMembers + 1);
          onClose();
        }
      })
      .catch((err) => {
        if (err.status === 400) {
          toast.error("User is already in this group");
        } else {
          toast.error("There is error occured when adding member");
        }
      });
  };

  const handleClearSelection = () => {
    setIsSelected(false);
    setSearchName("");
    setSelectedName("");
    setSelectedEmail("");
    setSelectedUserId("");
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
          Add Member
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
        {/* Search Input */}
        <View className="mb-5">
          <View className="flex-row items-center mb-2">
            <Ionicons
              name="search-outline"
              size={18}
              color="#4F6AEE"
              style={{ marginRight: 6 }}
            />
            <Text
              className="text-sm font-semibold text-gray-800"
              allowFontScaling={false}
            >
              Search Member
            </Text>
          </View>
          <View className="relative">
            <TextInput
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm text-gray-900 border border-gray-200"
              placeholder="Search by name, username or email..."
              placeholderTextColor="#A0A0A0"
              style={{
                ...inputStyle,
                fontSize: isAndroid ? 14 : 15,
                backgroundColor: "#F8FAFC",
              }}
              value={searchName}
              onChangeText={setSearchName}
              onFocus={() => {
                if (isSelected) {
                  handleClearSelection();
                }
              }}
              allowFontScaling={false}
            />
            <View className="absolute left-4 top-[14px]">
              <Ionicons name="search" size={18} color="#9CA3AF" />
            </View>
          </View>
        </View>

        {/* Loading State */}
        {isLoading && (
          <View className="py-10 items-center justify-center">
            <ActivityIndicator size="large" color="#4F6AEE" />
            <Text
              className="text-gray-500 text-sm mt-3"
              allowFontScaling={false}
            >
              Searching members...
            </Text>
          </View>
        )}

        {/* No Results */}
        {!isLoading && searchMembers.length === 0 && !isSelected && (
          <View className="py-6 items-center">
            <NoData
              imageSource={require("../../assets/images/NoData03.png")}
              title={"No members found"}
              content={"Try a different keyword or check back later."}
            />
          </View>
        )}

        {/* Member List */}
        {!isLoading && searchMembers.length > 0 && !isSelected && (
          <View>
            <View className="flex-row items-center justify-between mb-3">
              <Text
                className="text-sm font-semibold text-gray-700"
                allowFontScaling={false}
              >
                Results
              </Text>
              <View
                className="px-2.5 py-1 rounded-full"
                style={{ backgroundColor: "#4F6AEE15" }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: "#4F6AEE" }}
                  allowFontScaling={false}
                >
                  {searchMembers.length} found
                </Text>
              </View>
            </View>
            <View style={{ maxHeight: SHEET_HEIGHT * 0.45 }}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
              >
                {searchMembers.map((member, idx) => (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.7}
                    onPress={() => {
                      setIsSelected(true);
                      setSelectedEmail(member.email);
                      setSelectedName(member.username);
                      setSelectedUserId(member._id ?? "");
                      setSearchName(member.username);
                    }}
                    style={{ marginBottom: isAndroid ? 10 : 12 }}
                  >
                    <MemberCard
                      name={member.username}
                      email={member.email}
                      isAddingMember={true}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {/* Selected Member */}
        {isSelected && (
          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color="#10B981"
                  style={{ marginRight: 6 }}
                />
                <Text
                  className="text-sm font-semibold text-gray-700"
                  allowFontScaling={false}
                >
                  Selected Member
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleClearSelection}
                className="flex-row items-center"
              >
                <Ionicons
                  name="close-circle"
                  size={16}
                  color="#EF4444"
                  style={{ marginRight: 4 }}
                />
                <Text
                  className="text-xs font-medium"
                  style={{ color: "#EF4444" }}
                  allowFontScaling={false}
                >
                  Remove
                </Text>
              </TouchableOpacity>
            </View>
            <View
              className="rounded-2xl overflow-hidden"
              style={{
                backgroundColor: "#F0FDF4",
                borderWidth: 1,
                borderColor: "#BBF7D0",
              }}
            >
              <MemberCard
                name={selectedName}
                email={selectedEmail}
                isAddingMember={true}
              />
            </View>
          </View>
        )}

        {/* Submit Button */}
        <View className="mt-4">
          <AppGradient>
            <TouchableOpacity
              className="flex-row items-center justify-center py-1"
              onPress={handleSubmit}
              disabled={!isSelected}
              activeOpacity={0.8}
              style={{ opacity: isSelected ? 1 : 0.5 }}
            >
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
                Add Member
              </Text>
            </TouchableOpacity>
          </AppGradient>
        </View>
      </ScrollView>
    </Animated.View>
  );
}
