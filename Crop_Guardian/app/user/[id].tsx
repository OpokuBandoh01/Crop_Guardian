// app/user/[id].tsx

import CommentsModal from "@/components/community/CommentsModal";
import PostCard from "@/components/community/PostCard";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { fetchUserPosts, fetchUserProfile } from "@/services/communityApi";
import { useAuthStore } from "@/stores/authStore";
import { useCommunityStore } from "@/stores/communityStore";
import type { CommunityPost, PublicUserProfile } from "@/types/community";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    Modal,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";

const POSTS_PER_PAGE = 10;

export default function UserProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  const currentUserId = useAuthStore((s) => s.user?.id);
  const isLoggedIn = Boolean(currentUserId);

  const {
    followingUserIds,
    followLoadingUserIds,
    likingPostIds,
    savingPostIds,
    toggleFollow,
    toggleLike,
    toggleSave,
  } = useCommunityStore();

  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [reputationModalVisible, setReputationModalVisible] = useState(false);
  const [commentsPost, setCommentsPost] = useState<CommunityPost | null>(null);

  const isBusy = loading || refreshing || loadingMore;

  const loadProfile = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetchUserProfile(id);
      if (res.success) {
        setProfile(res.data);
        // seed follow state from server
        if (typeof res.data.isFollowing === "boolean") {
          useCommunityStore.setState((state) => ({
            followingUserIds: {
              ...state.followingUserIds,
              [res.data.id]: res.data.isFollowing!,
            },
          }));
        }
      } else {
        setError("User not found");
      }
    } catch {
      setError("Could not load this profile. Pull down to try again.");
    }
  }, [id]);

  const loadPosts = useCallback(
    async (opts?: { reset?: boolean }) => {
      if (!id) return;
      const reset = opts?.reset ?? true;
      try {
        const res = await fetchUserPosts(id, {
          page: reset ? 1 : page,
          limit: POSTS_PER_PAGE,
        });
        if (res.success) {
          setPosts((prev) => (reset ? res.data : [...prev, ...res.data]));
          setPage(res.pagination.page);
          setTotalPages(res.pagination.totalPages);
        }
      } catch {
        if (reset) {
          setError("Could not load posts. Pull down to try again.");
        }
      }
    },
    [id, page],
  );

  const initialLoad = useCallback(async () => {
    setLoading(true);
    setError(null);
    await Promise.all([loadProfile(), loadPosts({ reset: true })]);
    setLoading(false);
  }, [loadProfile, loadPosts]);

  useEffect(() => {
    initialLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    await Promise.all([loadProfile(), loadPosts({ reset: true })]);
    setRefreshing(false);
  }, [loadProfile, loadPosts]);

  const onEndReached = useCallback(async () => {
    if (loadingMore || loading || refreshing) return;
    if (page >= totalPages) return;
    setLoadingMore(true);
    setPage((p) => p + 1);
    try {
      const res = await fetchUserPosts(id!, {
        page: page + 1,
        limit: POSTS_PER_PAGE,
      });
      if (res.success) {
        setPosts((prev) => [...prev, ...res.data]);
        setTotalPages(res.pagination.totalPages);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [id, page, totalPages, loadingMore, loading, refreshing]);

  const isSelf = profile?.isSelf ?? currentUserId === id;
  const isFollowing = followingUserIds[id!] ?? profile?.isFollowing ?? false;
  const followBusy = Boolean(followLoadingUserIds[id!]);

  const reputationScore = profile?.profile.reputationScore ?? 0;
  const helpfulAnswersCount = profile?.profile.helpfulAnswersCount ?? 0;
  const solvedAnswersCount = profile?.profile.solvedAnswersCount ?? 0;

  const handleFollowPress = () => {
    if (!isLoggedIn) {
      router.push("/(auth)/login");
      return;
    }
    if (!id || isSelf) return;
    toggleFollow(id);
  };

  const backdropBgColor =
    colorScheme === "light"
      ? "rgba(255, 255, 255, 0.65)"
      : "rgba(0, 0, 0, 0.75)";

  const formatCrop = (crop: string) =>
    crop.charAt(0) + crop.slice(1).toLowerCase();

  const renderHeader = () => {
    if (!profile) return null;

    return (
      <View style={styles.headerBlock}>
        <View style={styles.topRow}>
          {profile.profile.avatarUrl ? (
            <Image
              source={{ uri: profile.profile.avatarUrl }}
              style={styles.avatar}
            />
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
                {(profile.profile.fullName || "?").charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.nameBlock}>
            <Text
              style={[styles.name, { color: theme.text }]}
              numberOfLines={2}
            >
              {profile.profile.fullName}
            </Text>

            {/* reputation chip */}
            <TouchableOpacity
              style={styles.reputationChip}
              onPress={() => setReputationModalVisible(true)}
              activeOpacity={0.7}
              disabled={isBusy}
            >
              <Ionicons
                name="shield-checkmark"
                size={moderateScale(12)}
                color="#A3C89E"
              />
              <Text style={styles.reputationChipText}>{reputationScore}</Text>
            </TouchableOpacity>

            <Text style={[styles.roleText, { color: theme.icon }]}>
              {profile.role
                ? profile.role.charAt(0) + profile.role.slice(1).toLowerCase()
                : "Farmer"}
            </Text>
          </View>
        </View>

        {/* preferred crops chips */}
        {profile.profile.preferredCrops?.length > 0 && (
          <View style={styles.cropsRow}>
            {profile.profile.preferredCrops.map((crop) => (
              <View
                key={crop}
                style={[
                  styles.cropChip,
                  {
                    backgroundColor:
                      colorScheme === "light" ? "#EBF7E9" : "#2E3D30",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.cropChipText,
                    {
                      color: colorScheme === "light" ? "#094A04" : "#4ADE80",
                    },
                  ]}
                >
                  {formatCrop(crop)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* CTA */}
        <View style={styles.ctaRow}>
          {isSelf ? (
            <TouchableOpacity
              style={[styles.ctaButton, { backgroundColor: theme.primary }]}
              onPress={() => router.push("/personal-info")}
              activeOpacity={0.8}
              disabled={isBusy}
            >
              <Text style={styles.ctaButtonText}>Edit profile</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.ctaButton,
                isFollowing
                  ? {
                      backgroundColor: "transparent",
                      borderWidth: 1,
                      borderColor: theme.inputBorder,
                    }
                  : { backgroundColor: theme.primary },
                (followBusy || isBusy) && { opacity: 0.5 },
              ]}
              onPress={handleFollowPress}
              disabled={followBusy || isBusy}
              activeOpacity={0.8}
            >
              {followBusy ? (
                <ActivityIndicator
                  size="small"
                  color={isFollowing ? theme.primary : "#FFFFFF"}
                />
              ) : (
                <Text
                  style={[
                    styles.ctaButtonText,
                    { color: isFollowing ? theme.text : "#FFFFFF" },
                  ]}
                >
                  {isFollowing ? "Following" : "Follow"}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* stats – counts only, not tappable */}
        <View
          style={[
            styles.statsRow,
            {
              backgroundColor: theme.surface,
              borderColor: theme.inputBorder,
            },
          ]}
        >
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {profile.stats.postsCount}
            </Text>
            <Text style={[styles.statLabel, { color: theme.icon }]}>Posts</Text>
          </View>
          <View
            style={[styles.statDivider, { backgroundColor: theme.inputBorder }]}
          />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {profile.stats.followersCount}
            </Text>
            <Text style={[styles.statLabel, { color: theme.icon }]}>
              Followers
            </Text>
          </View>
          <View
            style={[styles.statDivider, { backgroundColor: theme.inputBorder }]}
          />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {profile.stats.followingCount}
            </Text>
            <Text style={[styles.statLabel, { color: theme.icon }]}>
              Following
            </Text>
          </View>
        </View>

        <Text style={[styles.postsSectionTitle, { color: theme.primary }]}>
          Posts
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.background }]}
      edges={["top", "left", "right"]}
    >
      <View style={styles.navRow}>
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
        <Text style={[styles.navTitle, { color: theme.primary }]}>Profile</Text>
        <View style={styles.navSpacer} />
      </View>

      {loading && !profile ? (
        <ActivityIndicator
          style={{ marginTop: 40 }}
          color={theme.primary}
          size="large"
        />
      ) : error && !profile ? (
        <View style={styles.errorBox}>
          <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
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
                followingUserIds[item.author.id] ??
                item.author.isFollowing ??
                false
              }
            />
          )}
          ListHeaderComponent={renderHeader}
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
                  name="document-text-outline"
                  size={moderateScale(32)}
                  color={theme.icon}
                />
                <Text style={[styles.emptyText, { color: theme.icon }]}>
                  No posts yet
                </Text>
              </View>
            ) : null
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
      )}

      {/* reputation explanation sheet */}
      <Modal
        animationType="fade"
        transparent
        visible={reputationModalVisible}
        onRequestClose={() => setReputationModalVisible(false)}
      >
        <View
          style={[styles.modalBackdrop, { backgroundColor: backdropBgColor }]}
        >
          <BlurView
            style={StyleSheet.absoluteFill}
            intensity={100}
            tint={colorScheme === "light" ? "light" : "dark"}
          />
          <View style={[styles.modalCard, { backgroundColor: theme.surface }]}>
            <View style={styles.reputationModalHeader}>
              <Ionicons
                name="shield-checkmark"
                size={moderateScale(28)}
                color={theme.primary}
              />
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Community reputation
              </Text>
            </View>
            <Text
              style={[
                styles.modalDescription,
                { color: colorScheme === "light" ? "#4B5563" : "#9BA1A6" },
              ]}
            >
              Score grows when other farmers mark comments as Helpful (+1) or
              Solved (+2). Unmarking removes points. Score never goes below
              zero.
            </Text>
            <View style={styles.reputationBreakdown}>
              <View style={styles.reputationBreakdownRow}>
                <Text
                  style={[
                    styles.reputationBreakdownLabel,
                    { color: colorScheme === "light" ? "#687076" : "#9BA1A6" },
                  ]}
                >
                  Helpful answers
                </Text>
                <Text
                  style={[
                    styles.reputationBreakdownValue,
                    { color: theme.text },
                  ]}
                >
                  {helpfulAnswersCount}
                </Text>
              </View>
              <View style={styles.reputationBreakdownRow}>
                <Text
                  style={[
                    styles.reputationBreakdownLabel,
                    { color: colorScheme === "light" ? "#687076" : "#9BA1A6" },
                  ]}
                >
                  Solved answers
                </Text>
                <Text
                  style={[
                    styles.reputationBreakdownValue,
                    { color: theme.text },
                  ]}
                >
                  {solvedAnswersCount}
                </Text>
              </View>
              <View
                style={[
                  styles.reputationBreakdownRow,
                  styles.reputationTotalRow,
                  {
                    borderTopColor:
                      colorScheme === "light" ? "#E5E7EB" : "#374151",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.reputationBreakdownLabel,
                    { color: theme.text, fontWeight: "700" },
                  ]}
                >
                  Total reputation
                </Text>
                <Text
                  style={[
                    styles.reputationBreakdownValue,
                    { color: theme.primary, fontWeight: "700" },
                  ]}
                >
                  {reputationScore}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.modalDivider,
                {
                  backgroundColor:
                    colorScheme === "light" ? "#E5E7EB" : "#374151",
                },
              ]}
            />
            <TouchableOpacity
              style={styles.reputationCloseButton}
              onPress={() => setReputationModalVisible(false)}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.reputationCloseText, { color: theme.primary }]}
              >
                Got it
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <CommentsModal
        visible={commentsPost !== null}
        post={commentsPost}
        onClose={() => setCommentsPost(null)}
        onCommentAdded={onRefresh}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
  },
  backBtn: { padding: scale(6) },
  navTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: moderateScale(17),
    fontWeight: "700",
  },
  navSpacer: { width: moderateScale(34) },
  listContent: {
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(40),
  },
  headerBlock: {
    marginBottom: verticalScale(12),
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(12),
  },
  avatar: {
    width: moderateScale(72),
    height: moderateScale(72),
    borderRadius: moderateScale(36),
  },
  avatarPlaceholder: {
    width: moderateScale(72),
    height: moderateScale(72),
    borderRadius: moderateScale(36),
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: moderateScale(26),
    fontWeight: "700",
  },
  nameBlock: {
    flex: 1,
    marginLeft: scale(14),
  },
  name: {
    fontSize: moderateScale(18),
    fontWeight: "700",
  },
  reputationChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: scale(4),
    marginTop: verticalScale(6),
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderRadius: moderateScale(12),
    backgroundColor: "rgba(163, 200, 158, 0.18)",
  },
  reputationChipText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#A3C89E",
  },
  roleText: {
    marginTop: verticalScale(4),
    fontSize: moderateScale(12),
    fontWeight: "600",
  },
  cropsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(6),
    marginBottom: verticalScale(12),
  },
  cropChip: {
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
  },
  cropChipText: {
    fontSize: moderateScale(11),
    fontWeight: "600",
  },
  ctaRow: {
    marginBottom: verticalScale(14),
  },
  ctaButton: {
    height: verticalScale(42),
    borderRadius: moderateScale(12),
    alignItems: "center",
    justifyContent: "center",
  },
  ctaButtonText: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  statsRow: {
    flexDirection: "row",
    borderRadius: moderateScale(14),
    borderWidth: 1,
    paddingVertical: verticalScale(14),
    marginBottom: verticalScale(18),
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: moderateScale(16),
    fontWeight: "700",
  },
  statLabel: {
    fontSize: moderateScale(11),
    fontWeight: "600",
    marginTop: verticalScale(2),
  },
  statDivider: {
    width: 1,
    alignSelf: "stretch",
  },
  postsSectionTitle: {
    fontSize: moderateScale(15),
    fontWeight: "700",
    marginBottom: verticalScale(8),
  },
  emptyBox: {
    alignItems: "center",
    marginTop: verticalScale(30),
    gap: verticalScale(8),
  },
  emptyText: {
    fontSize: moderateScale(13),
    fontWeight: "600",
  },
  errorBox: {
    padding: scale(24),
    alignItems: "center",
  },
  errorText: {
    textAlign: "center",
    fontSize: moderateScale(13),
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: scale(24),
  },
  modalCard: {
    borderRadius: moderateScale(16),
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(8),
  },
  reputationModalHeader: {
    alignItems: "center",
    gap: verticalScale(8),
    marginBottom: verticalScale(8),
  },
  modalTitle: {
    fontSize: moderateScale(17),
    fontWeight: "700",
    textAlign: "center",
  },
  modalDescription: {
    fontSize: moderateScale(13),
    lineHeight: moderateScale(20),
    textAlign: "center",
  },
  reputationBreakdown: {
    marginTop: verticalScale(12),
    marginBottom: verticalScale(4),
    gap: verticalScale(10),
  },
  reputationBreakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reputationTotalRow: {
    borderTopWidth: 1,
    paddingTop: verticalScale(10),
    marginTop: verticalScale(4),
  },
  reputationBreakdownLabel: {
    fontSize: moderateScale(13),
  },
  reputationBreakdownValue: {
    fontSize: moderateScale(14),
    fontWeight: "600",
  },
  modalDivider: {
    height: 1,
    marginTop: verticalScale(12),
  },
  reputationCloseButton: {
    paddingVertical: verticalScale(14),
    alignItems: "center",
  },
  reputationCloseText: {
    fontSize: moderateScale(16),
    fontWeight: "600",
  },
});
