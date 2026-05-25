import React from "react";
import {
  Platform,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

export default function Header({
  className,
  icon,
  headerText,
  handlePressIcon,
  showBorder = false,
}: {
  className?: string;
  icon?: React.ReactNode;
  headerText: string;
  handlePressIcon?: () => void;
  showBorder?: boolean;
}) {
  const { width } = useWindowDimensions();
  const isAndroid = Platform.OS === "android";
  const isSmallScreen = width < 380;

  return (
    <View
      style={{
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 16,
        paddingVertical: isAndroid ? 12 : 8,
        borderBottomWidth: showBorder ? 1 : 0,
        borderBottomColor: "#E2E8F0",
        position: "relative",
        minHeight: isAndroid ? 48 : 44,
      }}
    >
      {icon && (
        <Pressable
          style={{
            position: "absolute",
            left: 16,
            zIndex: 100,
            padding: 4,
          }}
          onPress={handlePressIcon}
          android_ripple={{
            color: "rgba(99, 102, 241, 0.1)",
            borderless: true,
            radius: 24,
          }}
        >
          {icon}
        </Pressable>
      )}
      <Text
        style={{
          fontSize: isSmallScreen ? 16 : 18,
          fontWeight: "700",
          color: "#1E293B",
          textAlign: "center",
          letterSpacing: -0.3,
        }}
        allowFontScaling={false}
      >
        {headerText}
      </Text>
    </View>
  );
}
