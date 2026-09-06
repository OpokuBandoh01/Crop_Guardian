// app/connections.tsx

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useCommunityStore } from "@/stores/communityStore";
import { useAuthStore } from "@/stores/authStore";
import type { ConnectionUser } from "@/types/community";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";

type TabKey = "followers" | "following";

export default function ConnectionsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const params = useLocalSearchParams<{ tab?: string }>();

  // initial tab from route param
  const initialTab: TabKey =
    params.tab === "following" ? "following" : "followers";
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  const userId = useAuthStore((s) => s.user?.id);

  const {
    followers,
    followersLoading,
    followersRefreshing,
    followersLoadingMore,
    followersError,
    followingList,
    followingListLoading,
    followingListRefreshing,
    followingListLoadingMore,
    followingListError,
    followingUserIds,
    followLoadingUserIds,
    fetchFollowersList,
    refreshFollowersList,
    loadMoreFollowers,
    fetchFollowingList,
    refreshFollowingList,
    loadMoreFollowing,
    toggleFollow,
  } = useCommunityStore();

  // load both lists when we know the user id
  useEffect(() => {
    if (!userId) return;
    fetchFollowersList(userId, { reset: true });
    fetchFollowingList(userId, { reset: true });
  }, [userId, fetchFollowersList, fetchFollowingList]);

  const data = activeTab === "followers" ? followers : followingList;
  const loading =
    activeTab === "followers" ? followersLoading : followingListLoading;
  const refreshing =
    activeTab === "followers" ? followersRefreshing : followingListRefreshing;
  const loadingMore =
    activeTab === "followers" ? followersLoadingMore : followingListLoadingMore;
  const error = activeTab === "followers" ? followersError : followingListError;

  const onRefresh = useCallback(() => {
    if (!userId) return;
    if (activeTab === "followers") refreshFollowersList(userId);
    else refreshFollowingList(userId);
  }, [userId, activeTab, refreshFollowersList, refreshFollowingList]);

  const onEndReached = useCallback(() => {
    if (!userId) return;
    if (activeTab === "followers") loadMoreFollowers(userId);
    else loadMoreFollowing(userId);
  }, [userId, activeTab, loadMoreFollowers, loadMoreFollowing]);

  const emptyMessage = useMemo(() => {
    if (error) return error;
    return activeTab === "followers"
      ? "No followers yet"
      : "Not following anyone yet";
  }, [activeTab, error]);

  // connection row (tap does nothing for now)
  const renderRow = ({ item }: { item: ConnectionUser }) => {
    const isFollowing = followingUserIds[item.id] ?? item.isFollowing ?? false;
    const busy = Boolean(followLoadingUserIds[item.id]);

    return (
      <View
        style={[
          styles.row,
          {
            backgroundColor: theme.surface,
            borderColor: theme.inputBorder,
            opacity: busy ? 0.7 : 1,
          },
        ]}
      >
        <View style={styles.rowLeft}>
          {item.avatarUrl ? (
            <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
          ) : (
            <View
              style={[
                styles.avatarPlaceholder,
                {
                  backgroundColor:
                    colorScheme === "light" ? "#EBF7E9" : "#1E2C20",
                },
              ]}
            >
              <Text style={[styles.avatarInitial, { color: theme.primary }]}>
                {(item.fullName || "?").charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.nameBlock}>
            <Text
              style={[styles.name, { color: theme.text }]}
              numberOfLines={1}
            >
              {item.fullName}
            </Text>
            <View style={styles.repRow}>
              <Ionicons
                name="star"
                size={moderateScale(11)}
                color={theme.primary}
              />
              <Text style={[styles.repText, { color: theme.icon }]}>
                {item.reputationScore}
              </Text>
            </View>
          </View>
        </View>

        {/* Do not show follow button for yourself */}
        {userId !== item.id && (
          <TouchableOpacity
            style={[
              styles.followBtn,
              isFollowing
                ? {
                    backgroundColor: "transparent",
                    borderWidth: 1,
                    borderColor: theme.inputBorder,
                  }
                : { backgroundColor: theme.primary },
              busy && { opacity: 0.5 },
            ]}
            onPress={() => toggleFollow(item.id)}
            disabled={busy}
            activeOpacity={0.8}
          >
            {busy ? (
              <ActivityIndicator
                size="small"
                color={isFollowing ? theme.primary : "#FFFFFF"}
              />
            ) : (
              <Text
                style={[
                  styles.followBtnText,
                  {
                    color: isFollowing ? theme.text : "#FFFFFF",
                  },
                ]}
              >
                {isFollowing ? "Following" : "Follow"}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.background }]}
      edges={["top", "left", "right"]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back"
            size={moderateScale(22)}
            color={theme.primary}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.primary }]}>
          Connections
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* tabs */}
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: theme.surface,
            borderColor: theme.inputBorder,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "followers" && {
              backgroundColor: theme.primary,
            },
          ]}
          onPress={() => setActiveTab("followers")}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === "followers" ? "#FFFFFF" : theme.text,
              },
            ]}
          >
            Followers
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "following" && {
              backgroundColor: theme.primary,
            },
          ]}
          onPress={() => setActiveTab("following")}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === "following" ? "#FFFFFF" : theme.text,
              },
            ]}
          >
            Following
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderRow}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyBox}>
              <Ionicons
                name="people-outline"
                size={moderateScale(36)}
                color={theme.icon}
              />
              <Text style={[styles.emptyText, { color: theme.icon }]}>
                {emptyMessage}
              </Text>
            </View>
          ) : (
            <ActivityIndicator
              style={{ marginTop: 40 }}
              color={theme.primary}
            />
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator
              style={{ marginVertical: 16 }}
              color={theme.primary}
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
  },
  backBtn: { padding: scale(6) },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: moderateScale(17),
    fontWeight: "700",
  },
  headerSpacer: { width: moderateScale(34) },
  tabBar: {
    flexDirection: "row",
    marginHorizontal: scale(16),
    marginBottom: verticalScale(12),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    padding: scale(4),
    gap: scale(4),
  },
  tab: {
    flex: 1,
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(10),
    alignItems: "center",
  },
  tabText: {
    fontSize: moderateScale(13),
    fontWeight: "700",
  },
  listContent: {
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(40),
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: moderateScale(14),
    borderWidth: 1,
    padding: scale(12),
    marginBottom: verticalScale(10),
  },
  rowLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: scale(10),
  },
  avatar: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
  },
  avatarPlaceholder: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: moderateScale(16),
    fontWeight: "700",
  },
  nameBlock: {
    flex: 1,
    marginLeft: scale(10),
  },
  name: {
    fontSize: moderateScale(14),
    fontWeight: "700",
  },
  repRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    marginTop: verticalScale(2),
  },
  repText: {
    fontSize: moderateScale(11),
    fontWeight: "600",
  },
  followBtn: {
    minWidth: moderateScale(88),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(20),
    alignItems: "center",
    justifyContent: "center",
    minHeight: verticalScale(34),
  },
  followBtnText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
  },
  emptyBox: {
    alignItems: "center",
    marginTop: verticalScale(60),
    paddingHorizontal: scale(24),
    gap: verticalScale(10),
  },
  emptyText: {
    textAlign: "center",
    fontSize: moderateScale(13),
    fontWeight: "600",
  },
});
