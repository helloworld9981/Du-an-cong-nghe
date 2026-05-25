import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Platform,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/hooks/useTheme";
import { useThemeStore } from "@/zustand/themeStore";
import { useTranslation } from "react-i18next";

export default function ThemeScreen() {
  const isAndroid = Platform.OS === "android";
  const padding = isAndroid ? 16 : 20;

  const { theme, setTheme } = useThemeStore();
  const colors = useTheme();
  const { t } = useTranslation();

  const PhonePreview = ({ mode }: { mode: "light" | "dark" }) => {
    const isSelected = theme === mode;

    const bg = mode === "light" ? "#FFFFFF" : "#000000";
    const text = mode === "light" ? "#000000" : "#FFFFFF";

    const card = mode === "light" ? "#F3F4F6" : "#1F2937";
    const tabBg = mode === "light" ? "#FFFFFF" : "#111827";
    const tabBorder = mode === "light" ? "#E5E7EB" : "#1F2937";
    const active = "#4F6AEE";

    return (
      <TouchableOpacity
        onPress={() => setTheme(mode)}
        style={{ flex: 1, alignItems: "center" }}
        activeOpacity={0.8}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 160,
            aspectRatio: 9 / 16,
            borderRadius: 26,
            borderWidth: isSelected ? 2 : 1,
            borderColor: isSelected ? "#4F6AEE" : "#E5E7EB",
            overflow: "hidden",
            backgroundColor: bg,
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 5,
          }}
        >
          <View
            style={{
              height: 24,
              justifyContent: "center",
              paddingHorizontal: 10,
            }}
          >
            <Text style={{ color: text, fontSize: 10 }}>9:41</Text>
          </View>

          <View style={{ flex: 1, padding: 10 }}>
            <Text
              style={{
                color: text,
                fontWeight: "700",
                fontSize: 12,
                marginBottom: 8,
              }}
            >
              Home
            </Text>

            <View
              style={{
                height: 40,
                borderRadius: 8,
                backgroundColor: card,
                marginBottom: 8,
              }}
            />

            <View
              style={{
                height: 40,
                borderRadius: 8,
                backgroundColor: card,
              }}
            />
          </View>

          <View
            style={{
              height: 48,
              flexDirection: "row",
              borderTopWidth: 1,
              borderTopColor: tabBorder,
              backgroundColor: tabBg,
            }}
          >
            {["home", "users", "plus-circle", "bell", "user"].map(
              (icon, index) => (
                <View
                  key={index}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather
                    name={icon as any}
                    size={12}
                    color={index === 0 ? active : text}
                  />
                </View>
              )
            )}
          </View>
        </View>

        <Text
          style={{
            marginTop: 10,
            fontSize: 14,
            color: colors.text,
            fontWeight: isSelected ? "600" : "400",
          }}
        >
          {mode === "light" ? t("theme.light") : t("theme.dark")}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle={theme === "dark" ? "light-content" : "dark-content"}
      />

      <SafeAreaView>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: padding,
          }}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color="#4F6AEE" />
          </TouchableOpacity>

          <Text
            style={{
              marginLeft: 16,
              fontSize: 18,
              fontWeight: "700",
              color: colors.text,
            }}
          >
            {t("theme.title")}
          </Text>
        </View>
      </SafeAreaView>

      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: padding,
          gap: 12,
        }}
      >
        <PhonePreview mode="light" />
        <PhonePreview mode="dark" />
      </View>
    </View>
  );
}