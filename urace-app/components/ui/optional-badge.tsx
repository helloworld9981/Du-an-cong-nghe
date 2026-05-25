import React from "react";
import { Text, View } from "react-native";

export default function OptionalBadge({
  color,
  text,
  actionIcon,
  textClassName,
}: {
  color: string;
  text: string;
  actionIcon?: React.ReactNode;
  textClassName?: string;
}) {
  return (
    <View
      className="rounded-full py-2 px-3 flex flex-row items-center justify-between space-x-2"
      style={{ backgroundColor: color }}
    >
      <View>
        <Text className={textClassName ?? "text-[10px] font-medium text-white"} allowFontScaling={false}>
          {text}
        </Text>
      </View>
      {actionIcon && <View>{actionIcon}</View>}
    </View>
  );
}
