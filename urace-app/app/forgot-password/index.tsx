import { ForgotPassword } from "@/api/auth/auth";
import { Feather } from "@expo/vector-icons";
import clsx from "clsx";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Keyboard,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { toast } from "sonner-native";

const { height } = Dimensions.get("window");

export default function Index() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const headerHeight = useRef(new Animated.Value(height * 0.32)).current;

  const [inputEmail, setInputEmail] = useState<string>("");
  const [inputEmailError, setInputEmailError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        Animated.timing(headerHeight, {
          toValue: height * 0.18,
          duration: Platform.OS === "ios" ? e.duration : 250,
          useNativeDriver: false,
        }).start();

        setTimeout(
          () => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          },
          Platform.OS === "ios" ? 50 : 100
        );
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      (e) => {
        Animated.timing(headerHeight, {
          toValue: height * 0.32,
          duration: Platform.OS === "ios" ? e.duration : 250,
          useNativeDriver: false,
        }).start();

        setTimeout(() => {
          scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        }, 50);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const handleSubmit = () => {
    Keyboard.dismiss();
    if (!inputEmail) {
      setInputEmailError("Email cannot be empty");
      return;
    }
    if (!emailRegex.test(inputEmail)) {
      setInputEmailError("Invalid email format");
      return;
    }

    setIsLoading(true);
    ForgotPassword({
      email: inputEmail,
    })
      .then((res) => {
        if (res.status === 200) {
          toast.success("Reset password sent successfully", {
            description: "Please check your email",
          });
        }
      })
      .catch((err) =>
        toast.error("There is error occured when sending password. Try again")
      )
      .finally(() => {
        setIsLoading(false);
        setInputEmail("");
      });
  };

  const handleInputFocus = () => {
    setInputEmailError("");
  };

  const isAndroid = Platform.OS === "android";

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View className="flex-1 bg-white">
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Header Section with Gradient - Animated */}
          <Animated.View style={{ height: headerHeight }}>
            <LinearGradient
              colors={["rgb(79, 106, 238)", "rgb(155, 75, 226)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                flex: 1,
                borderBottomLeftRadius: 40,
                borderBottomRightRadius: 40,
              }}
            >
              <TouchableOpacity
                className="absolute top-12 left-5 w-10 h-10 bg-white/20 rounded-full items-center justify-center"
                style={{ marginTop: isAndroid ? 10 : 0, zIndex: 10 }}
                activeOpacity={0.7}
                onPress={() => router.back()}
              >
                <Feather name="arrow-left" size={22} color="white" />
              </TouchableOpacity>

              <View className="flex-1 justify-center items-center px-8">
                <View
                  className="w-16 h-16 bg-white/20 rounded-full items-center justify-center mb-3 overflow-hidden"
                  style={{ marginTop: isAndroid ? 15 : 0 }}
                >
                  <Image
                    source={require("../../assets/images/Urace.png")}
                    className="w-12 h-12"
                    resizeMode="contain"
                  />
                </View>

                <Text
                  className="text-2xl text-white font-bold tracking-wide"
                  allowFontScaling={false}
                >
                  URace
                </Text>
                <Text
                  className="text-white/80 text-xs mt-1 font-medium"
                  allowFontScaling={false}
                >
                  Fitness Tracker
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>

          <View
            className="flex-1 px-6 -mt-6"
            style={{ paddingBottom: isAndroid ? 30 : 50 }}
          >
            <View
              className="bg-white rounded-3xl px-6 py-6"
              style={{
                shadowColor: "#6B5CE7",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.15,
                shadowRadius: 20,
                elevation: 15,
              }}
            >
              <View className="items-center mb-5">
                <View className="w-14 h-14 bg-purple-100 rounded-full items-center justify-center mb-3">
                  <Feather name="lock" size={24} color="#9B4BE2" />
                </View>
                <Text
                  className="text-lg font-bold text-gray-800"
                  allowFontScaling={false}
                >
                  Forgot Password?
                </Text>
                <Text
                  className="text-gray-500 text-xs text-center mt-2 px-2"
                  allowFontScaling={false}
                >
                  Don't worry! Enter your email address and we'll send you a new
                  temporary password.
                </Text>
              </View>

              <View className="mb-5">
                <Text
                  className="text-gray-700 text-sm font-semibold mb-2 ml-1"
                  allowFontScaling={false}
                >
                  Email Address
                </Text>
                <View
                  className={clsx(
                    "flex-row items-center bg-gray-50 rounded-2xl px-4 border-2",
                    inputEmailError ? "border-red-400" : "border-transparent"
                  )}
                  style={{
                    height: isAndroid ? 50 : 54,
                  }}
                >
                  <Feather
                    name="mail"
                    size={20}
                    color={inputEmailError ? "#f87171" : "#9ca3af"}
                  />
                  <TextInput
                    className="flex-1 ml-3 text-gray-800 text-sm"
                    placeholder="Enter your email"
                    placeholderTextColor="#9ca3af"
                    value={inputEmail}
                    onChangeText={setInputEmail}
                    onFocus={handleInputFocus}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    allowFontScaling={false}
                  />
                </View>
                {inputEmailError && (
                  <Text
                    className="text-red-500 text-xs mt-1 ml-1"
                    allowFontScaling={false}
                  >
                    {inputEmailError}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={["rgb(79, 106, 238)", "rgb(155, 75, 226)"]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  className="rounded-2xl items-center justify-center"
                  style={{
                    height: isAndroid ? 50 : 54,
                    opacity: isLoading ? 0.7 : 1,
                  }}
                >
                  {isLoading ? (
                    <Text
                      className="text-white text-base font-bold"
                      allowFontScaling={false}
                    >
                      Sending...
                    </Text>
                  ) : (
                    <View className="flex-row items-center">
                      <Text
                        className="text-white text-base font-bold mr-2"
                        allowFontScaling={false}
                      >
                        Send Reset Link
                      </Text>
                      <Feather name="send" size={18} color="white" />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View className="flex-row justify-center mt-6">
              <Text className="text-gray-500 text-sm" allowFontScaling={false}>
                Remember your password?{" "}
              </Text>
              <TouchableOpacity
                onPress={() => router.back()}
                activeOpacity={0.7}
              >
                <Text
                  className="text-purple-600 text-sm font-bold"
                  allowFontScaling={false}
                >
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}
