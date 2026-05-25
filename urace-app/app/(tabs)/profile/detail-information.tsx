import { UpdateProfile } from "@/api/user/user";
import { emailRegex } from "@/constants/regex";
import { useAuthStore } from "@/zustand/authStore";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Keyboard,
  Platform,
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


const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  editable = true,
  error,
  multiline = false,
  height,
  onContentSizeChange,
  scrollEnabled,
}: {
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  placeholder: string;
  editable?: boolean;
  error?: string;
  multiline?: boolean;
  height?: number;
  onContentSizeChange?: (e: any) => void;
  scrollEnabled?: boolean;
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
          backgroundColor: editable ? "#FFFFFF" : "#F3F4F6",
          borderRadius: isAndroid ? 12 : 14,
          borderWidth: 1,
          borderColor: error ? "#EF4444" : "#E5E7EB",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: editable ? 2 : 0,
        }}
      >
        <TextInput
          style={{
            paddingHorizontal: isAndroid ? 14 : 16,
            paddingVertical: isAndroid ? 12 : 14,
            fontSize: isAndroid ? 14 : 15,
            color: editable ? "#1F2937" : "#6B7280",
            height: height,
            textAlignVertical: multiline ? "top" : "center",
          }}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          multiline={multiline}
          onContentSizeChange={onContentSizeChange}
          scrollEnabled={scrollEnabled}
          allowFontScaling={false}
        />
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

export default function DetailInformation() {
  const isAndroid = Platform.OS === "android";
  const horizontalPadding = isAndroid ? 16 : 20;
  const { user, setUser } = useAuthStore();

  const [bioHeight, setBioHeight] = useState<number>(0);

  const { t } = useTranslation();


  const minBioHeight = isAndroid ? 80 : 100;
  const maxBioHeight = isAndroid ? 150 : 180;
  const computedDescHeight = useMemo(() => {
    if (!bioHeight) return minBioHeight;
    return Math.min(Math.max(bioHeight, minBioHeight), maxBioHeight);
  }, [bioHeight]);

  const [inputDisplayName, setInputDisplayName] = useState<string>(
    user?.displayName ?? user?.username ?? "",
  );
  const [inputUsername] = useState<string>(user?.username ?? "");
  const [inputEmail, setInputEmail] = useState<string>(user?.email ?? "");
  const [inputBio, setInputBio] = useState<string>(user?.bio ?? "");
  const [inputHeight, setInputHeight] = useState<string>(
    user?.height?.toString() ?? "",
  );
  const [inputWeight, setInputWeight] = useState<string>(
    user?.weight?.toString() ?? "",
  );

  const [inputEmailError, setInputEmailError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = () => {
    if (!inputEmail) {
      setInputEmailError("Email cannot be empty");
      return;
    }
    if (!emailRegex.test(inputEmail)) {
      setInputEmailError("Invalid email format");
      return;
    }

    setIsLoading(true);
    const payload = {
      displayName: inputDisplayName,
      email: inputEmail,
      bio: inputBio,
      height: inputHeight ? parseFloat(inputHeight) : undefined,
      weight: inputWeight ? parseFloat(inputWeight) : undefined,
    };

    UpdateProfile(payload)
      .then((res) => {
        if (res.data) {
          setUser({
            id: res.data._id,
            username: res.data.username,
            displayName: res.data.displayName,
            email: res.data.email,
            bio: res.data.bio,
            height: res.data.height,
            weight: res.data.weight,
          });
          toast.success(t("toast.updateProfileSuccess"));
        }
      })
      .catch(() => {
        toast.error(t("profile.updateProfileFailed"));
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
                {t("detail-profile.edit")}
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
               {t("detail-profile.update")}
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
            <InputField
              label="Display Name"
              value={inputDisplayName}
              onChangeText={setInputDisplayName}
              placeholder="Enter your display name"
            />

            <InputField
              label="Username"
              value={inputUsername}
              placeholder="Your username"
              editable={false}
            />

            <InputField
              label="Email"
              value={inputEmail}
              onChangeText={(text) => {
                setInputEmail(text);
                setInputEmailError("");
              }}
              placeholder="Enter your email"
              error={inputEmailError}
            />

            <View
              style={{
                flexDirection: "row",
                gap: 16,
              }}
            >
              <View style={{ flex: 1 }}>
                <InputField
                  label="Height (cm)"
                  value={inputHeight}
                  onChangeText={setInputHeight}
                  placeholder="e.g. 175"
                />
              </View>
              <View style={{ flex: 1 }}>
                <InputField
                  label="Weight (kg)"
                  value={inputWeight}
                  onChangeText={setInputWeight}
                  placeholder="e.g. 70"
                />
              </View>
            </View>

            <InputField
              label="Biography"
              value={inputBio}
              onChangeText={setInputBio}
              placeholder="Tell us about yourself..."
              multiline
              height={computedDescHeight}
              onContentSizeChange={(e) => {
                const h = e.nativeEvent.contentSize.height;
                setBioHeight(h);
              }}
              scrollEnabled={computedDescHeight >= maxBioHeight}
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleSubmit}
            disabled={isLoading}
            style={{ marginTop: isAndroid ? 20 : 24 }}
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
              <Feather name="check" size={18} color="#FFFFFF" />
              <Text
                style={{
                  fontSize: isAndroid ? 14 : 15,
                  fontWeight: "600",
                  color: "#FFFFFF",
                }}
                allowFontScaling={false}
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}
