import { Register } from "@/api/auth/auth";
import { RegisterRequest } from "@/types/auth";
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
  const headerHeight = useRef(new Animated.Value(height * 0.3)).current;

  const [inputUsername, setInputUsername] = useState<string>("");
  const [inputEmail, setInputEmail] = useState<string>("");
  const [inputPassword, setInputPassword] = useState<string>("");

  const [inputUsernameError, setInputUsernameError] = useState<string>("");
  const [inputEmailError, setInputEmailError] = useState<string>("");
  const [inputPasswordError, setInputPasswordError] = useState<string>("");

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        Animated.timing(headerHeight, {
          toValue: height * 0.12,
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
          toValue: height * 0.3,
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
    if (!inputUsername) {
      setInputUsernameError("Username cannot be empty");
      return;
    }
    if (!inputEmail) {
      setInputEmailError("Email cannot be empty");
      return;
    }
    if (!inputPassword) {
      setInputPasswordError("Password cannot be empty");
      return;
    }

    setIsLoading(true);
    const payload: RegisterRequest = {
      username: inputUsername,
      email: inputEmail,
      password: inputPassword,
    };

    Register(payload)
      .then((res) => {
        if (res.status === 201) {
          toast.success("Sign up successfully", {
            description: "Redirecting to login...",
          });
          setTimeout(() => {
            router.push("/login");
          }, 2000);
          setTimeout(() => {
            setInputEmail("");
            setInputUsername("");
            setInputPassword("");
          }, 3000);
        }
      })
      .catch((err) => {
        toast.error(
          err.status === 400
            ? "Email is already exists."
            : "Errors during registration. Try again."
        );
      })
      .finally(() => {
        setIsLoading(false);
        setInputUsername("");
        setInputPassword("");
        setInputEmail("");
      });
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
                  className="w-14 h-14 bg-white/20 rounded-full items-center justify-center mb-2 overflow-hidden"
                  style={{ marginTop: isAndroid ? 15 : 0 }}
                >
                  <Image
                    source={require("../../assets/images/Urace.png")}
                    className="w-10 h-10"
                    resizeMode="contain"
                  />
                </View>

                <Text
                  className="text-xl text-white font-bold tracking-wide"
                  allowFontScaling={false}
                >
                  URace
                </Text>
                <Text
                  className="text-white/80 text-xs mt-1 font-medium"
                  allowFontScaling={false}
                >
                  Create your account
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
              <View className="mb-4">
                <Text
                  className="text-gray-700 text-sm font-semibold mb-2 ml-1"
                  allowFontScaling={false}
                >
                  Username
                </Text>
                <View
                  className={clsx(
                    "flex-row items-center bg-gray-50 rounded-2xl px-4 border-2",
                    inputUsernameError ? "border-red-400" : "border-transparent"
                  )}
                  style={{
                    height: isAndroid ? 50 : 54,
                  }}
                >
                  <Feather
                    name="user"
                    size={20}
                    color={inputUsernameError ? "#f87171" : "#9ca3af"}
                  />
                  <TextInput
                    className="flex-1 ml-3 text-gray-800 text-sm"
                    placeholder="Enter your username"
                    placeholderTextColor="#9ca3af"
                    value={inputUsername}
                    onChangeText={setInputUsername}
                    onFocus={() => setInputUsernameError("")}
                    autoCapitalize="none"
                    allowFontScaling={false}
                  />
                </View>
                {inputUsernameError && (
                  <Text
                    className="text-red-500 text-xs mt-1 ml-1"
                    allowFontScaling={false}
                  >
                    {inputUsernameError}
                  </Text>
                )}
              </View>
              <View className="mb-4">
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
                    onFocus={() => setInputEmailError("")}
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
              <View className="mb-6">
                <Text
                  className="text-gray-700 text-sm font-semibold mb-2 ml-1"
                  allowFontScaling={false}
                >
                  Password
                </Text>
                <View
                  className={clsx(
                    "flex-row items-center bg-gray-50 rounded-2xl px-4 border-2",
                    inputPasswordError ? "border-red-400" : "border-transparent"
                  )}
                  style={{
                    height: isAndroid ? 50 : 54,
                  }}
                >
                  <Feather
                    name="lock"
                    size={20}
                    color={inputPasswordError ? "#f87171" : "#9ca3af"}
                  />
                  <TextInput
                    className="flex-1 ml-3 text-gray-800 text-sm"
                    placeholder="Create a password"
                    placeholderTextColor="#9ca3af"
                    value={inputPassword}
                    onChangeText={setInputPassword}
                    onFocus={() => setInputPasswordError("")}
                    secureTextEntry={!showPassword}
                    allowFontScaling={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.7}
                  >
                    <Feather
                      name={showPassword ? "eye" : "eye-off"}
                      size={20}
                      color="#9ca3af"
                    />
                  </TouchableOpacity>
                </View>
                {inputPasswordError && (
                  <Text
                    className="text-red-500 text-xs mt-1 ml-1"
                    allowFontScaling={false}
                  >
                    {inputPasswordError}
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
                      Creating account...
                    </Text>
                  ) : (
                    <View className="flex-row items-center">
                      <Text
                        className="text-white text-base font-bold mr-2"
                        allowFontScaling={false}
                      >
                        Sign Up
                      </Text>
                      <Feather name="arrow-right" size={20} color="white" />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
            <View className="flex-row justify-center mt-6">
              <Text className="text-gray-500 text-sm" allowFontScaling={false}>
                Already have an account?{" "}
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/login")}
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
