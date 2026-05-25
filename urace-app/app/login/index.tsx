import { Login } from "@/api/auth/auth";
import { IUser, LoginRequest } from "@/types/auth";
import { useAuthStore } from "@/zustand/authStore";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { GoogleLogin } from "@/api/auth/google-auth";
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
  const headerHeight = useRef(new Animated.Value(height * 0.38)).current;

  const [inputEmail, setInputEmail] = useState<string>("");
  const [inputPassword, setInputPassword] = useState<string>("");
  const [inputEmailError, setInputEmailError] = useState<string>("");
  const [inputPasswordError, setInputPasswordError] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { setToken, setUser } = useAuthStore();

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        Animated.timing(headerHeight, {
          toValue: height * 0.15,
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
          toValue: height * 0.38,
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

  useEffect(() => {
  GoogleSignin.configure({
    webClientId: "710979661199-c2flpt2grsru28pde84iv56asv2el4mo.apps.googleusercontent.com",
  });
}, []);
  
  const handleGoogleSignIn = async () => {
  try {
    setIsLoading(true);

    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    console.log("USER INFO:", JSON.stringify(userInfo, null, 2));
    console.log("ID TOKEN:", userInfo.data?.idToken);

    const idToken = userInfo.data?.idToken;

    if (!idToken) {
      toast.error("Cannot get Google token");
      return;
    }

    const res = await GoogleLogin(idToken);

    if (res.data) {
      setToken(res.data.accessToken);

      const mappedUser: IUser = {
        ...res.data.user,
        id: res.data.user._id,
      };

      setUser(mappedUser);
      toast.success("Sign in successfully");
      router.push("/(tabs)");
    }
  } catch (err: any) {
    if (err.code === statusCodes.SIGN_IN_CANCELLED) {
      return;
    }

    console.log("Google sign in error:", err);
    toast.error("Google sign in failed");
  } finally {
    setIsLoading(false);
  }
};

  const handleSubmit = () => {
    Keyboard.dismiss();
    if (!inputEmail) {
      setInputEmailError("Email cannot be empty");
      return;
    }
    if (!inputPassword) {
      setInputPasswordError("Password cannot be empty");
      return;
    }

    setIsLoading(true);
    const payload: LoginRequest = {
      email: inputEmail,
      password: inputPassword,
    };

    Login(payload)
      .then((res) => {
        if (res.data) {
          setToken(res.data.accessToken);
          const mappedUser: IUser = {
            ...res.data.user,
            id: res.data.user._id,
          };
          setUser(mappedUser);
          toast.success("Sign in successfully");
          setTimeout(() => {
            router.push("/(tabs)");
          }, 2000);
        }
      })
      .catch((err) => {
        console.log(err);
        if (err.status === 401) {
          toast.error("Invalid email or password");
        } else {
          toast.error("There is error occured while login. Try again");
        }
      })
      .finally(() => {
        setIsLoading(false);
        setInputEmail("");
        setInputPassword("");
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
              <View className="flex-1 justify-center items-center px-8">
                {/* Logo/Icon */}
                <View
                  className="w-20 h-20 bg-white/20 rounded-full items-center justify-center mb-3 overflow-hidden"
                  style={{ marginTop: isAndroid ? 20 : 0 }}
                >
                  <Image
                    source={require("../../assets/images/Urace.png")}
                    className="w-16 h-16"
                    resizeMode="contain"
                  />
                </View>

                {/* App Name */}
                <Text
                  className="text-3xl text-white font-bold tracking-wide"
                  allowFontScaling={false}
                >
                  URace
                </Text>
                <Text
                  className="text-white/80 text-sm mt-1 font-medium"
                  allowFontScaling={false}
                >
                  Fitness Tracker
                </Text>

                {/* Welcome Text */}
                <Text
                  className="text-white text-lg font-semibold mt-4"
                  allowFontScaling={false}
                >
                  Welcome Back! 👋
                </Text>
                <Text
                  className="text-white/70 text-xs mt-1"
                  allowFontScaling={false}
                >
                  Sign in to continue your journey
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Form Section */}
          <View
            className="flex-1 px-6 -mt-6"
            style={{ paddingBottom: isAndroid ? 30 : 50 }}
          >
            {/* Card Container */}
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
              {/* Email Input */}
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

              {/* Password Input */}
              <View className="mb-3">
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
                    placeholder="Enter your password"
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

              {/* Forgot Password */}
              <TouchableOpacity
                className="self-end mb-5"
                onPress={() => router.push("forgot-password" as any)}
                activeOpacity={0.7}
              >
                <Text
                  className="text-purple-600 text-sm font-semibold"
                  allowFontScaling={false}
                >
                  Forgot Password?
                </Text>
              </TouchableOpacity>

              {/* Submit Button */}
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
                      Signing in...
                    </Text>
                  ) : (
                    <View className="flex-row items-center">
                      <Text
                        className="text-white text-base font-bold mr-2"
                        allowFontScaling={false}
                      >
                        Sign In
                      </Text>
                      <Feather name="arrow-right" size={20} color="white" />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Sign Up Section */}
            <View className="flex-row justify-center mt-6">
              <Text className="text-gray-500 text-sm" allowFontScaling={false}>
                Don't have an account?{" "}
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/register" as any)}
                activeOpacity={0.7}
              >
                <Text
                  className="text-purple-600 text-sm font-bold"
                  allowFontScaling={false}
                >
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>
            {/* Divider */}
  <Text
  className="text-gray-400 text-sm mt-5 mb-4 text-center"
  allowFontScaling={false}
>
  ───── Or sign in with ─────
</Text>

{/* Social Buttons */}
<View
  className="flex-row justify-center items-center"
  style={{ gap: 2 }}
>
  {/* Google */}
  <TouchableOpacity
    activeOpacity={0.8}
    onPress={handleGoogleSignIn}
    className="w-10 h-10 rounded-xl bg-white border border-gray-200 items-center justify-center"
  >
    <Feather name="chrome" size={16} color="#ea5635" />
  </TouchableOpacity>

  {/* Twitter */}
  <TouchableOpacity
    activeOpacity={0.8}
    onPress={() => toast.info("Coming soon")}
    className="w-10 h-10 rounded-xl bg-white border border-gray-200 items-center justify-center"
  >
    <Feather name="twitter" size={16} color="#1DA1F2" />
  </TouchableOpacity>

  {/* Apple */}
  <TouchableOpacity
    activeOpacity={0.8}
    onPress={() => toast.info("Coming soon")}
    className="w-10 h-10 rounded-xl bg-white border border-gray-200 items-center justify-center"
  >
    <Feather name="smartphone" size={16} color="#111827" />
  </TouchableOpacity>
</View>
          </View>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}
