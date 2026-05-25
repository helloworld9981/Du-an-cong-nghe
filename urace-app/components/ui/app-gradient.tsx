import { AppGradientPosition } from "@/types/app-gradient";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { useTheme } from "@/hooks/useTheme";

export default function AppGradient({
  children,
  className,
  colors,
  start,
  end,
  isNotRadius = false,
}: {
  children?: React.ReactNode;
  className?: string;
  colors?: any;
  start?: AppGradientPosition;
  end?: AppGradientPosition;
  isNotRadius?: boolean;
}) {
  const theme = useTheme();

  // check dark mode 
  const isDark =
    theme.background === "#000000" ||
    theme.background === "#0B0B0B" ||
    theme.background === "#121212";

  // gradient mặc định theo theme
  const defaultGradient = isDark
    ? ["#312E81", "#581C87"] 
    : ["rgb(79, 106, 238)", "rgb(155, 75, 226)"];

  return (
    <LinearGradient
      colors={colors ?? defaultGradient}
      start={start ?? { x: 0, y: 0.5 }}
      end={end ?? { x: 1, y: 0.5 }}
      className={`w-full py-2.5 ${className}`}
      style={{
        borderRadius: isNotRadius ? 0 : 32,
      }}
    >
      {children}
    </LinearGradient>
  );
}