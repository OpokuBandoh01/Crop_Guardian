// app/my-posts.tsx

import BlurModal from "@/components/BlurModal";
import CommentsModal from "@/components/community/CommentsModal";
import { CustomButton } from "@/components/CustomButton";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useCommunityStore } from "@/stores/communityStore";
import type { CommunityPost } from "@/types/community";
import { formatRelativeTime } from "@/utils/timeFormat";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
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

export default function MyPostsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  //  my-posts slice from communityStore
  const {
    myPosts,
    myPostsLoading,
    myPostsRefreshing,
    myPostsLoadingMore,
    myPostsError,
    deletingPostIds,
    fetchMyPostsList,
    refreshMyPosts,
    loadMoreMyPosts,
    deleteMyPost,
  } = useCommunityStore();

  //  which post's comments sheet is open
  const [commentsPost, setCommentsPost] = useState<CommunityPost | null>(null);

  //  which post's three-dot action sheet is open
  const [menuPost, setMenuPost] = useState<CommunityPost | null>(null);

  //  which post is pending delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<CommunityPost | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  //  load / refresh whenever this screen is focused
  // (covers first open and return from create-post)
  useFocusEffect(
    useCallback(() => {
      fetchMyPostsList({ reset: true });
    }, [fetchMyPostsList]),
  );

  //  share post text via the system share sheet
  // Uses React Native Share (plain text). expo-sharing is better for files
  // text posts do not need a local URI.
  const handleShare = async (post: CommunityPost) => {
    setMenuPost(null);
    try {
      const message = post.content.trim();
      const { Share } = await import("react-native");
      await Share.share({
        message:
          message.length > 0 ? message : "Check out my post on Crop Guardian",
      });
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  //  open delete confirm from the menu
  const openDeleteConfirm = (post: CommunityPost) => {
    setMenuPost(null);
    setDeleteError(null);
    setDeleteTarget(post);
  };

  //  confirm delete (optimistic inside the store)
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const postId = deleteTarget.id;
    const ok = await deleteMyPost(postId);
    if (ok) {
      setDeleteTarget(null);
      setDeleteError(null);
      // If comments were open for this post, close them
      if (commentsPost?.id === postId) {
        setCommentsPost(null);
      }
    } else {
      setDeleteError("Could not delete this post. Please try again.");
    }
  };

  const isDeleting = deleteTarget
    ? Boolean(deletingPostIds[deleteTarget.id])
    : false;

  //  compact row (same structure idea as saved-posts)
  const renderRow = ({ item }: { item: CommunityPost }) => {
    const thumb = item.imageUrls[0];
    const rowBusy = Boolean(deletingPostIds[item.id]);

    return (
      <TouchableOpacity
        style={[
          styles.rowCard,
          {
            backgroundColor: theme.surface,
            borderColor: theme.inputBorder,
            opacity: rowBusy ? 0.55 : 1,
          },
        ]}
        activeOpacity={0.85}
        disabled={rowBusy}
        onPress={() => setCommentsPost(item)}
      >
        <View style={styles.rowLeft}>
          <View style={styles.rowTextBlock}>
            <View style={styles.nameTimeRow}>
              <Text
                style={[styles.metaLabel, { color: theme.primary }]}
                numberOfLines={1}
              >
                Your post
              </Text>
              <Text style={[styles.timeText, { color: theme.icon }]}>
                {formatRelativeTime(item.createdAt)}
              </Text>
            </View>
            <Text
              style={[styles.previewText, { color: theme.text }]}
              numberOfLines={2}
            >
              {item.content}
            </Text>
            <View style={styles.statsRow}>
              <Text style={[styles.statText, { color: theme.icon }]}>
                {item.likesCount} likes
              </Text>
              <Text style={[styles.statDot, { color: theme.icon }]}>·</Text>
              <Text style={[styles.statText, { color: theme.icon }]}>
                {item.commentsCount} comments
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.rowRight}>
          {thumb ? (
            <Image source={{ uri: thumb }} style={styles.thumb} />
          ) : (
            <View
              style={[
                styles.thumbPlaceholder,
                {
                  backgroundColor:
                    colorScheme === "light" ? "#EBF7E9" : "#1E2C20",
                },
              ]}
            >
              <Ionicons name="image-outline" size={18} color={theme.icon} />
            </View>
          )}

          {/*  three-dot menu trigger */}
          <TouchableOpacity
            style={styles.menuBtn}
            disabled={rowBusy}
            onPress={() => setMenuPost(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="ellipsis-vertical"
              size={moderateScale(18)}
              color={theme.icon}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
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
          disabled={isDeleting}
        >
          <Ionicons
            name="arrow-back"
            size={moderateScale(22)}
            color={theme.primary}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.primary }]}>
          My Posts
        </Text>
        <View style={styles.headerSpacer} />
      </View>
      <FlatList
        data={myPosts}
        keyExtractor={(item) => item.id}
        renderItem={renderRow}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={myPostsRefreshing}
            onRefresh={refreshMyPosts}
            tintColor={theme.primary}
          />
        }
        onEndReached={loadMoreMyPosts}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          !myPostsLoading ? (
            <View style={styles.emptyBox}>
              <Ionicons
                name="document-text-outline"
                size={moderateScale(36)}
                color={theme.icon}
              />
              <Text style={[styles.emptyText, { color: theme.icon }]}>
                {myPostsError ?? "You have not shared any posts yet"}
              </Text>
              {!myPostsError && (
                <Text
                  style={[
                    styles.emptySubtext,
                    { color: colorScheme === "light" ? "#687076" : "#9BA1A6" },
                  ]}
                >
                  Share a tip or question with the community
                </Text>
              )}
              {/*  empty-state CTA to create post */}
              {!myPostsError && (
                <View style={styles.emptyCtaWrap}>
                  <CustomButton
                    title="Create a post"
                    onPress={() => router.push("/create-post")}
                    disabled={isDeleting}
                  />
                </View>
              )}
            </View>
          ) : (
            <ActivityIndicator
              style={{ marginTop: 40 }}
              color={theme.primary}
            />
          )
        }
        ListFooterComponent={
          myPostsLoadingMore ? (
            <ActivityIndicator
              style={{ marginVertical: 16 }}
              color={theme.primary}
            />
          ) : null
        }
      />
      {/*  comments sheet (same as saved-posts) */}
      <CommentsModal
        visible={commentsPost !== null}
        post={commentsPost}
        onClose={() => setCommentsPost(null)}
        onCommentAdded={() => refreshMyPosts()}
      />
      {/* three-dot action sheet (Share + Delete) */}
      <BlurModal
        visible={menuPost !== null}
        onClose={() => {
          if (!isDeleting) setMenuPost(null);
        }}
        closeOnBackdropPress={!isDeleting}
        // card surface follows app theme (white in light, dark surface in dark)
        contentStyle={{ backgroundColor: theme.surface }}
      >
        <Text style={[styles.menuTitle, { color: theme.text }]}>
          Post options
        </Text>
        <TouchableOpacity
          style={styles.menuRow}
          activeOpacity={0.7}
          disabled={isDeleting}
          onPress={() => {
            if (menuPost) handleShare(menuPost);
          }}
        >
          <Ionicons
            name="share-outline"
            size={moderateScale(18)}
            color={theme.primary}
          />
          <Text style={[styles.menuRowText, { color: theme.text }]}>Share</Text>
        </TouchableOpacity>
        <View
          style={[
            styles.menuDivider,
            {
              backgroundColor: colorScheme === "light" ? "#E5E7EB" : "#374151",
            },
          ]}
        />
        <TouchableOpacity
          style={styles.menuRow}
          activeOpacity={0.7}
          disabled={isDeleting}
          onPress={() => {
            if (menuPost) openDeleteConfirm(menuPost);
          }}
        >
          <Ionicons
            name="trash-outline"
            size={moderateScale(18)}
            color={theme.error}
          />
          <Text style={[styles.menuRowText, { color: theme.error }]}>
            Delete
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.menuCancel,
            {
              borderColor: theme.inputBorder,
              backgroundColor: theme.surface,
            },
          ]}
          activeOpacity={0.7}
          disabled={isDeleting}
          onPress={() => setMenuPost(null)}
        >
          <Text style={[styles.menuCancelText, { color: theme.text }]}>
            Cancel
          </Text>
        </TouchableOpacity>
      </BlurModal>
      {/* delete confirm (blur + lock background) */}
      <BlurModal
        visible={deleteTarget !== null}
        onClose={() => {
          if (!isDeleting) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
        closeOnBackdropPress={!isDeleting}
        // card surface follows app theme
        contentStyle={{ backgroundColor: theme.surface }}
      >
        <View
          style={[
            styles.deleteIconWrap,
            {
              // soft red tint that works in both modes
              backgroundColor: colorScheme === "light" ? "#FEF2F2" : "#3F1D1D",
            },
          ]}
        >
          <Ionicons name="warning-outline" size={32} color={theme.error} />
        </View>
        <Text style={[styles.deleteTitle, { color: theme.text }]}>
          Delete this post?
        </Text>
        <Text
          style={[
            styles.deleteMessage,
            { color: colorScheme === "light" ? "#687076" : "#9BA1A6" },
          ]}
        >
          This cannot be undone. Comments and likes on this post will also be
          removed.
        </Text>
        {deleteError ? (
          <Text style={[styles.deleteErrorText, { color: theme.error }]}>
            {deleteError}
          </Text>
        ) : null}
        <TouchableOpacity
          style={[
            styles.deleteConfirmBtn,
            { backgroundColor: theme.error },
            isDeleting && { opacity: 0.5 },
          ]}
          onPress={handleConfirmDelete}
          disabled={isDeleting}
          activeOpacity={0.8}
        >
          {isDeleting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.deleteConfirmText}>Yes, Delete</Text>
          )}
        </TouchableOpacity>
        <CustomButton
          title="Keep Post"
          variant="outline"
          onPress={() => {
            if (!isDeleting) {
              setDeleteTarget(null);
              setDeleteError(null);
            }
          }}
          disabled={isDeleting}
        />
      </BlurModal>
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
  listContent: {
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(40),
  },
  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: moderateScale(14),
    borderWidth: 1,
    padding: scale(12),
    marginBottom: verticalScale(12),
  },
  rowLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    marginRight: scale(10),
  },
  rowTextBlock: {
    flex: 1,
  },
  nameTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: scale(8),
  },
  metaLabel: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    flexShrink: 1,
  },
  timeText: {
    fontSize: moderateScale(10.5),
  },
  previewText: {
    marginTop: verticalScale(4),
    fontSize: moderateScale(12),
    lineHeight: verticalScale(17),
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: verticalScale(6),
    gap: scale(4),
  },
  statText: {
    fontSize: moderateScale(10.5),
    fontWeight: "600",
  },
  statDot: {
    fontSize: moderateScale(10.5),
  },
  rowRight: {
    alignItems: "center",
    gap: verticalScale(8),
  },
  thumb: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(10),
  },
  thumbPlaceholder: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(10),
    alignItems: "center",
    justifyContent: "center",
  },
  menuBtn: {
    padding: scale(2),
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
  emptySubtext: {
    textAlign: "center",
    fontSize: moderateScale(12),
  },
  emptyCtaWrap: {
    width: "100%",
    marginTop: verticalScale(12),
  },
  menuTitle: {
    fontSize: moderateScale(15),
    fontWeight: "700",
    marginBottom: verticalScale(12),
    textAlign: "center",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
    paddingVertical: verticalScale(12),
  },
  menuRowText: {
    fontSize: moderateScale(14),
    fontWeight: "600",
  },
  menuDivider: {
    height: 1,
    width: "100%",
  },
  menuCancel: {
    marginTop: verticalScale(12),
    borderWidth: 1,
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(12),
    alignItems: "center",
  },
  menuCancelText: {
    fontSize: moderateScale(14),
    fontWeight: "600",
  },
  deleteIconWrap: {
    width: moderateScale(64),
    height: moderateScale(64),
    borderRadius: moderateScale(32),
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: verticalScale(12),
  },
  deleteTitle: {
    fontSize: moderateScale(17),
    fontWeight: "700",
    textAlign: "center",
    marginBottom: verticalScale(8),
  },
  deleteMessage: {
    fontSize: moderateScale(13),
    textAlign: "center",
    lineHeight: moderateScale(20),
    marginBottom: verticalScale(16),
  },
  deleteErrorText: {
    color: "#EF4444",
    fontSize: moderateScale(12),
    textAlign: "center",
    marginBottom: verticalScale(10),
  },
  deleteConfirmBtn: {
    width: "100%",
    backgroundColor: "#EF4444",
    borderRadius: moderateScale(8),
    paddingVertical: verticalScale(14),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: verticalScale(8),
    minHeight: verticalScale(48),
  },
  deleteConfirmText: {
    color: "#FFFFFF",
    fontSize: moderateScale(15),
    fontWeight: "700",
  },
});
