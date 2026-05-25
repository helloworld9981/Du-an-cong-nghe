import { GetMe } from "@/api/user/user";
import { IUser } from "@/types/auth";
import { useAuthStore } from "@/zustand/authStore";
import { Feather } from "@expo/vector-icons";
import { CommonActions } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { router, useNavigation } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";


export default function Index() {
  const { t } = useTranslation();

  const { logout, isUserRefetch } = useAuthStore();
  const navigation = useNavigation();

  const [currentUser, setCurrentUser] = useState<IUser | null>();

  useEffect(() => {
    GetMe()
      .then((res) => {
        if (res.data) {
          setCurrentUser({
            ...res.data,
            id: res.data._id,
          });
        }
      })
      .catch((err) => console.error(err));
  }, [isUserRefetch]);

  const isAndroid = Platform.OS === "android";
  const horizontalPadding = isAndroid ? 16 : 20;

    const menuItems = [
    {
      icon: "user",
      label: t("profile.menu.detail_information.label"),
      description: t("profile.menu.detail_information.description"),
      route: "/profile/detail-information",
    },
    {
      icon: "lock",
      label: t("profile.menu.change_password.label"),
      description: t("profile.menu.change_password.description"),
      route: "/profile/change-password",
    },
  ];

  const preferenceMenu = [
    {
      icon: "globe",
      label: t("profile.preferences_menu.language.label"),
      description: t("profile.preferences_menu.language.description"),
      route: "profile/settings/language",
    },
    {
      icon: "moon",
      label: t("profile.preferences_menu.theme.label"),
      description: t("profile.preferences_menu.theme.description"),
      route: "profile/settings/theme",
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <StatusBar barStyle="light-content" backgroundColor="#4F6AEE" />

      <LinearGradient
        colors={["#4F6AEE", "#9B4BE2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingBottom: isAndroid ? 60 : 70,
        }}
      >
        <SafeAreaView edges={["top"]}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: horizontalPadding,
              paddingVertical: isAndroid ? 12 : 16,
            }}
          >
            <Text
              style={{
                fontSize: isAndroid ? 20 : 22,
                fontWeight: "700",
                color: "#FFFFFF",
              }}
              allowFontScaling={false}
            >
              {t("profile.title")}
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/connect-strava")}
              style={{
                width: isAndroid ? 38 : 42,
                height: isAndroid ? 38 : 42,
                borderRadius: isAndroid ? 12 : 14,
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                alignItems: "center",
                justifyContent: "center",
              }}
              activeOpacity={0.7}
            >
              <Feather
                name="settings"
                size={isAndroid ? 18 : 20}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1, marginTop: isAndroid ? -50 : -60 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 130 }}
      >
        <View
          style={{
            marginHorizontal: horizontalPadding,
            backgroundColor: "#FFFFFF",
            borderRadius: isAndroid ? 20 : 24,
            padding: isAndroid ? 20 : 24,
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: isAndroid ? 6 : 0,
          }}
        >
          <View
            style={{
              width: isAndroid ? 80 : 100,
              height: isAndroid ? 80 : 100,
              borderRadius: isAndroid ? 40 : 50,
              borderWidth: 3,
              borderColor: "#4F6AEE",
              padding: 3,
            }}
          >
            <Image
              source={require("../../../assets/images/DefaultAvatar.png")}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: isAndroid ? 36 : 46,
              }}
            />
          </View>
          <Text
            style={{
              fontSize: isAndroid ? 18 : 20,
              fontWeight: "700",
              color: "#1F2937",
              marginTop: isAndroid ? 12 : 16,
            }}
            allowFontScaling={false}
          >
            {currentUser?.displayName || currentUser?.username || "User"}
          </Text>
          <Text
            style={{
              fontSize: isAndroid ? 13 : 14,
              color: "#6B7280",
              marginTop: 4,
            }}
            allowFontScaling={false}
          >
            {currentUser?.email || "email@example.com"}
          </Text>

          {(currentUser?.height || currentUser?.weight) && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 8,
                gap: 12,
              }}
            >
              {currentUser?.height && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#F3F4F6",
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 8,
                  }}
                >
                  <Feather
                    name="bar-chart-2"
                    size={14}
                    color="#4B5563"
                    style={{ marginRight: 4, transform: [{ rotate: "90deg" }] }}
                  />
                  <Text
                    style={{
                      fontSize: isAndroid ? 12 : 13,
                      fontWeight: "600",
                      color: "#4B5563",
                    }}
                    allowFontScaling={false}
                  >
                    {currentUser.height} cm
                  </Text>
                </View>
              )}

              {currentUser?.weight && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#F3F4F6",
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 8,
                  }}
                >
                  <Feather
                    name="disc" // Changed from 'scale' to 'disc' which is available in Feather, or keep generic
                    size={14}
                    color="#4B5563"
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={{
                      fontSize: isAndroid ? 12 : 13,
                      fontWeight: "600",
                      color: "#4B5563",
                    }}
                    allowFontScaling={false}
                  >
                    {currentUser.weight} kg
                  </Text>
                </View>
              )}
            </View>
          )}

          {currentUser?.bio && (
            <Text
              style={{
                fontSize: isAndroid ? 12 : 13,
                color: "#9CA3AF",
                marginTop: 8,
                textAlign: "center",
                lineHeight: isAndroid ? 18 : 20,
              }}
              allowFontScaling={false}
            >
              {currentUser.bio}
            </Text>
          )}
        </View>

        <View
          style={{
            marginHorizontal: horizontalPadding,
            marginTop: isAndroid ? 20 : 24,
          }}
        >
          <Text
            style={{
              fontSize: isAndroid ? 14 : 15,
              fontWeight: "600",
              color: "#6B7280",
              marginBottom: isAndroid ? 10 : 12,
              marginLeft: 4,
            }}
            allowFontScaling={false}
          >
            {t("profile.sections.account")}
          </Text>

          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: isAndroid ? 16 : 18,
              overflow: "hidden",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: isAndroid ? 3 : 0,
            }}
          >
            {menuItems.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.7}
                onPress={() => router.push(item.route as any)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: isAndroid ? 14 : 16,
                  borderBottomWidth: idx < menuItems.length - 1 ? 1 : 0,
                  borderBottomColor: "#F3F4F6",
                }}
              >
                <View
                  style={{
                    width: isAndroid ? 40 : 44,
                    height: isAndroid ? 40 : 44,
                    borderRadius: isAndroid ? 12 : 14,
                    backgroundColor: "#4F6AEE15",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: isAndroid ? 12 : 14,
                  }}
                >
                  <Feather
                    name={item.icon as any}
                    size={isAndroid ? 18 : 20}
                    color="#4F6AEE"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: isAndroid ? 14 : 15,
                      fontWeight: "600",
                      color: "#1F2937",
                    }}
                    allowFontScaling={false}
                  >
                    {item.label}
                  </Text>
                  <Text
                    style={{
                      fontSize: isAndroid ? 11 : 12,
                      color: "#9CA3AF",
                      marginTop: 2,
                    }}
                    allowFontScaling={false}
                  >
                    {item.description}
                  </Text>
                </View>
                <Feather name="chevron-right" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        //hết block

        <View
          style={{
            marginHorizontal: horizontalPadding,
            marginTop: isAndroid ? 20 : 24,
          }}
        >
          <Text
            style={{
              fontSize: isAndroid ? 14 : 15,
              fontWeight: "600",
              color: "#6B7280",
              marginBottom: isAndroid ? 10 : 12,
              marginLeft: 4,
            }}
            allowFontScaling={false}
          >
            {t("profile.sections.preferences")}
          </Text>

          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: isAndroid ? 16 : 18,
              overflow: "hidden",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: isAndroid ? 3 : 0,
            }}
          >
            {preferenceMenu.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.7}
                onPress={() => router.push(item.route as any)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: isAndroid ? 14 : 16,
                  borderBottomWidth: idx < menuItems.length - 1 ? 1 : 0,
                  borderBottomColor: "#F3F4F6",
                }}
              >
                <View
                  style={{
                    width: isAndroid ? 40 : 44,
                    height: isAndroid ? 40 : 44,
                    borderRadius: isAndroid ? 12 : 14,
                    backgroundColor: "#4F6AEE15",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: isAndroid ? 12 : 14,
                  }}
                >
                  <Feather
                    name={item.icon as any}
                    size={isAndroid ? 18 : 20}
                    color="#4F6AEE"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: isAndroid ? 14 : 15,
                      fontWeight: "600",
                      color: "#1F2937",
                    }}
                    allowFontScaling={false}
                  >
                    {item.label}
                  </Text>
                  <Text
                    style={{
                      fontSize: isAndroid ? 11 : 12,
                      color: "#9CA3AF",
                      marginTop: 2,
                    }}
                    allowFontScaling={false}
                  >
                    {item.description}
                  </Text>
                </View>
                <Feather name="chevron-right" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
            // hết block
        <View
          style={{
            marginHorizontal: horizontalPadding,
            marginTop: isAndroid ? 20 : 24,
          }}
        >
          <Text
            style={{
              fontSize: isAndroid ? 14 : 15,
              fontWeight: "600",
              color: "#6B7280",
              marginBottom: isAndroid ? 10 : 12,
              marginLeft: 4,
            }}
            allowFontScaling={false}
          >
            {t("profile.sections.strava")}
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/connect-strava")}
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: isAndroid ? 16 : 18,
              padding: isAndroid ? 14 : 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: isAndroid ? 3 : 0,
            }}
          >
            {currentUser?.stravaProfile ? (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: isAndroid ? 48 : 52,
                    height: isAndroid ? 48 : 52,
                    borderRadius: isAndroid ? 24 : 26,
                    backgroundColor: "#FC4C02",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: isAndroid ? 12 : 14,
                  }}
                >
                  <Text
                    style={{
                      fontSize: isAndroid ? 18 : 20,
                      fontWeight: "700",
                      color: "#FFFFFF",
                    }}
                    allowFontScaling={false}
                  >
                    {currentUser.stravaProfile.firstname?.charAt(0) || "S"}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: isAndroid ? 14 : 15,
                      fontWeight: "600",
                      color: "#1F2937",
                    }}
                    allowFontScaling={false}
                  >
                    {currentUser.stravaProfile.firstname}{" "}
                    {currentUser.stravaProfile.lastname}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginTop: 4,
                      gap: 4,
                    }}
                  >
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: "#10B981",
                      }}
                    />
                    <Text
                      style={{
                        fontSize: isAndroid ? 11 : 12,
                        color: "#10B981",
                        fontWeight: "500",
                      }}
                      allowFontScaling={false}
                    >
                      {t("profile.strava.connected")}
                    </Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={20} color="#9CA3AF" />
              </View>
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: isAndroid ? 48 : 52,
                    height: isAndroid ? 48 : 52,
                    borderRadius: isAndroid ? 24 : 26,
                    backgroundColor: "#FEF3C7",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: isAndroid ? 12 : 14,
                  }}
                >
                  <Feather
                    name="link"
                    size={isAndroid ? 20 : 22}
                    color="#F59E0B"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: isAndroid ? 14 : 15,
                      fontWeight: "600",
                      color: "#1F2937",
                    }}
                    allowFontScaling={false}
                  >
                    Connect Strava
                  </Text>
                  <Text
                    style={{
                      fontSize: isAndroid ? 11 : 12,
                      color: "#9CA3AF",
                      marginTop: 2,
                    }}
                    allowFontScaling={false}
                  >
                   {t("profile.strava.sync")}
                  </Text>
                </View>
                <Feather name="chevron-right" size={20} color="#9CA3AF" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={async () => {
            await logout();
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: "login/index" }],
              }),
            );
          }}
          style={{
            marginHorizontal: horizontalPadding,
            marginTop: isAndroid ? 32 : 40,
            backgroundColor: "#FEE2E2",
            borderRadius: isAndroid ? 14 : 16,
            paddingVertical: isAndroid ? 14 : 16,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 8,
          }}
        >
          <Feather name="log-out" size={18} color="#EF4444" />
          <Text
            style={{
              fontSize: isAndroid ? 14 : 15,
              fontWeight: "600",
              color: "#EF4444",
            }}
            allowFontScaling={false}
          >
           {t("profile.actions.logout")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
