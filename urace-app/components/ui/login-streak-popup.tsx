import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  visible: boolean;
  streak: number;
  onClose: () => void;
};

export default function LoginStreakPopup({
  visible,
  streak,
  onClose,
}: Props) {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1100,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [floatAnim]);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -18],
  });

  const scale = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: "#F97316",
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 28,
        }}
      >
        <TouchableOpacity
          onPress={onClose}
          style={{
            position: "absolute",
            top: 60,
            right: 24,
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: "rgba(255,255,255,0.15)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="close" size={22} color="white" />
        </TouchableOpacity>

        <View
          style={{
            width: 180,
            height: 180,
            borderRadius: 90,
            backgroundColor: "rgba(255,255,255,0.15)",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 36,
          }}
        >
          <Animated.View
            style={{
              transform: [{ translateY }, { scale }],
            }}
          >
            <Text style={{ fontSize: 96 }}>🔥</Text>
          </Animated.View>
        </View>

        <Text
          style={{
            fontSize: 34,
            fontWeight: "900",
            color: "white",
            textAlign: "center",
          }}
        >
          Login Streak
        </Text>

        <Text
          style={{
            marginTop: 18,
            fontSize: 20,
            lineHeight: 32,
            color: "rgba(255,255,255,0.92)",
            textAlign: "center",
          }}
        >
          Bạn đã đăng nhập chuỗi{" "}
          <Text style={{ fontWeight: "900", color: "#FFF7ED" }}>
            {streak}
          </Text>{" "}
          ngày liên tiếp
        </Text>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            onClose();
            router.push("/login-streak?fromPopup=true");
          }}
          style={{
            marginTop: 42,
            backgroundColor: "white",
            width: "100%",
            paddingVertical: 18,
            borderRadius: 22,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: "#F97316",
              fontSize: 17,
              fontWeight: "800",
            }}
          >
            See more
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}