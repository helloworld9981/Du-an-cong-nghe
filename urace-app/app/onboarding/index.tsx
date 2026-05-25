import React, { useState } from "react";
import {
  Dimensions,
  Image,
  ImageBackground,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import {
  useFonts,
  Lato_400Regular,
  Lato_700Bold,
} from "@expo-google-fonts/lato";
import Carousel from "react-native-reanimated-carousel";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import AppGradient from "@/components/ui/app-gradient";

export default function Index() {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [fontsLoaded] = useFonts({
    Lato_400Regular,
    Lato_700Bold,
  });

  const router = useRouter();

  const { width, height } = Dimensions.get("window");
  const slides = [
    {
      id: 1,
      image: require("../../assets/images/Onboarding1.png"),
      title: "Track your progress",
      description: "Connect your Strava and see every run, ride or swim.",
    },
    {
      id: 2,
      image: require("../../assets/images/Onboarding2.png"),
      title: "Compete with groups",
      description:
        "Join or create a group, race together, and climb the leaderboard.",
    },
    {
      id: 3,
      image: require("../../assets/images/Onboarding3.png"),
      title: "Challenge yourself",
      description:
        "Participate in events, earn achievements, and push your limits.",
    },
  ];

  const TOTAL_WIDTH = 75;
  const INDICATOR_WIDTH = TOTAL_WIDTH / slides.length;
  const SPACING = 0;
  const translateX = useSharedValue(0);
  React.useEffect(() => {
    translateX.value = withTiming(activeIndex * (INDICATOR_WIDTH + SPACING), {
      duration: 300,
    });
  }, [activeIndex]);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  if (!fontsLoaded) return null;
  return (
    <View className="flex-1 flex-col bg-white gap-y-2">
      <View className="w-full">
        <Carousel
          loop={true}
          width={width}
          height={height * 0.7}
          data={slides}
          scrollAnimationDuration={600}
          onSnapToItem={(i) => setActiveIndex(i)}
          renderItem={({ item }) => (
            <View>
              <Image
                source={item.image}
                className="w-full h-[60vh]"
                resizeMode="cover"
              />
              <LinearGradient
                colors={[
                  "rgba(255,255,255,0)", // bottom solid white
                  "rgba(255,255,255,0.5)",
                  "rgba(255,255,255,0.8)",
                  "rgba(255,255,255,0.9)",
                  "rgba(255,255,255,1)",
                ]}
                className="w-full relative bottom-[200px] h-[200px]"
              />
              <View className="flex flex-col gap-6 items-center">
                <View className="relative bottom-[200px]">
                  <Text className="font-lato text-2xl font-extrabold">
                    {item.title}
                  </Text>
                </View>
                <View className="relative bottom-[200px]">
                  <Text className="text-[#9EA2A5]">{item.description}</Text>
                </View>
              </View>
            </View>
          )}
        />
      </View>
      <View className="flex items-center pt-10 relative">
        <View className="w-[75px] h-[5px]" style={{ position: "relative" }}>
          <View className="w-[75px] h-[5px] bg-black rounded-[5px] flex flex-row">
            {slides.map((_, idx) => (
              <View key={idx} className="bg-black rounded-[5px] flex-1"></View>
            ))}
          </View>
          <Animated.View
            style={[
              {
                position: "absolute",
                left: 0,
                top: 0,
                width: INDICATOR_WIDTH,
                height: 5,
                borderRadius: 5,
                overflow: "hidden",
              },
              animatedStyle,
            ]}
          >
            <LinearGradient
              colors={["rgb(32, 65, 233)", "rgb(178, 110, 206)"]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              className="w-full h-full"
            />
          </Animated.View>
        </View>
      </View>
      <View className="pt-12 flex items-center px-5">
        <AppGradient>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/login" as any)}
          >
            <Text className="text-center text-base font-bold text-white font-lato">
              Get started
            </Text>
          </TouchableOpacity>
        </AppGradient>
      </View>
    </View>
  );
}
