// app/(tabs)/community.tsx
// Community feed screen. Latest tab is wired. Save + follow wired via PostCard.

import CategoriesRow from "@/components/community/CategoriesRow";
import CommentsModal from "@/components/community/CommentsModal";
import PostCard from "@/components/community/PostCard";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuthStore } from "@/stores/authStore";
import { useCommunityStore } from "@/stores/communityStore";
import { useNotificationStore } from "@/stores/notificationStore";
import type { CommunityPost } from "@/types/community";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";

type ComingSoonTab = "Following" | "Popular";

export default function CommunityScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const fetchNotifications = useNotificationStore(
    (state) => state.fetchNotifications,
  );

  // NEW ADDITION: current user id so PostCard can hide Follow on own posts
  const currentUserId = useAuthStore((state) => state.user?.id);

  const {
    tags,
    posts,
    postsLoading,
    refreshing,
    loadingMore,
    postsError,
    selectedTagSlug,
    searchQuery,
    likingPostIds,
    // NEW ADDITION
    savingPostIds,
    followingUserIds,
    followLoadingUserIds,
    fetchTags,
    fetchPosts,
    refreshPosts,
    loadMorePosts,
    setSelectedTag,
    setSearchQuery,
    submitSearch,
    toggleLike,
    // NEW ADDITION
    toggleSave,
    toggleFollow,
  } = useCommunityStore();

  const [commentsPost, setCommentsPost] = useState<CommunityPost | null>(null);

  const isBusy = postsLoading || refreshing || loadingMore;

  useEffect(() => {
    fetchTags();
    fetchPosts({ reset: true });
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasFocusedOnce = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!hasFocusedOnce.current) {
        hasFocusedOnce.current = true;
        return;
      }
      refreshPosts();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const handleComingSoonTab = (tab: ComingSoonTab) => {
    Alert.alert(
      "Coming soon",
      `The ${tab} feed will be available in a future update.`,
    );
  };

  const handleComposePress = () => {
    router.push("/create-post");
  };

  const handleCommentAdded = () => {
    refreshPosts();
  };

  // UPDATED: pass save + follow props into PostCard
  const renderItem = ({ item }: { item: CommunityPost }) => (
    <PostCard
      post={item}
      currentUserId={currentUserId}
      onLikePress={toggleLike}
      onSavePress={toggleSave}
      onFollowPress={toggleFollow}
      onCommentPress={setCommentsPost}
      isLiking={Boolean(likingPostIds[item.id])}
      isSaving={Boolean(savingPostIds[item.id])}
      isFollowLoading={Boolean(followLoadingUserIds[item.author.id])}
      isFollowing={
        followingUserIds[item.author.id] ?? item.author.isFollowing ?? false
      }
    />
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      edges={["top", "left", "right"]}
    >
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshPosts}
            tintColor={theme.primary}
            progressBackgroundColor={theme.surface}
          />
        }
        onEndReachedThreshold={0.4}
        onEndReached={loadMorePosts}
        ListHeaderComponent={
          <View>
            <View style={styles.headerRow}>
              <Text style={[styles.headerTitle, { color: theme.primary }]}>
                Community
              </Text>
              <TouchableOpacity
                style={styles.bellButton}
                onPress={() => router.push("/alerts")}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="notifications-outline"
                  size={moderateScale(22)}
                  color={theme.primary}
                />
                {unreadCount > 0 && (
                  <View
                    style={[styles.badge, { borderColor: theme.background }]}
                  >
                    <Text style={styles.badgeText}>
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.searchRow}>
              <View
                style={[
                  styles.searchInputWrapper,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.inputBorder,
                  },
                ]}
              >
                <Ionicons
                  name="search-outline"
                  size={moderateScale(16)}
                  color={theme.icon}
                  style={styles.searchIcon}
                />
                <TextInput
                  style={[styles.searchInput, { color: theme.text }]}
                  placeholder="Search posts, crops or tags..."
                  placeholderTextColor={theme.placeholder}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={submitSearch}
                  returnKeyType="search"
                  editable={!isBusy}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.filterButton,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.inputBorder,
                  },
                ]}
                activeOpacity={0.7}
                disabled={isBusy}
                onPress={() =>
                  Alert.alert(
                    "Coming soon",
                    "Advanced filters will be available in a future update.",
                  )
                }
              >
                <Ionicons
                  name="options-outline"
                  size={moderateScale(18)}
                  color={theme.primary}
                />
              </TouchableOpacity>
            </View>

            <Text style={[styles.sectionLabel, { color: theme.text }]}>
              Categories
            </Text>
            <CategoriesRow
              tags={tags}
              selectedSlug={selectedTagSlug}
              onSelect={setSelectedTag}
              disabled={isBusy}
            />

            <View style={styles.tabsRow}>
              <TouchableOpacity style={styles.tabItem} disabled={isBusy}>
                <Text style={[styles.tabTextActive, { color: theme.primary }]}>
                  Latest
                </Text>
                <View
                  style={[
                    styles.tabUnderline,
                    { backgroundColor: theme.primary },
                  ]}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.tabItem}
                disabled={isBusy}
                onPress={() => handleComingSoonTab("Following")}
              >
                <Text style={[styles.tabTextInactive, { color: theme.icon }]}>
                  Following
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.tabItem}
                disabled={isBusy}
                onPress={() => handleComingSoonTab("Popular")}
              >
                <Text style={[styles.tabTextInactive, { color: theme.icon }]}>
                  Popular
                </Text>
              </TouchableOpacity>
            </View>

            {postsLoading && posts.length === 0 && (
              <ActivityIndicator
                size="large"
                color={theme.primary}
                style={styles.centerSpinner}
              />
            )}

            {postsError && posts.length === 0 && !postsLoading && (
              <View style={styles.errorBox}>
                <Text style={[styles.errorText, { color: theme.text }]}>
                  {postsError}
                </Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          !postsLoading && !postsError ? (
            <View style={styles.emptyBox}>
              <Ionicons
                name="chatbubbles-outline"
                size={moderateScale(36)}
                color={theme.icon}
              />
              <Text style={[styles.emptyText, { color: theme.icon }]}>
                No posts found. Be the first to share your experience!
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator
              size="small"
              color={theme.primary}
              style={styles.footerSpinner}
            />
          ) : null
        }
      />

      <TouchableOpacity
        style={[styles.composeButton, { backgroundColor: theme.primary }]}
        activeOpacity={0.85}
        onPress={handleComposePress}
      >
        <Ionicons name="add" size={moderateScale(26)} color="#FFFFFF" />
      </TouchableOpacity>

      <CommentsModal
        visible={commentsPost !== null}
        post={commentsPost}
        onClose={() => setCommentsPost(null)}
        onCommentAdded={handleCommentAdded}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(8),
    paddingBottom: verticalScale(110),
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(14),
  },
  headerTitle: {
    fontSize: moderateScale(22),
    fontWeight: "700",
  },
  bellButton: {
    padding: scale(6),
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#EF4444",
    borderRadius: moderateScale(10),
    minWidth: moderateScale(18),
    height: moderateScale(18),
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: moderateScale(10),
    fontWeight: "700",
  },
  searchRow: {
    flexDirection: "row",
    gap: scale(8),
    marginBottom: verticalScale(16),
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: moderateScale(12),
    paddingHorizontal: scale(10),
  },
  searchIcon: {
    marginRight: scale(6),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(12.5),
    paddingVertical: verticalScale(10),
  },
  filterButton: {
    width: moderateScale(42),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionLabel: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    marginBottom: verticalScale(10),
  },
  tabsRow: {
    flexDirection: "row",
    gap: scale(20),
    marginTop: verticalScale(16),
    marginBottom: verticalScale(14),
  },
  tabItem: {
    alignItems: "center",
  },
  tabTextActive: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    paddingBottom: verticalScale(4),
  },
  tabTextInactive: {
    fontSize: moderateScale(13),
    fontWeight: "600",
    paddingBottom: verticalScale(4),
  },
  tabUnderline: {
    height: 2,
    width: "100%",
    borderRadius: 1,
  },
  centerSpinner: {
    marginTop: verticalScale(30),
  },
  errorBox: {
    alignItems: "center",
    marginTop: verticalScale(30),
    paddingHorizontal: scale(20),
  },
  errorText: {
    fontSize: moderateScale(12.5),
    textAlign: "center",
  },
  emptyBox: {
    alignItems: "center",
    marginTop: verticalScale(50),
    paddingHorizontal: scale(30),
    gap: verticalScale(10),
  },
  emptyText: {
    fontSize: moderateScale(12.5),
    textAlign: "center",
  },
  footerSpinner: {
    marginVertical: verticalScale(16),
  },
  composeButton: {
    position: "absolute",
    right: scale(16),
    bottom: verticalScale(90),
    width: moderateScale(52),
    height: moderateScale(52),
    borderRadius: moderateScale(26),
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});
