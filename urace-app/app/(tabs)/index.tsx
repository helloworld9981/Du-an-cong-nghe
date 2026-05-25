import { GetAllContests } from "@/api/contest/contest";
import LoginStreakPopup from "@/components/ui/login-streak-popup";
import { GetNotifications } from "@/api/notification/notification";
import { GetLoginStreak } from "@/api/user/user";
import DashboardContestCard from "@/components/contest/dashboard-contest-card";
import NoData from "@/components/ui/no-data";
import { dashboardNavigationOptions } from "@/constants/navigation";
import { IDashboardContest } from "@/types/contest";
import { INotification } from "@/types/notification";
import { useAuthStore } from "@/zustand/authStore";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, {
  Circle,
  Defs,
  Stop,
  LinearGradient as SvgLinearGradient,
} from "react-native-svg";

import { useTheme } from "@/hooks/useTheme";


const { width: SCREEN_WIDTH } = Dimensions.get("window");
const isAndroid = Platform.OS === "android";

// Animated Number Component
const AnimatedNumber = ({
  value,
  duration = 1000,
  style,
}: {
  value: number;
  duration?: number;
  style?: any;
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    animatedValue.setValue(0);
    Animated.timing(animatedValue, {
      toValue: value,
      duration,
      useNativeDriver: false,
    }).start();

    const listener = animatedValue.addListener(({ value: v }) => {
      setDisplayValue(Math.floor(v));
    });

    return () => animatedValue.removeListener(listener);
  }, [value]);

  return <Text style={style}>{displayValue}</Text>;
};

// Animated Progress Ring Component
const AnimatedProgressRing = ({
  progress,
  size = 120,
  strokeWidth = 10,
  label,
  subLabel,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  label: string;
  subLabel: string;
}) => {
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const [displayProgress, setDisplayProgress] = useState(0);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    animatedProgress.setValue(0);
    Animated.spring(animatedProgress, {
      toValue: Math.min(progress, 100),
      tension: 20,
      friction: 7,
      useNativeDriver: false,
    }).start();

    const listener = animatedProgress.addListener(({ value }) => {
      setDisplayProgress(Math.floor(value));
    });

    return () => animatedProgress.removeListener(listener);
  }, [progress]);

  const strokeDashoffset =
    circumference - (displayProgress / 100) * circumference;

  return (
    <View style={styles.progressRingContainer}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgLinearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#4F46E5" />
            <Stop offset="50%" stopColor="#7C3AED" />
            <Stop offset="100%" stopColor="#EC4899" />
          </SvgLinearGradient>
        </Defs>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(79, 70, 229, 0.1)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#gradient)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.progressRingContent}>
        <Text style={styles.progressRingValue}>{displayProgress}%</Text>
        <Text style={styles.progressRingLabel}>{label}</Text>
        <Text style={styles.progressRingSubLabel}>{subLabel}</Text>
      </View>
    </View>
  );
};

// Animated Stats Card Component
const AnimatedStatsCard = ({
  icon,
  iconColor,
  bgColor,
  value,
  label,
  delay = 0,
}: {
  icon: string;
  iconColor: string;
  bgColor: string;
  value: number;
  label: string;
  delay?: number;
}) => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.statsCard,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={[bgColor, `${bgColor}99`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.statsCardGradient}
      >
        <View
          style={[
            styles.statsCardIcon,
            { backgroundColor: "rgba(255,255,255,0.3)" },
          ]}
        >
          <Ionicons
            name={icon as any}
            size={isAndroid ? 20 : 24}
            color="white"
          />
        </View>
        <AnimatedNumber
          value={value}
          duration={1500}
          style={styles.statsCardValue}
        />
        <Text style={styles.statsCardLabel}>{label}</Text>
      </LinearGradient>
    </Animated.View>
  );
};

