import { useContestStore } from "@/zustand/contestStore";
import { MaterialIcons } from "@expo/vector-icons";
import clsx from "clsx";
import moment from "moment";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Text, TouchableOpacity, View } from "react-native";
import Badge from "../ui/badge";

export default function DetailTeamOverviewCard({
  teamName,
}: {
  teamName?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const rotateAnim = useRef(new Animated.Value(1)).current;
  const animatedHeight = useRef(new Animated.Value(1)).current;

  const { selectedContest } = useContestStore();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animatedHeight, {
        toValue: isExpanded ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }),
      Animated.timing(rotateAnim, {
        toValue: isExpanded ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
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

  const heightInterpolate = animatedHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const renderStatusBadge = useMemo(() => {
    if (new Date(selectedContest?.endAt) <= new Date()) {
      return <Badge color="#A31616" text="Ended" />;
    } else {
      if (new Date(selectedContest?.startAt) > new Date()) {
        return <Badge color="#2C87E2" text="Upcoming" />;
      }
    }
    return <Badge color="#16A34A" text="Active" />;
  }, [selectedContest]);
  return (
    <View
      className="rounded-[12px] px-4"
      style={{
        backgroundColor: "white",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 10,
      }}
    >
      <TouchableOpacity
        className={clsx(
          "mt-3 flex flex-row items-center justify-between pb-3",
          isExpanded && "border-b border-[#9C9B9B]"
        )}
        onPress={toggleAccordion}
        activeOpacity={0.8}
      >
        <View className="flex-1 flex flex-row items-center justify-between pr-2">
          <Text className="text-base font-bold flex-1" allowFontScaling={false}>{teamName}</Text>
        </View>
        <Animated.View
          style={{ transform: [{ rotate: rotateInterpolate }], marginLeft: 8 }}
        >
          <MaterialIcons name="keyboard-arrow-down" size={24} color="#9C9B9B" />
        </Animated.View>
      </TouchableOpacity>
      <Animated.View
        style={{
          maxHeight: animatedHeight.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 500],
          }),
          opacity: heightInterpolate,
          overflow: "hidden",
        }}
      >
        <View className="flex flex-row items-center justify-between py-3">
          <View className="flex flex-col gap-y-2 w-[60vw]">
            <Text className="text-base font-bold" allowFontScaling={false}>
              {selectedContest?.name}
            </Text>
            <Text className="text-[#9C9B9B] text-xs" allowFontScaling={false}>
              {moment(selectedContest?.startAt).format("DD/MM/YYYY, HH:mm")} -{" "}
              {moment(selectedContest?.endAt).format("DD/MM/YYYY, HH:mm")}
            </Text>
          </View>
          <View className="">{renderStatusBadge}</View>
        </View>
      </Animated.View>
    </View>
  );
}
