import { NavigationOption } from "@/types/navigation";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Platform,
  Text,
  TouchableOpacity,
  useColorScheme,
  useWindowDimensions,
  View,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { useThemeStore } from "@/zustand/themeStore";

export default function Navigation({
  className,
  options,
  activeTab,
  setActiveTab,
  quantities,
}: {
  className?: string;
  options: NavigationOption[];
  activeTab: number;
  setActiveTab?: (activeTab: number) => void;
  quantities?: number[];
}) {
  const colors = useTheme();

  const { theme } = useThemeStore();
  const systemTheme = useColorScheme();

  const isDark =
    theme === "dark" || systemTheme === "dark";

  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnims = useRef(options.map(() => new Animated.Value(1))).current;

  const { width } = useWindowDimensions();
  const isAndroid = Platform.OS === "android";
  const isSmallScreen = width < 380;

  const cardBackground = (colors as any).card ?? colors.background;
  const mutedBackground =
    (colors as any).muted ?? (isDark ? "#27272A" : "#F1F5F9");

  const activeColor = (colors as any).primary ?? "#4F6AEE";
  const inactiveColor =
    (colors as any).textSecondary ?? (isDark ? "#A1A1AA" : "#94A3B8");

  const gradientColors = useMemo(
    () =>
      isDark
        ? (["#312E81", "#581C87"] as const)
        : (["#4F6AEE", "#9B4BE2"] as const),
    [isDark]
  );

  useEffect(() => {
    const activeIndex = options.findIndex((opt) => opt.value === activeTab);

    Animated.spring(slideAnim, {
      toValue: activeIndex < 0 ? 0 : activeIndex,
      useNativeDriver: true,
      friction: 8,
      tension: 50,
    }).start();

    scaleAnims.forEach((anim, idx) => {
      Animated.spring(anim, {
        toValue: idx === activeIndex ? 1.02 : 1,
        useNativeDriver: true,
        friction: 6,
      }).start();
    });
  }, [activeTab, options, slideAnim, scaleAnims]);

  const tabWidth = width / options.length;
  const indicatorWidth = tabWidth * 0.65;
  const indicatorOffset = (tabWidth - indicatorWidth) / 2;

  return (
    <View
      style={{
        width: "100%",
        backgroundColor: cardBackground,
        shadowColor: isDark ? "#000" : "#64748B",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.25 : 0.08,
        shadowRadius: 8,
        elevation: isAndroid ? 4 : 0,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: isAndroid ? 4 : 8,
        }}
      >
        {options.map((opt, idx) => {
          const isActive = activeTab === opt.value;

          return (
            <Animated.View
              key={idx}
              style={{
                flex: 1,
                transform: [{ scale: scaleAnims[idx] }],
              }}
            >
              <TouchableOpacity
                style={{
                  alignItems: "center",
                  paddingVertical: isAndroid ? 14 : 16,
                  paddingHorizontal: 4,
                }}
                activeOpacity={0.7}
                onPress={() => setActiveTab?.(opt.value)}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Text
                    style={{
                      fontSize: isSmallScreen ? 12 : isAndroid ? 13 : 14,
                      fontWeight: isActive ? "700" : "500",
                      color: isActive ? activeColor : inactiveColor,
                      letterSpacing: isActive ? -0.2 : 0,
                    }}
                    allowFontScaling={false}
                  >
                    {opt.label}
                  </Text>

                  {quantities && quantities[idx] !== undefined && (
                    <View
                      style={{
                        backgroundColor: isActive
                          ? isDark
                            ? "rgba(99,102,241,0.25)"
                            : "#4F6AEE15"
                          : mutedBackground,
                        borderRadius: 10,
                        paddingHorizontal: isAndroid ? 6 : 8,
                        paddingVertical: 2,
                        minWidth: isAndroid ? 22 : 24,
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: isAndroid ? 10 : 11,
                          fontWeight: "600",
                          color: isActive ? activeColor : inactiveColor,
                        }}
                        allowFontScaling={false}
                      >
                        {quantities[idx]}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

      <Animated.View
        style={{
          position: "absolute",
          bottom: 0,
          height: isAndroid ? 3 : 4,
          width: indicatorWidth,
          borderTopLeftRadius: 4,
          borderTopRightRadius: 4,
          overflow: "hidden",
          transform: [
            {
              translateX: slideAnim.interpolate({
                inputRange: [0, options.length - 1],
                outputRange: [
                  indicatorOffset,
                  tabWidth * (options.length - 1) + indicatorOffset,
                ],
              }),
            },
          ],
        }}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
}