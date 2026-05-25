import { ChangePasswordAPI } from "@/api/auth/auth";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import { useTranslation } from "react-i18next";


const PasswordField = ({
  label,
  value,
  onChangeText,
  placeholder,
  isVisible,
  toggleVisibility,
  error,
  onFocus,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  isVisible: boolean;
  toggleVisibility: () => void;
  error?: string;
  onFocus?: () => void;
}) => {
  const isAndroid = Platform.OS === "android";
  return (
    <View style={{ marginBottom: isAndroid ? 16 : 20 }}>
      <Text
        style={{
          fontSize: isAndroid ? 13 : 14,
          fontWeight: "600",
          color: "#374151",
          marginBottom: 8,
        }}
        allowFontScaling={false}
      >
        {label}
      </Text>
      <View
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: isAndroid ? 12 : 14,
          borderWidth: 1,
          borderColor: error ? "#EF4444" : "#E5E7EB",
          flexDirection: "row",
          alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <TextInput
          style={{
            flex: 1,
            paddingHorizontal: isAndroid ? 14 : 16,
            paddingVertical: isAndroid ? 12 : 14,
            fontSize: isAndroid ? 14 : 15,
            color: "#1F2937",
          }}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!isVisible}
          onFocus={onFocus}
          allowFontScaling={false}
        />
        <Pressable
          onPress={toggleVisibility}
          style={{
            paddingHorizontal: isAndroid ? 14 : 16,
            paddingVertical: isAndroid ? 12 : 14,
          }}
        >
          <Feather
            name={isVisible ? "eye" : "eye-off"}
            size={isAndroid ? 18 : 20}
            color="#9CA3AF"
          />
        </Pressable>
      </View>
      {error && (
        <Text
          style={{
            fontSize: isAndroid ? 11 : 12,
            color: "#EF4444",
            marginTop: 4,
          }}
          allowFontScaling={false}
        >
          {error}
        </Text>
      )}
    </View>
  );
};

export default function ChangePassword() {
  const isAndroid = Platform.OS === "android";
  const horizontalPadding = isAndroid ? 16 : 20;

  const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] =
    useState(false);
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);
    
  const { t } = useTranslation();

  const [currentPasswordInput, setCurrentPasswordInput] = useState<string>("");
  const [newPasswordInput, setNewPasswordInput] = useState<string>("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState<string>("");

  const [currentPasswordError, setCurrentPasswordError] = useState<string>("");
  const [newPasswordError, setNewPasswordError] = useState<string>("");
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>("");

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = () => {
    let hasError = false;

    if (!currentPasswordInput) {
    setCurrentPasswordError(t("validation.currentPasswordRequired"));
    hasError = true;
  }

if (!newPasswordInput) {
    setNewPasswordError(t("validation.newPasswordRequired"));
    hasError = true;
  } else if (newPasswordInput.length < 8) {
    setNewPasswordError(t("validation.passwordMinLength"));
    hasError = true;
  }

if (newPasswordInput !== confirmPasswordInput) {
    setConfirmPasswordError(t("validation.passwordsDoNotMatch"));
    hasError = true;
  }

    if (hasError) return;

    setIsLoading(true);
    const payload = {
      currentPassword: currentPasswordInput,
      newPassword: newPasswordInput,
    };

    ChangePasswordAPI(payload)
      .then((res) => {
        if (res.data) {
          toast.success("Password changed successfully");
          setCurrentPasswordInput("");
          setNewPasswordInput("");
          setConfirmPasswordInput("");
        }
      })
      .catch((err) => {
        if (err.status === 400) {
          toast.error("Current password is incorrect");
        } else {
          toast.error("Failed to change password");
        }
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
        <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
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
                  color: "#1F2937",
                }}
                allowFontScaling={false}
              >
                Change Password
              </Text>
              <Text
                style={{
                  fontSize: isAndroid ? 12 : 13,
                  color: "#6B7280",
                  fontWeight: "500",
                  marginTop: 2,
                }}
                allowFontScaling={false}
              >
                Secure your account
              </Text>
            </View>
          </View>
        </SafeAreaView>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: horizontalPadding,
            paddingTop: isAndroid ? 16 : 20,
            paddingBottom: 40,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={{
              backgroundColor: "#FFF7ED",
              borderRadius: isAndroid ? 12 : 14,
              padding: isAndroid ? 14 : 16,
              flexDirection: "row",
              alignItems: "center",
              marginBottom: isAndroid ? 20 : 24,
              gap: 12,
            }}
          >
            <View
              style={{
                width: isAndroid ? 36 : 40,
                height: isAndroid ? 36 : 40,
                borderRadius: isAndroid ? 10 : 12,
                backgroundColor: "#FFEDD5",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather
                name="shield"
                size={isAndroid ? 18 : 20}
                color="#F59E0B"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: isAndroid ? 12 : 13,
                  color: "#92400E",
                  lineHeight: isAndroid ? 16 : 18,
                }}
                allowFontScaling={false}
              >
               {t("auth.passwordHint")}
              </Text>
            </View>
          </View>

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
            <PasswordField
              label="Current Password"
              value={currentPasswordInput}
              onChangeText={setCurrentPasswordInput}
              placeholder="Enter current password"
              isVisible={isCurrentPasswordVisible}
              toggleVisibility={() =>
                setIsCurrentPasswordVisible(!isCurrentPasswordVisible)
              }
              error={currentPasswordError}
              onFocus={() => setCurrentPasswordError("")}
            />

            <PasswordField
              label="New Password"
              value={newPasswordInput}
              onChangeText={setNewPasswordInput}
              placeholder="Enter new password"
              isVisible={isNewPasswordVisible}
              toggleVisibility={() =>
                setIsNewPasswordVisible(!isNewPasswordVisible)
              }
              error={newPasswordError}
              onFocus={() => setNewPasswordError("")}
            />

            <PasswordField
              label="Confirm New Password"
              value={confirmPasswordInput}
              onChangeText={setConfirmPasswordInput}
              placeholder="Confirm new password"
              isVisible={isConfirmPasswordVisible}
              toggleVisibility={() =>
                setIsConfirmPasswordVisible(!isConfirmPasswordVisible)
              }
              error={confirmPasswordError}
              onFocus={() => setConfirmPasswordError("")}
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleSubmit}
            disabled={isLoading}
            style={{ marginTop: isAndroid ? 24 : 28 }}
          >
            <LinearGradient
              colors={["#4F6AEE", "#9B4BE2"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: isAndroid ? 14 : 16,
                paddingVertical: isAndroid ? 14 : 16,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 8,
              }}
            >
              <Feather name="lock" size={18} color="#FFFFFF" />
              <Text
                style={{
                  fontSize: isAndroid ? 14 : 15,
                  fontWeight: "600",
                  color: "#FFFFFF",
                }}
                allowFontScaling={false}
              >
              {isLoading ? t("common.updating") : t("auth.updatePassword")}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}
