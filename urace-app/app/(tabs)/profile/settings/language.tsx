import { Feather } from "@expo/vector-icons"
import { router } from "expo-router"
import { useState } from "react"
import {
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useAppLanguage } from "@/hooks/useAppLanguage"
import { useTranslation } from "react-i18next";


export default function LanguageScreen() {
  const isAndroid = Platform.OS === "android"
  const horizontalPadding = isAndroid ? 16 : 20

  const { changeLanguage, currentLanguage, languages } = useAppLanguage()
  const { t } = useTranslation();

  const [isOpen, setIsOpen] = useState(false)

  const currentLang =
    languages.find((l) => l.value === currentLanguage)?.label ||
    "Select language"

  const handleSelect = (lang: string) => {
    changeLanguage(lang)
    setIsOpen(false)
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* HEADER */}
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "#F9FAFB" }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: horizontalPadding,
            paddingVertical: isAndroid ? 12 : 14,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: isAndroid ? 38 : 42,
              height: isAndroid ? 38 : 42,
              borderRadius: isAndroid ? 12 : 14,
              backgroundColor: "#FFFFFF",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Feather
              name="arrow-left"
              size={isAndroid ? 20 : 22}
              color="#4F6AEE"
            />
          </TouchableOpacity>

          <View style={{ flex: 1, marginLeft: isAndroid ? 12 : 16 }}>
            <Text
              style={{
                fontSize: isAndroid ? 18 : 20,
                fontWeight: "700",
                color: "#1F2937",
              }}
            >
                  {t("language.title")}
            </Text>
            <Text
              style={{
                fontSize: isAndroid ? 12 : 13,
                color: "#6B7280",
                marginTop: 2,
              }}
            >
               {t("language.select")}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      {/* CONTENT */}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: horizontalPadding,
          paddingTop: isAndroid ? 16 : 20,
        }}
      >
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: isAndroid ? 16 : 20,
            padding: isAndroid ? 16 : 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: isAndroid ? 3 : 0,
          }}
        >
          {/* LABEL */}
          <Text
            style={{
              fontSize: isAndroid ? 13 : 14,
              fontWeight: "600",
              color: "#374151",
              marginBottom: 8,
            }}
          >
            {t("language.display")}
          </Text>

          {/* DROPDOWN BOX */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsOpen(!isOpen)}
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: isAndroid ? 12 : 14,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: isAndroid ? 14 : 16,
              paddingVertical: isAndroid ? 12 : 14,
            }}
          >
            <Text
              style={{
                fontSize: isAndroid ? 14 : 15,
                color: "#1F2937",
              }}
            >
              {currentLang}
            </Text>

            <Feather
              name={isOpen ? "chevron-up" : "chevron-down"}
              size={18}
              color="#9CA3AF"
            />
          </TouchableOpacity>

          {/* DROPDOWN LIST */}
          {isOpen && (
            <View
              style={{
                marginTop: 8,
                borderRadius: isAndroid ? 12 : 14,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                overflow: "hidden",
              }}
            >
              {languages.map((lang, index) => {
                const isSelected = currentLanguage === lang.value

                return (
                  <TouchableOpacity
                    key={lang.value}
                    onPress={() => handleSelect(lang.value)}
                    style={{
                      paddingVertical: isAndroid ? 12 : 14,
                      paddingHorizontal: isAndroid ? 14 : 16,
                      backgroundColor: isSelected ? "#EEF2FF" : "#FFFFFF",
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottomWidth:
                        index < languages.length - 1 ? 1 : 0,
                      borderBottomColor: "#F3F4F6",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: isAndroid ? 14 : 15,
                        fontWeight: isSelected ? "600" : "400",
                        color: "#1F2937",
                      }}
                    >
                      {lang.label}
                    </Text>

                    {isSelected && (
                      <Feather name="check" size={18} color="#4F6AEE" />
                    )}
                  </TouchableOpacity>
                )
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}