export default function Dashboard() {
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [allContests, setAllContests] = useState<IDashboardContest[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const params = useLocalSearchParams();


  //streak
  const [streak, setStreak] = useState<any>(null);
const [showStreakPopup, setShowStreakPopup] = useState(
  params.skipStreakPopup !== "true",
);
  //theme
  const colors = useTheme();

  // Animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(contentAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const fetchData = useCallback(() => {
    const p1 = GetAllContests()
      .then((res) => {
        if (res.data) {
          setAllContests(res.data);
        }
      })
      .catch((err) => console.error(err));

    const p2 = GetNotifications()
      .then((res) => {
        if (res.data) {
          const count = res.data.filter((n: INotification) => !n.isRead).length;
          setUnreadCount(count);
        }
      })
      .catch((err) => console.error(err));

    const p3 = GetLoginStreak()
  .then((res) => {
    if (res.data.success) {
      setStreak(res.data.data);
    }
  })
  .catch((err) => console.error(err));

    return Promise.all([p1, p2, p3]);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const contestQuantities = useMemo(() => {
    if (allContests.length > 0) {
      const activeCount = allContests.filter(
        (contest) =>
          new Date(contest.endAt) > new Date() &&
          new Date() > new Date(contest.startAt),
      ).length;
      const upcomingCount = allContests.filter(
        (contest) => new Date(contest.startAt) > new Date(),
      ).length;
      return [activeCount, upcomingCount];
    }
    return [0, 0];
  }, [allContests]);

  const totalParticipants = useMemo(() => {
    return allContests.reduce(
      (sum, contest) => sum + (contest.numberOfParticipants || 0),
      0,
    );
  }, [allContests]);

  // Calculate progress (active contests vs total)
  const activeProgress = useMemo(() => {
    if (allContests.length === 0) return 0;
    return Math.round((contestQuantities[0] / allContests.length) * 100);
  }, [allContests, contestQuantities]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getGreetingEmoji = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "☀️";
    if (hour < 18) return "🌤️";
    return "🌙";
  };

  const [activeNavigationTab, setActiveNavigationTab] = useState<number>(0);

  const noDataTitle = useMemo(() => {
    return activeNavigationTab === 0 ? "Ready to compete?" : "Stay tuned!";
  }, [activeNavigationTab]);

  const noDataContent = useMemo(() => {
    return activeNavigationTab === 0
      ? "Join a group and start competing in fitness challenges with friends"
      : "New contests are coming soon. Get ready to challenge yourself!";
  }, [activeNavigationTab]);

  const noDataButtonText = useMemo(() => {
    return activeNavigationTab === 0 ? "Explore groups" : "Check groups";
  }, [activeNavigationTab]);

  const currentContests = useMemo(() => {
    return activeNavigationTab === 0
      ? allContests.filter(
          (contest) =>
            new Date(contest.endAt) > new Date() &&
            new Date() > new Date(contest.startAt),
        )
      : allContests.filter((contest) => new Date(contest.startAt) > new Date());
  }, [allContests, activeNavigationTab]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      <LoginStreakPopup
        visible={!!streak && showStreakPopup}
        streak={streak?.loginStreak || 0}
        onClose={() => setShowStreakPopup(false)}
      />

      {/* Animated Header */}
      <Animated.View style={{ opacity: headerAnim }}>
        <LinearGradient
          colors={["#4F46E5", "#7C3AED", "#9333EA"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          {/* Decorative circles */}
          <View style={[styles.decorCircle, styles.decorCircle1]} />
          <View style={[styles.decorCircle, styles.decorCircle2]} />

          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>
                {getGreeting()} {getGreetingEmoji()}
              </Text>
              <Text style={styles.userName} numberOfLines={1}>
                {user?.displayName || user?.username}
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.notificationBtn}
              onPress={() => router.push("/notifications" as any)}
            >
              <Ionicons
                name="notifications-outline"
                size={isAndroid ? 22 : 24}
                color="white"
              />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Progress Ring Section */}
          <View style={styles.progressSection}>
            <AnimatedProgressRing
              progress={activeProgress}
              size={isAndroid ? 80 : 120}
              strokeWidth={isAndroid ? 6 : 10}
              label="Active"
              subLabel="Contests"
            />
            <View style={styles.progressStats}>
              <View style={styles.progressStatItem}>
                <AnimatedNumber
                  value={contestQuantities[0]}
                  style={styles.progressStatValue}
                />
                <Text style={styles.progressStatLabel}>Active</Text>
              </View>
              <View style={styles.progressStatDivider} />
              <View style={styles.progressStatItem}>
                <AnimatedNumber
                  value={contestQuantities[1]}
                  style={styles.progressStatValue}
                />
                <Text style={styles.progressStatLabel}>Upcoming</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

     
      {/* Stats Cards */}
      <Animated.View
        style={[
          styles.statsContainer,
          { transform: [{ translateY: contentAnim }] },
        ]}
      >
        <AnimatedStatsCard
          icon="trophy"
          iconColor="#4F46E5"
          bgColor="#4F46E5"
          value={allContests.length}
          label="Total Contests"
          delay={100}
        />
        <AnimatedStatsCard
          icon="people"
          iconColor="#EC4899"
          bgColor="#EC4899"
          value={totalParticipants}
          label="Participants"
          delay={200}
        />
        <AnimatedStatsCard
          icon="flash"
          iconColor="#10B981"
          bgColor="#10B981"
          value={contestQuantities[0]}
          label="In Progress"
          delay={300}
        />
      </Animated.View>

      {/* Navigation Tabs */}
      <View style={styles.navContainer}>
        <View style={styles.navTabs}>
          {dashboardNavigationOptions.map((opt, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.navTab}
              activeOpacity={0.8}
              onPress={() => setActiveNavigationTab(opt.value)}
            >
              <Animated.View
                style={[
                  styles.navTabInner,
                  activeNavigationTab === opt.value && styles.navTabActive,
                ]}
              >
                <Text
                  style={[
                    styles.navTabText,
                    activeNavigationTab === opt.value &&
                      styles.navTabTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
                <View
                  style={[
                    styles.navTabBadge,
                    activeNavigationTab === opt.value &&
                      styles.navTabBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.navTabBadgeText,
                      activeNavigationTab === opt.value &&
                        styles.navTabBadgeTextActive,
                    ]}
                  >
                    {contestQuantities[idx]}
                  </Text>
                </View>
              </Animated.View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        <View style={styles.contentHeader}>
          <Text style={styles.contentTitle}>
            {activeNavigationTab === 0
              ? "Active Contests"
              : "Upcoming Contests"}
          </Text>
          <Text style={styles.contentCount}>
            {currentContests.length} contest
            {currentContests.length !== 1 ? "s" : ""}
          </Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#4F46E5"
              colors={["#4F46E5", "#7C3AED"]}
            />
          }
        >
          {currentContests.length === 0 ? (
            <View style={styles.noDataContainer}>
              <NoData
                title={noDataTitle}
                content={noDataContent}
                buttonText={noDataButtonText}
                handleSubmit={() => router.push("/(tabs)/group")}
              />
            </View>
          ) : (
            <View style={styles.contestsList}>
              {currentContests.map((contest, idx) => (
                <TouchableOpacity
                  key={contest._id || idx}
                  activeOpacity={0.9}
                  onPress={() =>
                    router.push(
                      `/(tabs)/group/${contest.groupId}/contest/${contest._id}`,
                    )
                  }
                >
                  <DashboardContestCard
                    name={contest.name}
                    startAt={contest.startAt}
                    endAt={contest.endAt}
                    activityType={contest.activityType}
                    type={contest.contestType}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    paddingTop: isAndroid ? 45 : 55,
    paddingBottom: isAndroid ? 24 : 32,
    paddingHorizontal: isAndroid ? 16 : 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: "hidden",
  },
  decorCircle: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  decorCircle1: {
    width: 200,
    height: 200,
    top: -50,
    right: -50,
  },
  decorCircle2: {
    width: 150,
    height: 150,
    bottom: -30,
    left: -30,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: isAndroid ? 13 : 14,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },
  userName: {
    fontSize: isAndroid ? 22 : 26,
    color: "white",
    fontWeight: "700",
    marginTop: 4,
  },
  notificationBtn: {
    width: isAndroid ? 44 : 48,
    height: isAndroid ? 44 : 48,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  notificationBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
    borderColor: "#4F46E5",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  notificationBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "white",
    textAlign: "center",
  },
  progressSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: isAndroid ? 20 : 28,
    paddingHorizontal: isAndroid ? 8 : 16,
  },
  progressRingContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  progressRingContent: {
    position: "absolute",
    alignItems: "center",
  },
  progressRingValue: {
    fontSize: isAndroid ? 16 : 26,
    fontWeight: "800",
    color: "white",
  },
  progressRingLabel: {
    fontSize: isAndroid ? 9 : 12,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "600",
    marginTop: 1,
  },
  progressRingSubLabel: {
    fontSize: isAndroid ? 7 : 10,
    color: "rgba(255, 255, 255, 0.7)",
  },
  progressStats: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    paddingVertical: isAndroid ? 10 : 16,
    paddingHorizontal: isAndroid ? 14 : 28,
  },
  progressStatItem: {
    alignItems: "center",
    paddingHorizontal: isAndroid ? 8 : 16,
  },
  progressStatValue: {
    fontSize: isAndroid ? 22 : 32,
    fontWeight: "800",
    color: "white",
  },
  progressStatLabel: {
    fontSize: isAndroid ? 11 : 12,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
    marginTop: 4,
  },
  progressStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: isAndroid ? 12 : 16,
    marginTop: isAndroid ? -16 : -20,
    gap: isAndroid ? 8 : 12,
  },
  statsCard: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  statsCardGradient: {
    padding: isAndroid ? 14 : 18,
    alignItems: "center",
  },
  statsCardIcon: {
    width: isAndroid ? 36 : 44,
    height: isAndroid ? 36 : 44,
    borderRadius: isAndroid ? 12 : 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: isAndroid ? 8 : 12,
  },
  statsCardValue: {
    fontSize: isAndroid ? 22 : 26,
    fontWeight: "800",
    color: "white",
  },
  statsCardLabel: {
    fontSize: isAndroid ? 10 : 11,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
  },
  navContainer: {
    paddingHorizontal: isAndroid ? 12 : 16,
    marginTop: isAndroid ? 16 : 20,
  },
  navTabs: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    borderRadius: 16,
    padding: 4,
  },
  navTab: {
    flex: 1,
  },
  navTabInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: isAndroid ? 10 : 12,
    paddingHorizontal: isAndroid ? 8 : 12,
    borderRadius: 12,
  },
  navTabActive: {
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  navTabText: {
    fontSize: isAndroid ? 12 : 13,
    fontWeight: "600",
    color: "#94A3B8",
  },
  navTabTextActive: {
    color: "#4F46E5",
  },
  navTabBadge: {
    marginLeft: 6,
    paddingHorizontal: isAndroid ? 6 : 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: "#CBD5E1",
  },
  navTabBadgeActive: {
    backgroundColor: "#4F46E5",
  },
  navTabBadgeText: {
    fontSize: isAndroid ? 10 : 11,
    fontWeight: "700",
    color: "#64748B",
  },
  navTabBadgeTextActive: {
    color: "white",
  },
  contentContainer: {
    flex: 1,
    marginTop: isAndroid ? 12 : 16,
  },
  contentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: isAndroid ? 16 : 20,
    marginBottom: isAndroid ? 8 : 12,
  },
  contentTitle: {
    fontSize: isAndroid ? 16 : 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  contentCount: {
    fontSize: isAndroid ? 12 : 13,
    fontWeight: "500",
    color: "#94A3B8",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: isAndroid ? 12 : 16,
    paddingBottom: 120,
  },
  noDataContainer: {
    marginTop: 20,
  },
  contestsList: {
    gap: isAndroid ? 10 : 12,
  },
});
