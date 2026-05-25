import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type ActionType = "delete" | "join" | "cancel" | "success" | "warning";

interface ActionConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  actionType?: ActionType;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

const ACTION_CONFIGS: Record<
  ActionType,
  {
    iconName: keyof typeof Feather.glyphMap;
    iconColor: string;
    iconBgColor: string;
    gradientColors: [string, string];
  }
> = {
  delete: {
    iconName: "trash-2",
    iconColor: "#EF4444",
    iconBgColor: "#FEE2E2",
    gradientColors: ["#EF4444", "#DC2626"],
  },
  join: {
    iconName: "user-plus",
    iconColor: "#4F6AEE",
    iconBgColor: "#EEF2FF",
    gradientColors: ["#4F6AEE", "#3B82F6"],
  },
  cancel: {
    iconName: "x-circle",
    iconColor: "#F59E0B",
    iconBgColor: "#FEF3C7",
    gradientColors: ["#F59E0B", "#D97706"],
  },
  success: {
    iconName: "check-circle",
    iconColor: "#10B981",
    iconBgColor: "#D1FAE5",
    gradientColors: ["#10B981", "#059669"],
  },
  warning: {
    iconName: "alert-triangle",
    iconColor: "#F59E0B",
    iconBgColor: "#FEF3C7",
    gradientColors: ["#F59E0B", "#D97706"],
  },
};

export default function ActionConfirmationModal({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  actionType = "warning",
  isLoading = false,
  icon,
}: ActionConfirmationModalProps) {
  const isAndroid = Platform.OS === "android";
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const config = ACTION_CONFIGS[actionType];

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const renderIcon = () => {
    if (icon) return icon;

    return (
      <View
        style={{
          width: isAndroid ? 56 : 64,
          height: isAndroid ? 56 : 64,
          borderRadius: isAndroid ? 28 : 32,
          backgroundColor: config.iconBgColor,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: isAndroid ? 16 : 20,
        }}
      >
        <Feather
          name={config.iconName}
          size={isAndroid ? 26 : 30}
          color={config.iconColor}
        />
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Pressable
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
          onPress={handleClose}
        >
          {isAndroid ? (
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(0, 0, 0, 0.6)",
              }}
            />
          ) : (
            <BlurView
              intensity={20}
              tint="dark"
              style={{
                flex: 1,
                backgroundColor: "rgba(0, 0, 0, 0.4)",
              }}
            />
          )}
        </Pressable>
        <Animated.View
          style={{
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
            width: isAndroid ? "88%" : "85%",
            maxWidth: 340,
            backgroundColor: "#FFFFFF",
            borderRadius: isAndroid ? 20 : 24,
            paddingTop: isAndroid ? 24 : 28,
            paddingBottom: isAndroid ? 20 : 24,
            paddingHorizontal: isAndroid ? 20 : 24,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.15,
            shadowRadius: 20,
            elevation: 15,
          }}
        >
          <View style={{ alignItems: "center" }}>{renderIcon()}</View>
          <Text
            style={{
              fontSize: isAndroid ? 18 : 20,
              fontWeight: "700",
              color: "#1F2937",
              textAlign: "center",
              marginBottom: isAndroid ? 8 : 10,
            }}
            allowFontScaling={false}
          >
            {title}
          </Text>
          <Text
            style={{
              fontSize: isAndroid ? 13 : 14,
              color: "#6B7280",
              textAlign: "center",
              lineHeight: isAndroid ? 20 : 22,
              marginBottom: isAndroid ? 20 : 24,
            }}
            allowFontScaling={false}
          >
            {message}
          </Text>

          {/* Buttons */}
          <View
            style={{
              flexDirection: "row",
              gap: isAndroid ? 10 : 12,
            }}
          >
            <TouchableOpacity
              style={{
                flex: 1,
                height: isAndroid ? 44 : 48,
                borderRadius: isAndroid ? 12 : 14,
                backgroundColor: "#F3F4F6",
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={handleClose}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <Text
                style={{
                  fontSize: isAndroid ? 14 : 15,
                  fontWeight: "600",
                  color: "#6B7280",
                }}
                allowFontScaling={false}
              >
                {cancelText}
              </Text>
            </TouchableOpacity>

            {/* Confirm Button */}
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={onConfirm}
              activeOpacity={0.85}
              disabled={isLoading}
            >
              <LinearGradient
                colors={config.gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  height: isAndroid ? 44 : 48,
                  borderRadius: isAndroid ? 12 : 14,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text
                    style={{
                      fontSize: isAndroid ? 14 : 15,
                      fontWeight: "600",
                      color: "#FFFFFF",
                    }}
                    allowFontScaling={false}
                  >
                    {confirmText}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
