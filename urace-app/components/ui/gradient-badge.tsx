import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Text, View } from "react-native";

export default function GradientBadge({
  icon,
  textClassName,
  text,
}: {
  icon?: React.ReactNode;
  textClassName?: string;
  text: string;
}) {
  return (
    <LinearGradient
      colors={["rgb(32, 65, 233)", "rgb(178, 110, 206)"]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      className="rounded-full"
    >
      <View className="rounded-full py-2 px-4 flex flex-row items-center space-x-2">
        {icon}
        <Text className={textClassName ?? "text-[12px] font-medium text-white"}>
          {text}
        </Text>
      </View>
    </LinearGradient>
  );
}
