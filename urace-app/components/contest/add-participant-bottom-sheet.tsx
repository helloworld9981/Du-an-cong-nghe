import {
  AddParticipantsToContest,
  GetAvailableContestParticipant,
} from "@/api/contest/contest";
import { IAvailableParticipant } from "@/types/contest";
import { useContestStore } from "@/zustand/contestStore";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Image,
  Keyboard,
  PanResponder,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { toast } from "sonner-native";

export default function AddParticipantBottomSheet({
  visible,
  onClose,
  contestId,
}: {
  visible: boolean;
  onClose: () => void;
  contestId?: string;
}) {
  const isAndroid = Platform.OS === "android";
  const { width, height } = Dimensions.get("window");
  const SHEET_HEIGHT = isAndroid ? height * 0.85 : height * 0.9;

  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const isClosingByDrag = useRef(false);
  const DRAG_THRESHOLD = SHEET_HEIGHT * 0.25;

  const [availableParticipants, setAvailableParticipants] = useState<
    IAvailableParticipant[]
  >([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedParticipants, setSelectedParticipants] = useState<
    IAvailableParticipant[]
  >([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { refetchContestDetail, setRefetchContestDetail } = useContestStore();

  const filteredParticipants = useMemo(() => {
    if (!searchQuery.trim()) {
      return availableParticipants;
    }
    return availableParticipants.filter(
      (participant) =>
        participant.username
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        participant.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [availableParticipants, searchQuery]);

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
    if (contestId) {
      setIsLoading(true);
      GetAvailableContestParticipant(contestId)
        .then((res) => {
          if (res.data) {
            setAvailableParticipants(res.data);
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setIsLoading(false));
    }
  }, [contestId]);

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
  }, [visible]);

  const translateY = Animated.add(slideAnim, dragY);

  const handleToggleParticipant = (participant: IAvailableParticipant) => {
    const isSelected = selectedParticipants.some(
      (p) => p.userId === participant.userId
    );
    if (isSelected) {
      setSelectedParticipants(
        selectedParticipants.filter((p) => p.userId !== participant.userId)
      );
    } else {
      setSelectedParticipants([...selectedParticipants, participant]);
    }
  };

  const isParticipantSelected = (participant: IAvailableParticipant) => {
    return selectedParticipants.some((p) => p.userId === participant.userId);
  };

  const handleSubmit = () => {
    if (selectedParticipants.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    const ids = selectedParticipants.map((participant) => participant.userId);
    const payload = {
      participantIds: ids,
    };
    AddParticipantsToContest(contestId ?? "", payload)
      .then((res) => {
        if (res.data) {
          toast.success("Participants added successfully");
          setRefetchContestDetail(refetchContestDetail + 1);
          onClose();
        }
      })
      .catch((err) => {
        toast.error(
          err.response?.data?.message || "Failed to add participants"
        );
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

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
      {/* Draggable Handle */}
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
        <Text
          style={{
            fontSize: 11,
            color: "#9CA3AF",
            marginTop: 4,
          }}
          allowFontScaling={false}
        >
          Swipe down to close
        </Text>
      </Animated.View>

      {/* Header */}
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
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: isAndroid ? 18 : 20,
              fontWeight: "700",
              color: "#1F2937",
            }}
            allowFontScaling={false}
          >
            Add Participants
          </Text>
          <Text
            style={{
              fontSize: isAndroid ? 12 : 13,
              color: "#6B7280",
              marginTop: 2,
            }}
            allowFontScaling={false}
          >
            Select members to add to this contest
          </Text>
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

      {/* Search Bar */}
      <View
        style={{
          paddingHorizontal: isAndroid ? 16 : 20,
          paddingVertical: isAndroid ? 12 : 16,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#F8FAFC",
            borderWidth: 1,
            borderColor: "#E2E8F0",
            borderRadius: isAndroid ? 12 : 14,
            paddingHorizontal: isAndroid ? 12 : 14,
          }}
        >
          <Feather name="search" size={isAndroid ? 18 : 20} color="#9CA3AF" />
          <TextInput
            style={{
              flex: 1,
              paddingVertical: isAndroid ? 10 : 12,
              paddingHorizontal: isAndroid ? 10 : 12,
              fontSize: isAndroid ? 14 : 15,
              color: "#1F2937",
            }}
            placeholder="Search by name or username..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            allowFontScaling={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Feather name="x-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {selectedParticipants.length > 0 && (
        <View
          style={{
            marginHorizontal: isAndroid ? 16 : 20,
            marginBottom: isAndroid ? 8 : 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#EEF2FF",
            paddingHorizontal: isAndroid ? 12 : 14,
            paddingVertical: isAndroid ? 8 : 10,
            borderRadius: isAndroid ? 10 : 12,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Feather name="check-circle" size={16} color="#4F6AEE" />
            <Text
              style={{
                fontSize: isAndroid ? 13 : 14,
                fontWeight: "600",
                color: "#4F6AEE",
              }}
              allowFontScaling={false}
            >
              {selectedParticipants.length} selected
            </Text>
          </View>
          <TouchableOpacity onPress={() => setSelectedParticipants([])}>
            <Text
              style={{
                fontSize: isAndroid ? 12 : 13,
                fontWeight: "500",
                color: "#9CA3AF",
              }}
              allowFontScaling={false}
            >
              Clear all
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ flex: 1 }}>
        {isLoading ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ActivityIndicator size="large" color="#4F6AEE" />
            <Text
              style={{
                marginTop: 12,
                fontSize: isAndroid ? 13 : 14,
                color: "#6B7280",
              }}
              allowFontScaling={false}
            >
              Loading members...
            </Text>
          </View>
        ) : filteredParticipants.length === 0 ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: isAndroid ? 24 : 32,
            }}
          >
            <View
              style={{
                width: isAndroid ? 80 : 100,
                height: isAndroid ? 80 : 100,
                borderRadius: isAndroid ? 40 : 50,
                backgroundColor: "#F3F4F6",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: isAndroid ? 16 : 20,
              }}
            >
              <Feather
                name="search"
                size={isAndroid ? 32 : 40}
                color="#9CA3AF"
              />
            </View>
            <Text
              style={{
                fontSize: isAndroid ? 16 : 18,
                fontWeight: "600",
                color: "#374151",
                textAlign: "center",
              }}
              allowFontScaling={false}
            >
              {searchQuery ? "No results found" : "No members available"}
            </Text>
            <Text
              style={{
                fontSize: isAndroid ? 13 : 14,
                color: "#9CA3AF",
                textAlign: "center",
                marginTop: 8,
                lineHeight: isAndroid ? 18 : 20,
              }}
              allowFontScaling={false}
            >
              {searchQuery
                ? `No members match "${searchQuery}". Try a different keyword.`
                : "All group members are already participants in this contest."}
            </Text>
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: isAndroid ? 16 : 20,
              paddingBottom: isAndroid ? 80 : 100,
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text
              style={{
                fontSize: isAndroid ? 12 : 13,
                fontWeight: "500",
                color: "#9CA3AF",
                marginBottom: isAndroid ? 10 : 12,
              }}
              allowFontScaling={false}
            >
              {filteredParticipants.length} available members
            </Text>
            <View style={{ gap: isAndroid ? 8 : 10 }}>
              {filteredParticipants.map((participant, idx) => {
                const isSelected = isParticipantSelected(participant);
                return (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.7}
                    onPress={() => handleToggleParticipant(participant)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: isSelected ? "#EEF2FF" : "#FFFFFF",
                      borderRadius: isAndroid ? 12 : 14,
                      padding: isAndroid ? 12 : 14,
                      borderWidth: 1,
                      borderColor: isSelected ? "#4F6AEE" : "#F3F4F6",
                    }}
                  >
                    {/* Avatar */}
                    <View
                      style={{
                        width: isAndroid ? 44 : 48,
                        height: isAndroid ? 44 : 48,
                        borderRadius: isAndroid ? 22 : 24,
                        backgroundColor: "#F3F4F6",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
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

                    {/* Info */}
                    <View style={{ flex: 1, marginLeft: isAndroid ? 10 : 12 }}>
                      <Text
                        style={{
                          fontSize: isAndroid ? 14 : 15,
                          fontWeight: "600",
                          color: "#1F2937",
                        }}
                        numberOfLines={1}
                        allowFontScaling={false}
                      >
                        {participant.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: isAndroid ? 12 : 13,
                          fontWeight: "500",
                          color: "#9CA3AF",
                          marginTop: 2,
                        }}
                        numberOfLines={1}
                        allowFontScaling={false}
                      >
                        @{participant.username}
                      </Text>
                    </View>

                    {/* Checkbox */}
                    <View
                      style={{
                        width: isAndroid ? 24 : 28,
                        height: isAndroid ? 24 : 28,
                        borderRadius: isAndroid ? 12 : 14,
                        borderWidth: 2,
                        borderColor: isSelected ? "#4F6AEE" : "#D1D5DB",
                        backgroundColor: isSelected ? "#4F6AEE" : "transparent",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {isSelected && (
                        <Feather name="check" size={14} color="#FFFFFF" />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        )}
      </View>

      {/* Footer Button */}
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
          onPress={handleSubmit}
          disabled={selectedParticipants.length === 0 || isSubmitting}
          style={{
            opacity: selectedParticipants.length === 0 ? 0.5 : 1,
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
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Feather name="user-plus" size={18} color="#FFFFFF" />
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: isAndroid ? 14 : 15,
                    fontWeight: "600",
                  }}
                  allowFontScaling={false}
                >
                  Add{" "}
                  {selectedParticipants.length > 0
                    ? `${selectedParticipants.length} Participant${selectedParticipants.length > 1 ? "s" : ""}`
                    : "Participants"}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}
