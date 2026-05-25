import { InitConnectToStrava } from "@/api/auth/auth";
import { GetMe } from "@/api/user/user";
import { IUser } from "@/types/auth";
import { useAuthStore } from "@/zustand/authStore";
import { Feather } from "@expo/vector-icons";
import * as AuthSession from "expo-auth-session";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "react-i18next";


WebBrowser.maybeCompleteAuthSession();

export default function ConnectStrava() {
  const isAndroid = Platform.OS === "android";
  const horizontalPadding = isAndroid ? 16 : 20;

  const [currentUser, setCurrentUser] = useState<IUser>();
  const [refetchUser, setRefetchUser] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  const colors = useTheme();
  const { t } = useTranslation();
  const cardBackground = (colors as any).card ?? colors.background;
  const mutedBackground = (colors as any).muted ?? cardBackground;
  const textColor = (colors as any).text ?? "#1F2937";
  const subTextColor = (colors as any).subText ?? (colors as any).textSecondary ?? "#6B7280";
  const borderColor = (colors as any).border ?? "#E5E7EB";


  const { isUserRefetch, setIsUserRefetch } = useAuthStore();

  useEffect(() => {
    GetMe()
      .then((res) => {
        setCurrentUser(res.data);
      })
      .catch((err) => console.error(err));
  }, [refetchUser]);

  const handleConnect = async () => {
    // For Expo Go, use native: false to get a proper redirect URI
    // For standalone builds, use the custom scheme
    const redirectUrl = AuthSession.makeRedirectUri({
      scheme: "uraceappfrontend",
      path: "strava-callback",
      // Use native: false for Expo Go compatibility
      native: `uraceappfrontend://strava-callback`,
    });

    console.log("Redirect URL:", redirectUrl);

    setIsLoading(true);
    try {
      const res = await InitConnectToStrava(redirectUrl);
      if (res.data?.url) {
        let authUrl = res.data.url;
        if (authUrl.includes("?")) {
          authUrl += "&approval_prompt=force";
        } else {
          authUrl += "?approval_prompt=force";
        }
        console.log("Auth URL:", authUrl);

        const result = await WebBrowser.openAuthSessionAsync(
          authUrl,
          redirectUrl,
          {
            preferEphemeralSession: true,
          }
        );
        if (result.type === "success" && result.url) {
          const url = new URL(result.url);
          const success = url.searchParams.get("success");
          const error = url.searchParams.get("error");

          if (success === "true") {
            toast.success(t("connect_strava.toast_connected_title"), {
              description: t("connect_strava.toast_connected_desc"),
            });
            setRefetchUser(refetchUser + 1);
          } else if (error) {
            const errorMessages: Record<string, string> = {
              access_denied: t("connect_strava.error_access_denied"),
              missing_code: t("connect_strava.error_missing_code"),
              missing_state: t("connect_strava.error_missing_state"),
              invalid_state: t("connect_strava.error_invalid_state"),
              invalid_token: t("connect_strava.error_invalid_token"),
              user_not_found: t("connect_strava.error_user_not_found"),
              server_error: t("connect_strava.error_server"),
              already_connected: t("connect_strava.error_already_connected"),
              strava_already_connected:
                t("connect_strava.error_strava_already_connected"),
              token_exchange_failed: t("connect_strava.error_token_exchange_failed"),
              strava_auth_failed: t("connect_strava.error_strava_auth_failed"),
            };

            toast.error(t("connect_strava.toast_connection_failed_title"), {
              description: errorMessages[error] || t("connect_strava.error_unknown"),
            });
          }
        } else if (result.type === "cancel") {
          toast.info(t("connect_strava.toast_connection_cancelled"));
        }
        router.replace("/connect-strava");
      } else {
        toast.error(t("connect_strava.toast_init_failed"));
      }
      setIsUserRefetch(isUserRefetch + 1);
    } catch (err: any) {
      toast.error(t("connect_strava.toast_connect_failed_title"), {
        description: t("connect_strava.toast_try_again"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stravaOrange = "#FC4C02";

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
<StatusBar barStyle={colors.background === "#000000" ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.background }}>
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
              backgroundColor: cardBackground,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 4,
              elevation: 3,
            }}
            activeOpacity={0.7}
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
                color: textColor,
              }}
              allowFontScaling={false}
            >
              {t("connect_strava.title")}
            </Text>
            <Text
              style={{
                fontSize: isAndroid ? 12 : 13,
                color: subTextColor,
                fontWeight: "500",
                marginTop: 2,
              }}
              allowFontScaling={false}
            >
              {t("connect_strava.subtitle")}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      <View
        style={{
          flex: 1,
          paddingHorizontal: horizontalPadding,
          justifyContent: "center",
        }}
      >
        {currentUser?.stravaProfile ? (
          <View>
            <View
              style={{
                backgroundColor: cardBackground,
                borderRadius: isAndroid ? 20 : 24,
                padding: isAndroid ? 24 : 28,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
                elevation: isAndroid ? 4 : 0,
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: isAndroid ? 80 : 100,
                  height: isAndroid ? 80 : 100,
                  borderRadius: isAndroid ? 40 : 50,
                  backgroundColor: "#FFF7ED",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: isAndroid ? 20 : 24,
                }}
              >
                <Feather
                  name="check-circle"
                  size={isAndroid ? 40 : 50}
                  color={stravaOrange}
                />
              </View>

              <Text
                style={{
                  fontSize: isAndroid ? 20 : 22,
                  fontWeight: "700",
                  color: textColor,
                  marginBottom: 8,
                  textAlign: "center",
                }}
                allowFontScaling={false}
              >
                {t("connect_strava.connected_title")}
              </Text>

              <Text
                style={{
                  fontSize: isAndroid ? 13 : 14,
                  color: subTextColor,
                  textAlign: "center",
                  lineHeight: isAndroid ? 18 : 20,
                  marginBottom: isAndroid ? 20 : 24,
                }}
                allowFontScaling={false}
              >
                {t("connect_strava.connected_desc")}
              </Text>

              <View
                style={{
                  backgroundColor: mutedBackground,
                  borderRadius: isAndroid ? 14 : 16,
                  padding: isAndroid ? 16 : 20,
                  width: "100%",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: isAndroid ? 48 : 56,
                    height: isAndroid ? 48 : 56,
                    borderRadius: isAndroid ? 24 : 28,
                    backgroundColor: stravaOrange,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: isAndroid ? 14 : 16,
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
                      fontSize: isAndroid ? 16 : 17,
                      fontWeight: "600",
                      color: textColor,
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
                        fontSize: isAndroid ? 12 : 13,
                        color: "#10B981",
                        fontWeight: "500",
                      }}
                      allowFontScaling={false}
                    >
                      {t("connect_strava.syncing_active")}
                    </Text>
                  </View>
                </View>
                <Feather
                  name="external-link"
                  size={isAndroid ? 18 : 20}
                  color="#9CA3AF"
                />
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              style={{
                marginTop: isAndroid ? 20 : 24,
                backgroundColor: "#FEE2E2",
                borderRadius: isAndroid ? 14 : 16,
                paddingVertical: isAndroid ? 14 : 16,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 8,
              }}
            >
              <Feather name="link-2" size={18} color="#EF4444" />
              <Text
                style={{
                  fontSize: isAndroid ? 14 : 15,
                  fontWeight: "600",
                  color: "#EF4444",
                }}
                allowFontScaling={false}
              >
                {t("connect_strava.disconnect")}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <View
              style={{
                backgroundColor: cardBackground,
                borderRadius: isAndroid ? 20 : 24,
                padding: isAndroid ? 24 : 28,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
                elevation: isAndroid ? 4 : 0,
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: isAndroid ? 80 : 100,
                  height: isAndroid ? 80 : 100,
                  borderRadius: isAndroid ? 40 : 50,
                  backgroundColor: "#FFF7ED",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: isAndroid ? 20 : 24,
                }}
              >
                <Feather
                  name="link"
                  size={isAndroid ? 40 : 50}
                  color={stravaOrange}
                />
              </View>

              <Text
                style={{
                  fontSize: isAndroid ? 20 : 22,
                  fontWeight: "700",
                  color: textColor,
                  marginBottom: 8,
                  textAlign: "center",
                }}
                allowFontScaling={false}
              >
                {t("connect_strava.connect_title")}
              </Text>

              <Text
                style={{
                  fontSize: isAndroid ? 13 : 14,
                  color: subTextColor,
                  textAlign: "center",
                  lineHeight: isAndroid ? 18 : 20,
                  marginBottom: isAndroid ? 24 : 28,
                }}
                allowFontScaling={false}
              >
                {t("connect_strava.connect_desc")}
              </Text>

              <View style={{ width: "100%", gap: isAndroid ? 12 : 14 }}>
                {[
                  { icon: "activity", text: t("connect_strava.feature_auto_sync") },
                  { icon: "bar-chart-2", text: t("connect_strava.feature_track_progress") },
                  { icon: "users", text: t("connect_strava.feature_compete") },
                ].map((item, idx) => (
                  <View
                    key={idx}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        width: isAndroid ? 36 : 40,
                        height: isAndroid ? 36 : 40,
                        borderRadius: isAndroid ? 10 : 12,
                        backgroundColor: mutedBackground,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Feather
                        name={item.icon as any}
                        size={isAndroid ? 16 : 18}
                        color="#4F6AEE"
                      />
                    </View>
                    <Text
                      style={{
                        fontSize: isAndroid ? 14 : 15,
                        fontWeight: "500",
                        color: textColor,
                      }}
                      allowFontScaling={false}
                    >
                      {item.text}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleConnect}
              disabled={isLoading}
              style={{ marginTop: isAndroid ? 20 : 24 }}
            >
              <LinearGradient
                colors={[stravaOrange, "#E53E3E"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: isAndroid ? 14 : 16,
                  paddingVertical: isAndroid ? 16 : 18,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: 10,
                  shadowColor: stravaOrange,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                }}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Feather name="link-2" size={20} color="#FFFFFF" />
                    <Text
                      style={{
                        fontSize: isAndroid ? 15 : 16,
                        fontWeight: "600",
                        color: "#FFFFFF",
                      }}
                      allowFontScaling={false}
                    >
                      {t("connect_strava.connect_button")}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <Text
              style={{
                fontSize: isAndroid ? 11 : 12,
                color: subTextColor,
                textAlign: "center",
                marginTop: isAndroid ? 12 : 16,
              }}
              allowFontScaling={false}
            >
              {t("connect_strava.redirect_note")}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
