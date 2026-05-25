import { GetUserActivities, SyncUserStravaData } from "@/api/user/user";
import { syncTodayHealthConnect,  openHealthConnectSettings,
 } from "@/api/heath/health-connect";
import ActivityCard from "@/components/activity/activity-card";
import {
  DistanceChart,
  PaceTrendChart,
  TimeStatsChart,
  WorkoutTypeChart,
} from "@/components/activity/charts";
import RunTracker from "@/components/activity/run-tracker";
import NoData from "@/components/ui/no-data";
import { IActivity } from "@/types/activity";
import { useAuthStore } from "@/zustand/authStore";
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/hooks/useTheme";



type ChartType = "distance" | "time" | "pace" | "workout";

interface ChartOption {
  key: ChartType;
  label: string;
  icon: string;
  color: string;
}

export default function Activities() {
  const isAndroid = Platform.OS === "android";
  const horizontalPadding = isAndroid ? 12 : 16;

  const [activities, setActivities] = useState<IActivity[]>([]);
  const { user } = useAuthStore();
  const [isRunTracker, setIsRunTracker] = useState(false);
  const [filterType, setFilterType] = useState<string>("week");
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedChart, setSelectedChart] = useState<ChartType>("distance");

  const [isHealthSyncing, setIsHealthSyncing] = useState(false);


  const { t } = useTranslation();
  const colors = useTheme();


