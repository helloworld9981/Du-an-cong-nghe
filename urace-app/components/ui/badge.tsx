import React from "react";
import { Text, View } from "react-native";

export default function Badge({
  color,
  className,
  textClassName,
  text,
  icon,
}: {
  color: string;
  className?: string;
  textClassName?: string;
  text: string;
  icon?: React.ReactNode;
}) {
  return (
    <View
      className="rounded-full py-2 px-4 flex flex-row items-center space-x-2"
      style={{ backgroundColor: color }}
    >
      {icon}
      <Text
        className={textClassName ?? "text-[10px] font-medium text-white"}
        allowFontScaling={false}
      >
        {text}
      </Text>
    </View>
  );
}
