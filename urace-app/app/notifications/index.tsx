import {
  GetNotifications,
  MarkAllNotificationsAsRead,
  MarkNotificationAsRead,
} from "@/api/notification/notification";
import NoData from "@/components/ui/no-data";
import { INotification } from "@/types/notification";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import moment from "moment";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { toast } from "sonner-native";

const isAndroid = Platform.OS === "android";

export default function NotificationScreen() {
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await GetNotifications();
      if (res.data) {
        setNotifications(res.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await MarkAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error(error);
      toast.error("Failed to mark all as read");
    }
  };

  const handleNotificationPress = async (notification: INotification) => {
    if (!notification.isRead) {
      try {
        await MarkNotificationAsRead(notification._id);
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notification._id ? { ...n, isRead: true } : n,
          ),
        );
      } catch (error) {
        console.error(error);
      }
    }
    // Logic to navigate if needed, or just expand
    // For now, we just mark as read.
  };

  const renderItem = ({ item }: { item: INotification }) => {
    const isRead = item.isRead;
    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          !isRead && styles.notificationItemUnread,
        ]}
        activeOpacity={0.7}
        onPress={() => handleNotificationPress(item)}
      >
        <View
          style={[styles.iconContainer, !isRead && styles.iconContainerUnread]}
        >
          <Ionicons
            name={isRead ? "notifications-outline" : "notifications"}
            size={24}
            color={isRead ? "#94A3B8" : "#4F46E5"}
          />
        </View>
        <View style={styles.notificationContent}>
          <View style={styles.topRow}>
            <Text style={styles.notificationTime}>
              {moment(item.createdAt).fromNow()}
            </Text>
            {!isRead && <View style={styles.unreadDot} />}
          </View>

          <Text
            style={[
              styles.notificationTitle,
              !isRead && styles.notificationTitleUnread,
            ]}
          >
            {item.title}
          </Text>

          <Text
            style={[
              styles.notificationMessage,
              !isRead && styles.notificationMessageUnread,
            ]}
          >
            {item.message}
          </Text>

          {item.data?.groupName && (
            <View style={styles.groupBadgeContainer}>
              <View style={styles.groupBadge}>
                <Ionicons name="people" size={12} color="#4F46E5" />
                <Text style={styles.groupName}>{item.data.groupName}</Text>
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={["#4F46E5", "#7C3AED", "#9333EA"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Notifications</Text>
            <TouchableOpacity
              onPress={handleMarkAllAsRead}
              style={styles.readAllButton}
            >
              <Ionicons name="checkmark-done-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4F46E5" />
          </View>
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#4F46E5"
                colors={["#4F46E5"]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <NoData
                  title="No notifications yet"
                  content="We'll let you know when something important happens."
                />
              </View>
            }
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingTop: isAndroid ? 40 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
  },
  readAllButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  emptyContainer: {
    marginTop: 40,
  },
  separator: {
    height: 12,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    borderRadius: 20,
    backgroundColor: "white",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: "transparent",
  },
  notificationItemUnread: {
    backgroundColor: "#F0F9FF",
    borderColor: "#E0E7FF",
    shadowColor: "#4F46E5",
    shadowOpacity: 0.08,
    elevation: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    marginTop: 4,
  },
  iconContainerUnread: {
    backgroundColor: "#EEF2FF",
  },
  notificationContent: {
    flex: 1,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "500",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4F46E5",
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  notificationTitleUnread: {
    color: "#0F172A",
    fontWeight: "800",
  },
  notificationMessage: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 22,
    fontWeight: "400",
  },
  notificationMessageUnread: {
    color: "#334155",
    fontWeight: "500",
  },
  groupBadgeContainer: {
    marginTop: 8,
    flexDirection: "row",
  },
  groupBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  groupName: {
    fontSize: 11,
    color: "#4F46E5",
    fontWeight: "600",
  },
});