const filterOptions = [
  { key: "day", label: t("activities.today"), icon: "sun" },
  { key: "week", label: t("activities.week"), icon: "calendar" },
  { key: "month", label: t("activities.month"), icon: "grid" },
  { key: "year", label: t("activities.year"), icon: "bar-chart-2" },
];

  const chartOptions: ChartOption[] = [
  { key: "distance", label: t("activities.distance"), icon: "activity", color: "#4F6AEE" },
  { key: "time", label: t("activities.time_stats"), icon: "clock", color: "#F59E0B" },
  { key: "pace", label: t("activities.pace_trend"), icon: "trending-up", color: "#10B981" },
  {
    key: "workout",
    label: t("activities.workout_type"),
    icon: "pie-chart",
    color: "#8B5CF6",
  },
];

  const fetchActivities = useCallback(() => {
    GetUserActivities()
      .then((res) => {
        if (res.data) {
          setActivities(res.data);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleManualSync = useCallback(() => {
    if (!user?.stravaProfile) {
      toast.error(t("activities.connect_strava_first"));
      return;
    }
    setIsSyncing(true);
    SyncUserStravaData()
      .then(() => {
        fetchActivities();
        toast.success(t("activities.sync_success"));
      })
      .catch((err) => {
        console.error(err);
        toast.error(t("activities.sync_failed"), {
          description: t("activities.try_again"),
        });
      })
      .finally(() => {
        setIsSyncing(false);
      });
  }, [user?.stravaProfile, fetchActivities]);


 const handleHealthConnectSync = useCallback(() => {
  setIsHealthSyncing(true);

  syncTodayHealthConnect()
    .then(() => {
      fetchActivities();

      toast.success(
        t("healthConnect.syncSuccess"),
      );
    })
    .catch(async (error) => {
      console.error(error);

      toast.error(
        t("healthConnect.syncFailed"),
        {
          description:
            error?.message ||
            t("common.pleaseTryAgain"),
        },
      );

      if (
        error?.message?.includes(
          "Bạn chưa cấp quyền",
        )
      ) {
        await openHealthConnectSettings();
      }
    })
    .finally(() => {
      setIsHealthSyncing(false);
    });
}, [fetchActivities, t]);

  useEffect(() => {
    // Only sync if user has Strava profile
    if (user?.stravaProfile) {
      setIsSyncing(true);
      SyncUserStravaData()
        .then(() => {
          fetchActivities();
        })
        .catch((err) => console.error(err))
        .finally(() => {
          setIsSyncing(false);
        });
    } else {
      // Still fetch activities even without Strava
      fetchActivities();
    }
  }, [user?.stravaProfile, fetchActivities]);

  const chartData = useMemo(() => {
    if (activities.length === 0) return [];

    switch (filterType) {
      case "day": {
        const hourlyData: {
          value: number;
          label: string;
          frontColor: string;
        }[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const periods = [
          { start: 0, end: 4, label: "0-4" },
          { start: 4, end: 8, label: "4-8" },
          { start: 8, end: 12, label: "8-12" },
          { start: 12, end: 16, label: "12-16" },
          { start: 16, end: 20, label: "16-20" },
          { start: 20, end: 24, label: "20-24" },
        ];

        periods.forEach((period) => {
          let totalDistance = 0;
          activities.forEach((activity) => {
            const activityDate = new Date(activity.startDate);
            if (activityDate >= today && activityDate < tomorrow) {
              const hour = activityDate.getHours();
              if (hour >= period.start && hour < period.end) {
                totalDistance += activity.distance ?? 0;
              }
            }
          });
          hourlyData.push({
            value: totalDistance,
            label: period.label,
            frontColor: totalDistance > 0 ? "#FFFFFF" : "rgba(255,255,255,0.3)",
          });
        });
        return hourlyData;
      }

      case "week": {
        const weekDays = [
          { full: "Mon", short: "Mo" },
          { full: "Tue", short: "Tu" },
          { full: "Wed", short: "We" },
          { full: "Thu", short: "Th" },
          { full: "Fri", short: "Fr" },
          { full: "Sat", short: "Sa" },
          { full: "Sun", short: "Su" },
        ];
        const today = new Date();
        const currentDay = today.getDay();
        const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
        const monday = new Date(today);
        monday.setDate(today.getDate() + mondayOffset);
        monday.setHours(0, 0, 0, 0);
        const nextMonday = new Date(monday);
        nextMonday.setDate(monday.getDate() + 7);

        return weekDays.map((day, index) => {
          let totalDistance = 0;
          activities.forEach((activity) => {
            const activityDate = new Date(activity.startDate);
            if (activityDate >= monday && activityDate < nextMonday) {
              let dayIndex = activityDate.getDay();
              dayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
              if (dayIndex === index) {
                totalDistance += activity.distance ?? 0;
              }
            }
          });
          return {
            value: totalDistance,
            label: day.short,
            frontColor: totalDistance > 0 ? "#FFFFFF" : "rgba(255,255,255,0.3)",
          };
        });
      }

      case "month": {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const weekRanges = [
          { start: 1, end: 7 },
          { start: 8, end: 14 },
          { start: 15, end: 21 },
          { start: 22, end: daysInMonth },
        ];

        return weekRanges.map((range, idx) => {
          let totalDistance = 0;
          activities.forEach((activity) => {
            const activityDate = new Date(activity.startDate);
            if (
              activityDate.getFullYear() === year &&
              activityDate.getMonth() === month
            ) {
              const day = activityDate.getDate();
              if (day >= range.start && day <= range.end) {
                totalDistance += activity.distance ?? 0;
              }
            }
          });

          return {
            value: totalDistance,
            label: `${range.start}-${range.end}`,
            frontColor: totalDistance > 0 ? "#FFFFFF" : "rgba(255,255,255,0.3)",
          };
        });
      }

      case "year": {
        const monthLabels = [
          "J",
          "F",
          "M",
          "A",
          "M",
          "J",
          "J",
          "A",
          "S",
          "O",
          "N",
          "D",
        ];
        const currentYear = new Date().getFullYear();

        return monthLabels.map((label, index) => {
          let totalDistance = 0;
          activities.forEach((activity) => {
            const activityDate = new Date(activity.startDate);
            if (
              activityDate.getFullYear() === currentYear &&
              activityDate.getMonth() === index
            ) {
              totalDistance += activity.distance ?? 0;
            }
          });
          return {
            value: totalDistance,
            label: label,
            frontColor: totalDistance > 0 ? "#FFFFFF" : "rgba(255,255,255,0.3)",
          };
        });
      }

      default:
        return [];
    }
  }, [activities, filterType]);

  const totalStats = useMemo(() => {
    const total = chartData.reduce((sum, d) => sum + d.value, 0);
    const count = chartData.filter((d) => d.value > 0).length;
    const avg = count > 0 ? total / count : 0;
    return { total, count, avg };
  }, [chartData]);

  const filteredActivities = useMemo(() => {
    if (activities.length === 0) return [];

    switch (filterType) {
      case "day": {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return activities.filter((a) => {
          const d = new Date(a.startDate);
          return d >= today && d < tomorrow;
        });
      }
      case "week": {
        const today = new Date();
        const currentDay = today.getDay();
        const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
        const monday = new Date(today);
        monday.setDate(today.getDate() + mondayOffset);
        monday.setHours(0, 0, 0, 0);
        const nextMonday = new Date(monday);
        nextMonday.setDate(monday.getDate() + 7);
        return activities.filter((a) => {
          const d = new Date(a.startDate);
          return d >= monday && d < nextMonday;
        });
      }
      case "month": {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        return activities.filter((a) => {
          const d = new Date(a.startDate);
          return d.getFullYear() === year && d.getMonth() === month;
        });
      }
      case "year": {
        const currentYear = new Date().getFullYear();
        return activities.filter((a) => {
          const d = new Date(a.startDate);
          return d.getFullYear() === currentYear;
        });
      }
      default:
        return activities;
    }
  }, [activities, filterType]);

  const renderSelectedChart = () => {
    switch (selectedChart) {
      case "distance":
        return (
          <DistanceChart
            chartData={chartData}
            totalStats={totalStats}
            filterType={filterType}
          />
        );
      case "time":
        return (
          <TimeStatsChart activities={activities} filterType={filterType} />
        );
      case "pace":
        return (
          <PaceTrendChart activities={activities} filterType={filterType} />
        );
      case "workout":
        return (
          <WorkoutTypeChart activities={activities} filterType={filterType} />
        );
      default:
        return null;
    }
  };

  if (isRunTracker) {
    return <RunTracker onBack={() => setIsRunTracker(false)} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background}}>
<StatusBar barStyle={colors.background === "#000000" ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.background }}>
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
              My Activities
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
              {activities.length} total activities
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TouchableOpacity
              onPress={() => {
                const context = filteredActivities.map((a) => ({
                  startDate: a.startDate,
                  workoutType: a.workoutType,
                  distance: a.distance ?? 0,
                  movingTime: a.movingTime ?? 0,
                  pace: a.pace ?? 0,
                  totalElevationGain: a.totalElevationGain ?? 0,
                }));
                router.push({
                  pathname: "/ask-ai",
                  params: {
                    activitiesContext: JSON.stringify(context),
                    filterType: filterType,
                    userContext: JSON.stringify({
                      height: user?.height,
                      weight: user?.weight,
                    }),
                  },
                });
              }}
              style={{
                width: isAndroid ? 38 : 42,
                height: isAndroid ? 38 : 42,
                borderRadius: isAndroid ? 12 : 14,
                backgroundColor: "#F3E8FF",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#7C3AED",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
              activeOpacity={0.7}
            >
              <FontAwesome5
                name="robot"
                size={isAndroid ? 18 : 20}
                color="#7C3AED"
              />
            </TouchableOpacity>

            <TouchableOpacity
  onPress={handleHealthConnectSync}
  disabled={isHealthSyncing}
  style={{
    width: isAndroid ? 38 : 42,
    height: isAndroid ? 38 : 42,
    borderRadius: isAndroid ? 12 : 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,

    opacity: isHealthSyncing ? 0.6 : 1,

    marginRight: 10,
  }}
  activeOpacity={0.7}
>
  {isHealthSyncing ? (
    <ActivityIndicator
      size="small"
      color="#10B981"
    />
  ) : (
    <Feather
      name="heart"
      size={isAndroid ? 18 : 20}
      color="#10B981"
    />
  )}
</TouchableOpacity>

            {user?.stravaProfile && (
              <TouchableOpacity
                onPress={handleManualSync}
                disabled={isSyncing}
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
                  opacity: isSyncing ? 0.6 : 1,
                }}
                activeOpacity={0.7}
              >
                {isSyncing ? (
                  <ActivityIndicator size="small" color="#4F6AEE" />
                ) : (
                  <Feather
                    name="refresh-cw"
                    size={isAndroid ? 18 : 20}
                    color="#4F6AEE"
                  />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>

      {activities.length === 0 ? (
        <View style={{ flex: 1, paddingHorizontal: horizontalPadding }}>
          {user?.stravaProfile ? (
            <NoData
              title={t("activities.no_data_title")}
              content={t("activities.no_data_desc")}
            />
          ) : (
            <NoData
               title={t("activities.connect_strava_title")}
                content={t("activities.connect_strava_desc")}
                isStravaButton={true}
            />
          )}
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 130 }}
        >
          {/* Time Filter Tabs */}
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
              {filterOptions.map((option) => {
                const isActive = filterType === option.key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    activeOpacity={0.8}
                    onPress={() => setFilterType(option.key)}
                    style={{ flex: 1 }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        paddingVertical: isAndroid ? 10 : 12,
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
                        name={option.icon as any}
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
                        {option.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Chart Selector */}
          <View
            style={{
              paddingHorizontal: horizontalPadding,
              marginBottom: isAndroid ? 16 : 20,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: isAndroid ? 12 : 14,
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
                <Feather
                  name="bar-chart-2"
                  size={isAndroid ? 14 : 16}
                  color="#4F6AEE"
                />
              </View>
              <Text
                style={{
                  fontSize: isAndroid ? 14 : 15,
                  fontWeight: "600",
                  color: "#1F2937",
                }}
                allowFontScaling={false}
              >
                <Text>{t("activities.statistics")}</Text>
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: isAndroid ? 8 : 10 }}
            >
              {chartOptions.map((option) => {
                const isActive = selectedChart === option.key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    activeOpacity={0.8}
                    onPress={() => setSelectedChart(option.key)}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: isAndroid ? 14 : 16,
                        paddingVertical: isAndroid ? 10 : 12,
                        borderRadius: isAndroid ? 12 : 14,
                        backgroundColor: isActive ? option.color : "#FFFFFF",
                        borderWidth: isActive ? 0 : 1,
                        borderColor: "#E5E7EB",
                        gap: 8,
                        shadowColor: isActive ? option.color : "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: isActive ? 0.3 : 0.05,
                        shadowRadius: 4,
                        elevation: isActive ? 4 : 2,
                      }}
                    >
                      <View
                        style={{
                          width: isAndroid ? 28 : 32,
                          height: isAndroid ? 28 : 32,
                          borderRadius: isAndroid ? 8 : 10,
                          backgroundColor: isActive
                            ? "rgba(255, 255, 255, 0.2)"
                            : `${option.color}15`,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Feather
                          name={option.icon as any}
                          size={isAndroid ? 14 : 16}
                          color={isActive ? "#FFFFFF" : option.color}
                        />
                      </View>
                      <Text
                        style={{
                          fontSize: isAndroid ? 12 : 13,
                          fontWeight: "600",
                          color: isActive ? "#FFFFFF" : "#1F2937",
                        }}
                        allowFontScaling={false}
                      >
                        {option.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Selected Chart */}
          <View
            style={{
              marginHorizontal: horizontalPadding,
              marginBottom: isAndroid ? 16 : 20,
            }}
          >
            {renderSelectedChart()}
          </View>

          {/* Recent Activities */}
          <View style={{ paddingHorizontal: horizontalPadding }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: isAndroid ? 12 : 16,
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
                <Feather
                  name="list"
                  size={isAndroid ? 14 : 16}
                  color="#4F6AEE"
                />
              </View>
              <View>
                <Text
                  style={{
                    fontSize: isAndroid ? 14 : 15,
                    fontWeight: "600",
                    color: "#1F2937",
                  }}
                  allowFontScaling={false}
                >
                  <Text>{t("activities.recent")}</Text>
                </Text>
                <Text
                  style={{
                    fontSize: isAndroid ? 11 : 12,
                    color: "#9CA3AF",
                    fontWeight: "500",
                  }}
                  allowFontScaling={false}
                >
                  {filteredActivities.length} activities
                </Text>
              </View>
            </View>

            {filteredActivities.length > 0 ? (
              <View style={{ gap: isAndroid ? 10 : 12 }}>
                {filteredActivities.map((activity, idx) => (
                  <ActivityCard
                    key={idx}
                    workoutType={activity.workoutType}
                    name={activity.name}
                    startDate={activity.startDate}
                    distance={activity.distance ?? 0}
                    movingTime={activity.movingTime ?? 0}
                    pace={activity.pace ?? 0}
                    stravaActivityId={activity.stravaActivityId}
                    recordType={activity.recordType}
                    totalElevationGain={activity.totalElevationGain ?? 0}
                    elevLow={activity.elevLow ?? 0}
                    elevHigh={activity.elevHigh ?? 0}
                    splitsMetric={activity.splitsMetric ?? []}
                  />
                ))}
              </View>
            ) : (
              <View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 40,
                }}
              >
                <View
                  style={{
                    width: isAndroid ? 60 : 70,
                    height: isAndroid ? 60 : 70,
                    borderRadius: isAndroid ? 30 : 35,
                    backgroundColor: "#F3F4F6",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                  }}
                >
                  <Feather
                    name="calendar"
                    size={isAndroid ? 24 : 28}
                    color="#9CA3AF"
                  />
                </View>
                <Text
                  style={{
                    fontSize: isAndroid ? 14 : 15,
                    color: "#6B7280",
                    fontWeight: "500",
                  }}
                  allowFontScaling={false}
                >
                 <Text>{t("activities.no_data_period")}</Text>
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setIsRunTracker(true)}
        style={{
          position: "absolute",
          bottom: isAndroid ? 110 : 120,
          right: horizontalPadding,
          zIndex: 999,
        }}
      >
        <LinearGradient
          colors={["#4F6AEE", "#9B4BE2"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: isAndroid ? 56 : 64,
            height: isAndroid ? 56 : 64,
            borderRadius: isAndroid ? 28 : 32,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#4F6AEE",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Feather name="plus" size={isAndroid ? 24 : 28} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}