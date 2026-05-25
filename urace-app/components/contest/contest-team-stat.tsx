import { GetTeamLeaderboard } from "@/api/contest/contest";
import { ITeamLeaderboard } from "@/types/team";
import { useContestStore } from "@/zustand/contestStore";
import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import LeaderboardTeamCard from "../team/leaderboard-team-card";

export default function ContestTeamStat() {
  const isAndroid = Platform.OS === "android";
  const horizontalPadding = isAndroid ? 12 : 16;

  const [currentMetric, setCurrentMetric] = useState("totalDistance");
  const [leaderboard, setLeaderboard] = useState<ITeamLeaderboard>();
  const [isLoading, setIsLoading] = useState(true);

  const { contestId } = useContestStore();

  const metrics = [
    {
      key: "totalDistance",
      label: "Distance",
      icon: "map-pin",
    },
    {
      key: "averagePace",
      label: "Avg. Pace",
      icon: "zap",
    },
    {
      key: "totalTracklog",
      label: "Track Days",
      icon: "calendar",
    },
  ];

  useEffect(() => {
    setIsLoading(true);
    GetTeamLeaderboard(contestId, currentMetric)
      .then((res) => {
        if (res.data) {
          setLeaderboard(res.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [currentMetric, contestId]);

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          paddingHorizontal: horizontalPadding,
          marginBottom: isAndroid ? 12 : 16,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            backgroundColor: "#F3F4F6",
            borderRadius: isAndroid ? 12 : 14,
            padding: isAndroid ? 4 : 5,
          }}
        >
          {metrics.map((metric) => {
            const isActive = currentMetric === metric.key;
            return (
              <TouchableOpacity
                key={metric.key}
                activeOpacity={0.8}
                onPress={() => setCurrentMetric(metric.key)}
                style={{ flex: 1 }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: isAndroid ? 8 : 10,
                    paddingHorizontal: isAndroid ? 6 : 8,
                    borderRadius: isAndroid ? 10 : 12,
                    backgroundColor: isActive ? "#FFFFFF" : "transparent",
                    shadowColor: isActive ? "#000" : "transparent",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isActive ? 0.08 : 0,
                    shadowRadius: 4,
                    elevation: isActive ? 3 : 0,
                    gap: 4,
                  }}
                >
                  <Feather
                    name={metric.icon as any}
                    size={isAndroid ? 12 : 14}
                    color={isActive ? "#4F6AEE" : "#9CA3AF"}
                  />
                  <Text
                    style={{
                      fontSize: isAndroid ? 11 : 12,
                      fontWeight: isActive ? "600" : "500",
                      color: isActive ? "#4F6AEE" : "#9CA3AF",
                    }}
                    allowFontScaling={false}
                  >
                    {metric.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View
        style={{
          flex: 1,
          backgroundColor: "#FFFFFF",
          borderTopLeftRadius: isAndroid ? 20 : 24,
          borderTopRightRadius: isAndroid ? 20 : 24,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: isAndroid ? 8 : 0,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: horizontalPadding,
            paddingTop: isAndroid ? 16 : 20,
            paddingBottom: isAndroid ? 12 : 16,
            gap: 8,
          }}
        >
          <View
            style={{
              width: isAndroid ? 32 : 36,
              height: isAndroid ? 32 : 36,
              borderRadius: isAndroid ? 8 : 10,
              backgroundColor: "#4F6AEE15",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="award" size={isAndroid ? 14 : 16} color="#4F6AEE" />
          </View>
          <View>
            <Text
              style={{
                fontSize: isAndroid ? 16 : 18,
                fontWeight: "700",
                color: "#1F2937",
              }}
              allowFontScaling={false}
            >
              Team Rankings
            </Text>
            {leaderboard?.teams && leaderboard.teams.length > 0 && (
              <Text
                style={{
                  fontSize: isAndroid ? 11 : 12,
                  color: "#9CA3AF",
                  fontWeight: "500",
                }}
                allowFontScaling={false}
              >
                {leaderboard.teams.length} teams competing
              </Text>
            )}
          </View>
        </View>

        {isLoading ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 60,
            }}
          >
            <ActivityIndicator size="large" color="#4F6AEE" />
            <Text
              style={{
                marginTop: 12,
                fontSize: isAndroid ? 13 : 14,
                color: "#6B7280",
              }}
              allowFontScaling={false}
            >
              Loading rankings...
            </Text>
          </View>
        ) : !leaderboard?.teams || leaderboard.teams.length === 0 ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: isAndroid ? 24 : 32,
              paddingVertical: 60,
            }}
          >
            <View
              style={{
                width: isAndroid ? 80 : 100,
                height: isAndroid ? 80 : 100,
                borderRadius: isAndroid ? 40 : 50,
                backgroundColor: "#F3F4F6",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: isAndroid ? 16 : 20,
              }}
            >
              <Feather
                name="award"
                size={isAndroid ? 32 : 40}
                color="#9CA3AF"
              />
            </View>
            <Text
              style={{
                fontSize: isAndroid ? 16 : 18,
                fontWeight: "600",
                color: "#374151",
                textAlign: "center",
              }}
              allowFontScaling={false}
            >
              No rankings yet
            </Text>
            <Text
              style={{
                fontSize: isAndroid ? 13 : 14,
                color: "#9CA3AF",
                textAlign: "center",
                marginTop: 8,
                lineHeight: isAndroid ? 18 : 20,
              }}
              allowFontScaling={false}
            >
              Teams will appear here once they start recording activities.
            </Text>
          </View>
        ) : (
          <View
            style={{
              paddingHorizontal: horizontalPadding,
              gap: isAndroid ? 10 : 12,
            }}
          >
            {leaderboard.teams.map((team, idx) => (
              <LeaderboardTeamCard
                key={idx}
                rank={team.rank}
                teamName={team.teamName}
                totalDistance={team.totalDistance}
                totalTracklog={team.totalTracklog}
                averagePace={team.averagePace}
                currentMetric={currentMetric}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
