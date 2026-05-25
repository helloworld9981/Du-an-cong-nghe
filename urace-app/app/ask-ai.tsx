import GeminiService, { ChatMessage, GeminiModel } from "@/api/ai/gemini";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import Markdown from "react-native-markdown-display";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { toast } from "sonner-native";

export default function AskAIScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [models, setModels] = useState<GeminiModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  // Parse activity context
  const activityContext = params.activityContext
    ? JSON.parse(params.activityContext as string)
    : null;

  const activitiesContext = params.activitiesContext
    ? JSON.parse(params.activitiesContext as string)
    : null;
  const userContext = params.userContext
    ? JSON.parse(params.userContext as string)
    : null;
  const filterType = (params.filterType as string) || "week";

  const getFuturePeriodLabel = () => {
    switch (filterType) {
      case "day":
        return "the next few days";
      case "week":
        return "next week";
      case "month":
        return "next month";
      case "year":
        return "next year";
      default:
        return "the future";
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  useEffect(() => {
    if (messages.length > 0) return;

    if (activityContext) {
      const systemMessage: ChatMessage = {
        role: "user",
        parts: [
          {
            text: `You are an expert endurance sports coach and analyst.
            I have just finished a workout and I want you to analyze it or answer my questions.
            
            WORKOUT DETAILS:
            - Name: ${activityContext.name}
            - Type: ${activityContext.workoutType}
            - Distance: ${activityContext.distance} km
            - Duration: ${formatTime(activityContext.movingTime)}
            - Pace: ${activityContext.pace.toFixed(2)} min/km
            - Date: ${new Date(activityContext.startDate).toDateString()}
            ${
              activityContext.totalElevationGain
                ? `- Elevation Gain: ${activityContext.totalElevationGain}m (Low: ${activityContext.elevLow}m, High: ${activityContext.elevHigh}m)`
                : ""
            }
            ${
              activityContext.splitsMetric &&
              activityContext.splitsMetric.length > 0
                ? `- Splits data: ${JSON.stringify(activityContext.splitsMetric)}`
                : ""
            }
            
            Please be concise, encouraging, and provide specific insights based on these numbers.
            If split data is available, please analyze the pace strategy.
            If elevation data is available, analyze the difficulty. 
            If I ask for advice, give actionable tips.`,
          },
        ],
      };
      setMessages([systemMessage]);
    } else if (activitiesContext) {
      const activitiesSummary = activitiesContext
        .slice(0, 30)
        .map(
          (a: any) =>
            `- [${new Date(a.startDate).toLocaleDateString()}] ${a.workoutType}: ${a.distance}km in ${formatTime(a.movingTime)} (${a.pace.toFixed(2)} min/km)`,
        )
        .join("\n");

      let userProfileText = "";
      if (userContext && (userContext.height || userContext.weight)) {
        userProfileText = `
            USER PROFILE:
            ${userContext.height ? `- Height: ${userContext.height} cm` : ""}
            ${userContext.weight ? `- Weight: ${userContext.weight} kg` : ""}
            `;
      }

      const systemMessage: ChatMessage = {
        role: "user",
        parts: [
          {
            text: `You are an expert endurance sports coach.
            I want you to analyze my recent activity history.
            
            CONTEXT: The user is viewing activities filtered by '${filterType}'.
            ${userProfileText}
            RECENT ACTIVITIES (Last ${activitiesContext.length}):
            ${activitiesSummary}
            
            Look for trends in my volume, consistency, and pace.
            Identify my strengths and weaknesses based on this data.
            Provide actionable advice specifically for ${getFuturePeriodLabel()} based on my recent performance.`,
          },
        ],
      };
      setMessages([systemMessage]);
    }
  }, [activityContext, activitiesContext, filterType, userContext]);

  const fetchModels = async () => {
    try {
      const availableModels = await GeminiService.getAvailableModels();
      setModels(availableModels);
      if (availableModels.length > 0) {
        const preferred =
          availableModels.find((m) => m.name.includes("flash")) ||
          availableModels[0];
        setSelectedModel(preferred.name);
      }
    } catch (error) {
      toast.error("Failed to load Gemini models. Check API Key.");
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const handleSend = async () => {
    if (!input.trim() || !selectedModel) return;

    const userMsg: ChatMessage = {
      role: "user",
      parts: [{ text: input.trim() }],
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    setIsLoading(true);

    try {
      const responseText = await GeminiService.chatWithModel(
        selectedModel,
        newHistory,
      );

      const aiMsg: ChatMessage = {
        role: "model",
        parts: [{ text: responseText }],
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      toast.error("Failed to assume response from AI.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (
    type: "fraud" | "advice" | "analyze_list" | "advice_list",
  ) => {
    if (!selectedModel || isLoading) return;

    let prompt = "";
    const hasUserMetrics =
      userContext && (userContext.height || userContext.weight);

    if (type === "fraud") {
      prompt =
        "Analyze this workout for potential fraud or GPS errors. Look at the pace, distance, and time consistency. Is this Humanly possible?";
    } else if (type === "analyze_list") {
      prompt =
        "Based on my activity history, what are my biggest strengths and weaknesses? Be specific about my consistency, volume, and intensity.";
      if (hasUserMetrics) {
        prompt +=
          " Also analyze how my body metrics (height/weight) might affect my performance.";
      }
    } else if (type === "advice_list") {
      prompt = `Based on my recent activities, give me 3 prioritized tips to improve my performance for ${getFuturePeriodLabel()}.`;
      if (hasUserMetrics) {
        prompt +=
          " Please include specific advice relevant to my height and weight.";
      }
    } else {
      prompt =
        "Based on this workout data, give me a brief performance review and 3 actionable tips to improve my fitness and speed.";
      if (hasUserMetrics) {
        prompt += " Consider my height and weight in your analysis.";
      }
    }

    const userMsg: ChatMessage = {
      role: "user",
      parts: [{ text: prompt }],
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setIsLoading(true);

    GeminiService.chatWithModel(selectedModel, newHistory)
      .then((responseText) => {
        const aiMsg: ChatMessage = {
          role: "model",
          parts: [{ text: responseText }],
        };
        setMessages((prev) => [...prev, aiMsg]);
      })
      .catch((error) => {
        toast.error("Failed to get response.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const renderMessage = ({
    item,
    index,
  }: {
    item: ChatMessage;
    index: number;
  }) => {
    if (index === 0 && item.parts[0].text.includes("You are an expert")) {
      return null;
    }

    const isUser = item.role === "user";

    return (
      <View
        style={{
          alignSelf: isUser ? "flex-end" : "flex-start",
          maxWidth: "80%",
          marginVertical: 4,
          marginHorizontal: 16,
        }}
      >
        <LinearGradient
          colors={isUser ? ["#7C3AED", "#6D28D9"] : ["#F3F4F6", "#F3F4F6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            padding: 12,
            paddingHorizontal: 16,
            borderRadius: 20,
            borderBottomRightRadius: isUser ? 4 : 20,
            borderBottomLeftRadius: isUser ? 20 : 4,
          }}
        >
          {isUser ? (
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 15,
                lineHeight: 22,
              }}
            >
              {item.parts[0].text}
            </Text>
          ) : (
            <Markdown
              style={{
                body: { color: "#1F2937", fontSize: 15, lineHeight: 22 },
                strong: { fontWeight: "bold", color: "#111827" },
                paragraph: { marginVertical: 0, marginBottom: 8 },
                bullet_list: { marginBottom: 8 },
                list_item: { marginBottom: 4 },
              }}
            >
              {item.parts[0].text}
            </Markdown>
          )}
        </LinearGradient>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {/* Header */}
      <SafeAreaView
        edges={["top"]}
        style={{ backgroundColor: "#FFFFFF", zIndex: 10 }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: "#F3F4F6",
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#F3F4F6",
              borderRadius: 20,
              marginRight: 12,
            }}
          >
            <Feather name="arrow-left" size={24} color="#1F2937" />
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#1F2937" }}>
              Ask AI Coach
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: "#10B981",
                  marginRight: 6,
                }}
              />
              <Text style={{ fontSize: 12, color: "#6B7280" }}>
                {models.length > 0
                  ? selectedModel?.replace("models/", "")
                  : "Connecting..."}
              </Text>
            </View>
          </View>

          {/* Model Selector Toggle (Simple impl) */}
          <Pressable onPress={() => fetchModels()} style={{ padding: 8 }}>
            <Ionicons name="sparkles" size={20} color="#7C3AED" />
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Chat Area */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderMessage}
        contentContainerStyle={{ paddingVertical: 16 }}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={{ padding: 32, alignItems: "center", opacity: 0.5 }}>
            <Ionicons name="chatbubbles-outline" size={48} color="#9CA3AF" />
            <Text
              style={{ marginTop: 16, textAlign: "center", color: "#6B7280" }}
            >
              Ask specific questions about this workout!{"\n"}
              "How can I improve my pace?"{"\n"}
              "Was this a good heart rate zone?"
            </Text>
          </View>
        }
      />

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: "#F3F4F6",
            backgroundColor: "#FFFFFF",
            paddingBottom: insets.bottom + 16,
          }}
        >
          {/* Quick Actions */}
          {messages.length <= 1 && (
            <View style={{ flexDirection: "row", padding: 12, gap: 8 }}>
              <Pressable
                onPress={() =>
                  handleQuickPrompt(
                    activitiesContext ? "analyze_list" : "fraud",
                  )
                }
                style={{
                  flex: 1,
                  backgroundColor: "#FEF2F2",
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "#FECACA",
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Feather
                  name={activitiesContext ? "bar-chart-2" : "alert-triangle"}
                  size={16}
                  color="#DC2626"
                />
                <Text
                  style={{ fontSize: 13, fontWeight: "600", color: "#DC2626" }}
                >
                  {activitiesContext ? "Strengths & Weaknesses" : "Check Fraud"}
                </Text>
              </Pressable>

              <Pressable
                onPress={() =>
                  handleQuickPrompt(
                    activitiesContext ? "advice_list" : "advice",
                  )
                }
                style={{
                  flex: 1,
                  backgroundColor: "#ECFDF5",
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "#A7F3D0",
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Feather name="trending-up" size={16} color="#059669" />
                <Text
                  style={{ fontSize: 13, fontWeight: "600", color: "#059669" }}
                >
                  Get Advice
                </Text>
              </Pressable>
            </View>
          )}

          {messages.length <= 1 &&
            activitiesContext &&
            // Additional Quick Actions for List Context could go here if needed,
            // but reusing the existing slots is cleaner.
            null}

          <View
            style={{
              paddingHorizontal: 16,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#F9FAFB",
                borderRadius: 24,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                paddingHorizontal: 16,
                paddingVertical: Platform.OS === "ios" ? 12 : 4,
              }}
            >
              <TextInput
                style={{
                  flex: 1,
                  fontSize: 16,
                  maxHeight: 100,
                  color: "#1F2937",
                  paddingVertical: 8,
                }}
                placeholder="Ask anything..."
                placeholderTextColor="#9CA3AF"
                multiline
                value={input}
                onChangeText={setInput}
              />

              {isLoading ? (
                <ActivityIndicator color="#7C3AED" style={{ marginLeft: 8 }} />
              ) : (
                <Pressable
                  onPress={handleSend}
                  disabled={!input.trim()}
                  style={{
                    marginLeft: 8,
                    opacity: input.trim() ? 1 : 0.5,
                    backgroundColor: input.trim() ? "#7C3AED" : "transparent",
                    width: 36,
                    height: 36,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 18,
                  }}
                >
                  <Feather
                    name="arrow-up"
                    size={20}
                    color={input.trim() ? "#FFF" : "#9CA3AF"}
                  />
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
