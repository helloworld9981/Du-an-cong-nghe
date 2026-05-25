import { GetTeamsForContest } from "@/api/contest/contest";
import { GetGroupMembers } from "@/api/group/group";
import { AddMultipleMembersToTeam } from "@/api/team/team";
import { inputStyle } from "@/constants/style";
import { IContestTeam } from "@/types/contest";
import { IMember } from "@/types/member";
import { useTeamStore } from "@/zustand/teamStore";
import { AntDesign, EvilIcons, Ionicons } from "@expo/vector-icons";
import clsx from "clsx";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
import MemberCard from "../member/member-card";
import AppGradient from "../ui/app-gradient";
import NoData from "../ui/no-data";

export default function AddMemberToTeamBottomSheet({
  visible,
  onClose,
  groupId,
  contestId,
}: {
  visible: boolean;
  onClose: () => void;
  groupId?: string;
  contestId?: string;
}) {
  const isAndroid = Platform.OS === "android";

  const height = Dimensions.get("window").height;
  const SHEET_HEIGHT = isAndroid ? height * 0.85 : height * 0.9;
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const isClosingByDrag = useRef(false);
  const DRAG_THRESHOLD = SHEET_HEIGHT * 0.25;

  const [searchQuery, setSearchQuery] = useState<string>("");

  const [groupMembers, setGroupMembers] = useState<IMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allTeams, setAllTeams] = useState<IContestTeam[]>([]);

  const [selectedMembers, setSelectedMembers] = useState<IMember[]>([]);

  const { refetchTeams, setRefetchTeams, selectedTeamId } = useTeamStore();

  const availableMembers = useMemo(() => {
    if (groupMembers) {
      const unavailableUserIds = allTeams.flatMap(
        (t) => t.members?.map((member) => member.userId) || []
      );
      return groupMembers.filter(
        (member) => !unavailableUserIds.includes(member._id ?? "")
      );
    }
    return [];
  }, [groupMembers, allTeams]);

  const filteredAvailableMembers = useMemo(() => {
    if (searchQuery) {
      return availableMembers.filter((member) =>
        member.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return availableMembers;
  }, [availableMembers, searchQuery]);

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
      setSearchQuery("");
      setSelectedMembers([]);

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
    setIsLoading(true);
    GetGroupMembers(groupId ?? "")
      .then((res) => {
        if (res.data) {
          setGroupMembers(res.data.members);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [groupId]);

  useEffect(() => {
    setIsLoading(true);
    GetTeamsForContest(contestId ?? "")
      .then((res) => {
        if (res.data) {
          setAllTeams(res.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [contestId]);

  const handleAddMemberToSelectedList = (selectedMember: IMember) => {
    const isAlreadySelected = selectedMembers.some(
      (m) => m._id === selectedMember._id
    );
    if (!isAlreadySelected) {
      setSelectedMembers([...selectedMembers, selectedMember]);
    }
  };

  const handleRemoveMemberFromSelectedList = (selectedMember: IMember) => {
    setSelectedMembers(
      selectedMembers.filter((member) => member._id !== selectedMember._id)
    );
  };

  const handleSubmit = () => {
    if (selectedMembers.length === 0) return;

    setIsSubmitting(true);
    const selectedIds = selectedMembers.map((member) => member._id);
    const payload = {
      userIds: selectedIds,
    };
    AddMultipleMembersToTeam(selectedTeamId, payload)
      .then((res) => {
        if (res.data) {
          setRefetchTeams(refetchTeams + 1);
          toast.success("Members added to team successfully");
          onClose();
        }
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || "Failed to add members");
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  // Combine slideAnim and dragY for the final transform
  const translateY = Animated.add(slideAnim, dragY);

  const isSelected = (member: IMember) =>
    selectedMembers.some((m) => m._id === member._id);

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
          Add Team Members
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

      <View style={{ flex: 1 }}>
        {/* Search Input */}
        <View className="px-5 pt-4 pb-2">
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
              Search Members
            </Text>
          </View>
          <View className="relative">
            <TextInput
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm text-gray-900 border border-gray-200"
              placeholder="Search by name..."
              placeholderTextColor="#A0A0A0"
              style={{
                ...inputStyle,
                fontSize: isAndroid ? 14 : 15,
                backgroundColor: "#F8FAFC",
              }}
              value={searchQuery}
              onChangeText={setSearchQuery}
              allowFontScaling={false}
            />
            <View className="absolute left-4 top-[14px]">
              <Ionicons name="search" size={18} color="#9CA3AF" />
            </View>
          </View>
        </View>

        {/* Selected Members */}
        {selectedMembers.length > 0 && (
          <View className="px-5 py-3 border-b border-gray-100">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color="#10B981"
                  style={{ marginRight: 6 }}
                />
                <Text
                  className="text-sm font-semibold text-gray-700"
                  allowFontScaling={false}
                >
                  Selected ({selectedMembers.length})
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedMembers([])}>
                <Text
                  className="text-xs font-medium"
                  style={{ color: "#EF4444" }}
                  allowFontScaling={false}
                >
                  Clear All
                </Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {selectedMembers.map((member, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleRemoveMemberFromSelectedList(member)}
                  activeOpacity={0.7}
                >
                  <View
                    className="flex-row items-center px-3 py-2 rounded-full"
                    style={{ backgroundColor: "#4F6AEE" }}
                  >
                    <Text
                      className="text-white text-xs font-medium mr-2"
                      allowFontScaling={false}
                    >
                      {member.username}
                    </Text>
                    <Ionicons name="close" size={14} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Loading State */}
        {isLoading ? (
          <View className="py-10 items-center justify-center">
            <ActivityIndicator size="large" color="#4F6AEE" />
            <Text
              className="text-gray-500 text-sm mt-3"
              allowFontScaling={false}
            >
              Loading members...
            </Text>
          </View>
        ) : (
          <>
            {/* No Results */}
            {filteredAvailableMembers.length === 0 && (
              <View className="py-6 px-5 items-center">
                <NoData
                  imageSource={require("../../assets/images/NoData03.png")}
                  title={"No available members"}
                  content={"All members are already assigned to teams."}
                />
              </View>
            )}

            {/* Member List */}
            {filteredAvailableMembers.length > 0 && (
              <View className="px-5 pt-3" style={{ flex: 1 }}>
                <View className="flex-row items-center justify-between mb-3">
                  <Text
                    className="text-sm font-semibold text-gray-700"
                    allowFontScaling={false}
                  >
                    Available Members
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
                      {filteredAvailableMembers.length} available
                    </Text>
                  </View>
                </View>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{
                    paddingBottom: 20,
                    gap: isAndroid ? 10 : 12,
                  }}
                  style={{ maxHeight: SHEET_HEIGHT * 0.4 }}
                >
                  {filteredAvailableMembers.map((member, idx) => {
                    const selected = isSelected(member);
                    return (
                      <TouchableOpacity
                        key={idx}
                        activeOpacity={0.7}
                        onPress={() => {
                          if (selected) {
                            handleRemoveMemberFromSelectedList(member);
                          } else {
                            handleAddMemberToSelectedList(member);
                          }
                        }}
                      >
                        <View
                          className={clsx(
                            "rounded-2xl overflow-hidden",
                            selected && "border-2"
                          )}
                          style={{
                            borderColor: selected ? "#4F6AEE" : "transparent",
                            backgroundColor: selected ? "#F0F4FF" : "#FFFFFF",
                          }}
                        >
                          <MemberCard
                            name={member.username}
                            email={member.email}
                            isAddingMember={true}
                          />
                          {selected && (
                            <View
                              className="absolute top-3 right-3 w-6 h-6 rounded-full items-center justify-center"
                              style={{ backgroundColor: "#4F6AEE" }}
                            >
                              <Ionicons
                                name="checkmark"
                                size={14}
                                color="#FFFFFF"
                              />
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </>
        )}

        {/* Submit Button */}
        <View className="px-5 pb-6 pt-3">
          <AppGradient>
            <TouchableOpacity
              className="flex-row items-center justify-center py-1"
              onPress={handleSubmit}
              disabled={selectedMembers.length === 0 || isSubmitting}
              activeOpacity={0.8}
              style={{ opacity: selectedMembers.length === 0 ? 0.5 : 1 }}
            >
              {isSubmitting ? (
                <Text
                  className="text-sm font-bold text-white"
                  allowFontScaling={false}
                >
                  Adding...
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
                    Add Members{" "}
                    {selectedMembers.length > 0 &&
                      `(${selectedMembers.length})`}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </AppGradient>
        </View>
      </View>
    </Animated.View>
  );
}
