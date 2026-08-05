// app/(tabs)/alerts.tsx
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  useNotificationStore,
  type Notification,
} from "@/stores/notificationStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale } from "react-native-size-matters";

export default function AlertsScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const router = useRouter();

  // NO CHANGES: Connect to notification store, plus the new clearAllNotifications action
  const {
    notifications,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
  } = useNotificationStore();

  const onRefresh = useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // NO CHANGES: Load notifications when screen mounts/focuses
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // NEW ADDITION: Clearing alerts is destructive and cannot be undone from the UI,
  // so confirm first. This is a small persuasive-UX safety net, it protects the
  // farmer from accidentally losing alerts they may still want to act on.
  const handleClearAll = useCallback(() => {
    Alert.alert(
      "Clear all alerts?",
      "This will permanently remove all your alerts. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear all",
          style: "destructive",
          onPress: () => clearAllNotifications(),
        },
      ],
    );
  }, [clearAllNotifications]);

  const renderNotification = ({ item }: { item: Notification }) => {
    const isHighPriority = item.priority === "HIGH";

    return (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          {
            backgroundColor: theme.surface,
            borderLeftColor: isHighPriority ? "#EF4444" : theme.primary,
          },
        ]}
        onPress={() => {
          markAsRead(item.id);
          if (item.actionLink) {
            router.push(item.actionLink as any);
          }
        }}
        disabled={loading} // disable when loading
      >
        <View style={styles.cardHeader}>
          <Ionicons
            name={isHighPriority ? "warning" : "information-circle-outline"}
            size={moderateScale(22)}
            color={isHighPriority ? "#EF4444" : theme.primary}
          />
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: theme.text }]}>
              {item.title}
            </Text>
            <Text style={[styles.time, { color: theme.icon }]}>
              {new Date(item.sentAt).toLocaleDateString()}
            </Text>
          </View>
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>

        <Text style={[styles.message, { color: theme.text }]}>
          {item.message}
        </Text>

        {/* UPDATED: "Take action ->" text removed per request. The card itself
            still marks the alert read and follows item.actionLink on tap,
            only the visible link text was taken out. */}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.screenTitle, { color: theme.primary }]}>
          Alerts
        </Text>

        {/* UPDATED: wrapped both header actions in a row so "Mark all read"
            and the new "Clear all" button sit side by side */}
        {notifications.length > 0 && (
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={markAllAsRead}
              disabled={loading}
              style={styles.markAllButton}
            >
              <Text
                style={{
                  color: loading ? theme.icon : theme.primary,
                  fontWeight: "600",
                }}
              >
                Mark all read
              </Text>
            </TouchableOpacity>

            {/* NEW ADDITION: Clear all button, disabled during any loading state
                so the user can't fire overlapping requests */}
            <TouchableOpacity
              onPress={handleClearAll}
              disabled={loading}
              style={styles.clearAllButton}
            >
              <Text
                style={{
                  color: loading ? theme.icon : "#EF4444",
                  fontWeight: "600",
                }}
              >
                Clear all
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name="notifications-outline"
              size={moderateScale(48)}
              color={theme.icon}
            />
            <Text style={[styles.emptyText, { color: theme.text }]}>
              No alerts yet
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.icon }]}>
              Daily farm updates will appear here
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // NO CHANGES to existing base styles - only extended
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(12),
  },
  screenTitle: {
    fontSize: moderateScale(24),
    fontWeight: "700",
  },
  // NEW ADDITION: groups the two header buttons so they sit next to each other
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  markAllButton: {
    padding: moderateScale(8),
  },
  // NEW ADDITION: small left margin so "Clear all" doesn't sit flush against "Mark all read"
  clearAllButton: {
    padding: moderateScale(8),
    marginLeft: moderateScale(4),
  },
  listContent: {
    paddingHorizontal: moderateScale(16),
    paddingBottom: moderateScale(100),
  },
  notificationCard: {
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: moderateScale(12),
    borderLeftWidth: moderateScale(4),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: moderateScale(8),
  },
  titleContainer: {
    flex: 1,
    marginLeft: moderateScale(12),
  },
  title: {
    fontSize: moderateScale(15),
    fontWeight: "600",
  },
  time: {
    fontSize: moderateScale(12),
    marginTop: moderateScale(2),
  },
  unreadDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: "#EF4444",
    marginTop: moderateScale(4),
  },
  message: {
    fontSize: moderateScale(14),
    lineHeight: moderateScale(20),
    marginBottom: moderateScale(8),
  },
  // NOTE: actionLink style kept in case you want the link back later,
  // it's just no longer referenced in renderNotification above.
  actionLink: {
    fontSize: moderateScale(13),
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: moderateScale(100),
  },
  emptyText: {
    fontSize: moderateScale(18),
    fontWeight: "600",
    marginTop: moderateScale(16),
  },
  emptySubtext: {
    fontSize: moderateScale(14),
    textAlign: "center",
    marginTop: moderateScale(8),
  },
});
