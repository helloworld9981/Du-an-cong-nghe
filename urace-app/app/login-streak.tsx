import { GetLoginStreak } from "@/api/user/user";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";

const isAndroid = Platform.OS === "android";

export default function LoginStreakScreen() {
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState<any>(null);

  useEffect(() => {
    const loadStreak = async () => {
      try {
        const res = await GetLoginStreak();
        if (res.data.success) {
          setStreak(res.data.data);
        }
      } catch (error) {
        console.log("Get login streak error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStreak();
  }, []);

  const markedDates = useMemo(() => {
    const dates = streak?.loginDates || [];
    const marked: any = {};

    dates.forEach((date: string) => {
      marked[date] = {
        selected: true,
        selectedColor: "#F97316",
        selectedTextColor: "white",
      };
    });

    return marked;
  }, [streak]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#FFF7ED",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#FFF7ED" }}>
      <LinearGradient
        colors={["#F97316", "#EA580C"]}
        style={{
          paddingTop: isAndroid ? 48 : 64,
          paddingHorizontal: 20,
          paddingBottom: 28,
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
        }}
      >
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)?skipStreakPopup=true")}
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: "rgba(255,255,255,0.18)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="arrow-back" size={22} color="white" />
        </TouchableOpacity>

        <Text
          style={{
            marginTop: 22,
            fontSize: 30,
            fontWeight: "900",
            color: "white",
          }}
        >
          Login Streak
        </Text>

        <Text
          style={{
            marginTop: 6,
            color: "rgba(255,255,255,0.9)",
            fontSize: 15,
            fontWeight: "600",
          }}
        >
          Theo dõi chuỗi đăng nhập mỗi ngày của bạn
        </Text>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 18,
          paddingBottom: 40,
        }}
      >
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 28,
            padding: 18,
            marginTop: -8,
            elevation: 6,
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
          }}
        >
          <View
            style={{
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 52 }}>🔥</Text>

            <Text
              style={{
                fontSize: 34,
                fontWeight: "900",
                color: "#F97316",
                marginTop: 4,
              }}
            >
              {streak?.loginStreak || 0}
            </Text>

            <Text
              style={{
                color: "#64748B",
                fontWeight: "700",
                marginTop: 2,
              }}
            >
              ngày liên tiếp
            </Text>
          </View>

          <Calendar
            markedDates={markedDates}
            theme={{
              backgroundColor: "white",
              calendarBackground: "white",
              todayTextColor: "#F97316",
              arrowColor: "#F97316",
              monthTextColor: "#F97316",
              textMonthFontWeight: "900",
              textDayFontWeight: "600",
              textDayHeaderFontWeight: "800",
              textSectionTitleColor: "#94A3B8",
              selectedDayBackgroundColor: "#F97316",
              selectedDayTextColor: "white",
            }}
          />

          <View
            style={{
              flexDirection: "row",
              borderTopWidth: 1,
              borderTopColor: "#FED7AA",
              marginTop: 16,
              paddingTop: 16,
            }}
          >
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "900",
                  color: "#F97316",
                }}
              >
                {streak?.loginStreak || 0}
              </Text>
              <Text style={{ color: "#64748B", marginTop: 4 }}>
                Current
              </Text>
            </View>

            <View
              style={{
                width: 1,
                backgroundColor: "#FED7AA",
              }}
            />

            <View style={{ flex: 1, alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "900",
                  color: "#EA580C",
                }}
              >
                {streak?.longestLoginStreak || 0}
              </Text>
              <Text style={{ color: "#64748B", marginTop: 4 }}>
                Best
              </Text>
            </View>

            <View
              style={{
                width: 1,
                backgroundColor: "#FED7AA",
              }}
            />

            <View style={{ flex: 1, alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "900",
                  color: "#C2410C",
                }}
              >
                {streak?.loginDates?.length || 0}
              </Text>
              <Text style={{ color: "#64748B", marginTop: 4 }}>
                Total
              </Text>
            </View>
          </View>
        </View>

        <View
          style={{
            marginTop: 18,
            backgroundColor: "white",
            borderRadius: 24,
            padding: 18,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "900",
              color: "#1E293B",
              marginBottom: 12,
            }}
          >
            Daily challenge
          </Text>

          <View
            style={{
              gap: 12,
            }}
          >
            {[
              "Đăng nhập hôm nay",
              "Duy trì chuỗi liên tiếp",
              "Quay lại vào ngày mai",
            ].map((item, index) => (
              <View
                key={item}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "#FFF7ED",
                  borderRadius: 16,
                  padding: 14,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={{ fontSize: 20, marginRight: 10 }}>
                    {index === 0 ? "🔥" : index === 1 ? "⚡" : "🎯"}
                  </Text>
                  <Text
                    style={{
                      fontWeight: "700",
                      color: "#334155",
                    }}
                  >
                    {item}
                  </Text>
                </View>

                <View
                  style={{
                    backgroundColor: "#F97316",
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 999,
                  }}
                >
                  <Text
                    style={{
                      color: "white",
                      fontSize: 12,
                      fontWeight: "800",
                    }}
                  >
                    Done
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}