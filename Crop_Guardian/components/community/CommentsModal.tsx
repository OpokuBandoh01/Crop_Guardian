// components/community/CommentsModal.tsx
// //NEW ADDITION : Instagram-style slide-up Comments modal.
// //UPDATED : (1) draggable sheet — pull handle to expand to full screen or
//             collapse back to mid height
//             (2) keyboard no longer covers the input — uses KeyboardStickyView
//                 from react-native-keyboard-controller (already in app root)
// //UPDATED : show author reputationScore next to names (post header, comments, replies).
//
// Matches the provided screenshot: original post at top, threaded comments,
// helpful/solved pills, reply nesting (one level), and a pinned composer.
//
// Uses Modal + BlurView + slide animation.
// Backdrop is locked while open (Pressable covers the screen).
//
// Backend reference:
// - GET  /api/community/posts/:postId/comments
// - POST /api/community/posts/:postId/comments
// - POST /api/community/comments/:commentId/replies
// - POST/DELETE .../helpful and .../solved
// Verified against API guide 2026-08-10.
//
// Keyboard sticky pattern:
// https://kirillzyusko.github.io/react-native-keyboard-controller/docs/api/components/keyboard-sticky-view
// Gesture / reanimated (already in package.json):
// https://docs.swmansion.com/react-native-gesture-handler/
// https://docs.swmansion.com/react-native-reanimated/

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  createCommentReply,
  createPostComment,
  fetchPostComments,
  markCommentHelpful,
  markCommentSolved,
  unmarkCommentHelpful,
  unmarkCommentSolved,
} from "@/services/communityApi";
import { useAuthStore } from "@/stores/authStore";
import type { CommunityComment, CommunityPost } from "@/types/community";
import { formatRelativeTime } from "@/utils/timeFormat";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
// GestureHandlerRootView is required INSIDE React Native Modal because Modal
// renders in a separate native window and does not inherit the root GH root.
// Docs: https://docs.swmansion.com/react-native-gesture-handler/docs/fundamentals/installation
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";

// TypeScript: explicit props so the parent cannot pass an invalid post.
interface CommentsModalProps {
  visible: boolean;
  post: CommunityPost | null;
  onClose: () => void;
  // Called after a successful new comment so the feed can bump commentsCount
  onCommentAdded?: (postId: string) => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// Snap points as fractions of screen height.
// MID  = Instagram-like default sheet
// FULL = user dragged to the top (almost full screen)
const SNAP_MID = SCREEN_HEIGHT * 0.62;
const SNAP_FULL = SCREEN_HEIGHT * 0.94;
// If user drags below this, close the modal.
const CLOSE_THRESHOLD = SCREEN_HEIGHT * 0.35;

export default function CommentsModal({
  visible,
  post,
  onClose,
  onCommentAdded,
}: CommentsModalProps) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  // Current user id — needed for author badge and for showing mark buttons
  // only to the post author (backend rule: only post author can mark).
  const currentUserId = useAuthStore((s) => s.user?.id);

  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  // When set, the next submit is a reply to this top-level comment id.
  const [replyTo, setReplyTo] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const inputRef = useRef<TextInput>(null);
  const listRef = useRef<FlatList>(null);

  // ── Sheet height animation (draggable) ───────────────────────────────────
  // sheetHeight is the animated height of the bottom sheet in pixels.
  const sheetHeight = useSharedValue(SNAP_MID);
  // Tracks the height at the moment the finger started dragging.
  const dragStartHeight = useSharedValue(SNAP_MID);

  // Reset to mid height whenever the modal opens.
  useEffect(() => {
    if (visible) {
      sheetHeight.value = withSpring(SNAP_MID, {
        damping: 20,
        stiffness: 180,
      });
    }
  }, [visible, sheetHeight]);

  const closeModal = useCallback(() => {
    onClose();
  }, [onClose]);

  // Pan gesture on the handle + header bar only (not the whole list),
  // so scrolling comments still works normally.
  const panGesture = Gesture.Pan()
    .onStart(() => {
      dragStartHeight.value = sheetHeight.value;
    })
    .onUpdate((e) => {
      // Dragging up (negative translationY) grows the sheet.
      // Dragging down (positive translationY) shrinks it.
      const next = dragStartHeight.value - e.translationY;
      // Clamp between a small minimum and full screen.
      const minH = SCREEN_HEIGHT * 0.28;
      const maxH = SNAP_FULL;
      sheetHeight.value = Math.min(maxH, Math.max(minH, next));
    })
    .onEnd((e) => {
      const current = sheetHeight.value;
      const velocity = -e.velocityY; // positive = expanding

      // Fast swipe down or pulled very low → close
      if (
        current < CLOSE_THRESHOLD ||
        (velocity < -800 && current < SNAP_MID)
      ) {
        sheetHeight.value = withSpring(0, { damping: 20, stiffness: 200 });
        runOnJS(closeModal)();
        return;
      }

      // Decide snap: mid vs full based on position + velocity
      const midPoint = (SNAP_MID + SNAP_FULL) / 2;
      let target = SNAP_MID;
      if (velocity > 600) {
        target = SNAP_FULL;
      } else if (velocity < -600) {
        target = SNAP_MID;
      } else {
        target = current >= midPoint ? SNAP_FULL : SNAP_MID;
      }

      sheetHeight.value = withSpring(target, {
        damping: 20,
        stiffness: 180,
      });
    });

  const animatedSheetStyle = useAnimatedStyle(() => ({
    height: sheetHeight.value,
  }));

  // Load comments whenever the modal opens for a post.
  const loadComments = useCallback(async () => {
    if (!post?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPostComments(post.id, { page: 1, limit: 20 });
      if (res.success) {
        setComments(res.data);
      } else {
        setError(res.message || "Could not load comments.");
      }
    } catch (err) {
      console.error("Failed to load comments:", err);
      setError("Could not load comments. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [post?.id]);

  useEffect(() => {
    if (visible && post?.id) {
      loadComments();
      setText("");
      setReplyTo(null);
    }
    // When closed, clear local state so the next open starts clean.
    if (!visible) {
      setComments([]);
      setError(null);
      setText("");
      setReplyTo(null);
    }
  }, [visible, post?.id, loadComments]);

  // Total count including nested replies (matches screenshot "24 Comments").
  const totalCount = comments.reduce(
    (sum, c) => sum + 1 + (c.replies?.length ?? 0),
    0,
  );

  const isPostAuthor =
    !!currentUserId && !!post?.author?.id && currentUserId === post.author.id;

  // ── Submit top-level comment or reply ────────────────────────────────────
  const handleSubmit = async () => {
    if (!post?.id || submitting) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    if (trimmed.length > 1000) {
      Alert.alert("Too long", "Comments must be 1000 characters or fewer.");
      return;
    }

    setSubmitting(true);
    try {
      if (replyTo) {
        const res = await createCommentReply(replyTo.id, trimmed);
        if (res.success) {
          setComments((prev) =>
            prev.map((c) =>
              c.id === replyTo.id
                ? { ...c, replies: [...(c.replies ?? []), res.data] }
                : c,
            ),
          );
          setReplyTo(null);
          setText("");
          onCommentAdded?.(post.id);
        }
      } else {
        const res = await createPostComment(post.id, trimmed);
        if (res.success) {
          setComments((prev) => [...prev, { ...res.data, replies: [] }]);
          setText("");
          onCommentAdded?.(post.id);
          setTimeout(() => {
            listRef.current?.scrollToEnd({ animated: true });
          }, 150);
        }
      }
    } catch (err: any) {
      console.error("Failed to submit comment:", err);
      const msg =
        err?.response?.data?.message ||
        "Could not post your comment. Please try again.";
      Alert.alert("Error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Mark helpful / solved (post author only) ─────────────────────────────
  const handleMark = async (
    commentId: string,
    type: "helpful" | "solved",
    currentlyMarked: boolean,
  ) => {
    if (!isPostAuthor || markingId) return;
    setMarkingId(commentId);
    try {
      let res;
      if (type === "helpful") {
        res = currentlyMarked
          ? await unmarkCommentHelpful(commentId)
          : await markCommentHelpful(commentId);
      } else {
        res = currentlyMarked
          ? await unmarkCommentSolved(commentId)
          : await markCommentSolved(commentId);
      }

      if (res.success && res.data) {
        const { helpfulCount, solvedCount } = res.data;
        setComments((prev) =>
          prev.map((c) => {
            if (c.id === commentId) {
              return { ...c, helpfulCount, solvedCount };
            }
            if (c.replies?.some((r) => r.id === commentId)) {
              return {
                ...c,
                replies: c.replies.map((r) =>
                  r.id === commentId ? { ...r, helpfulCount, solvedCount } : r,
                ),
              };
            }
            return c;
          }),
        );
      }
    } catch (err: any) {
      console.error("Failed to mark comment:", err);
      const msg =
        err?.response?.data?.message ||
        "Could not update mark. Please try again.";
      Alert.alert("Error", msg);
    } finally {
      setMarkingId(null);
    }
  };

  const startReply = (commentId: string, authorName: string) => {
    setReplyTo({ id: commentId, name: authorName });
    setText("");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const cancelReply = () => {
    setReplyTo(null);
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((p) => p.charAt(0))
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  // ── Render one top-level comment + its replies ───────────────────────────
  const renderComment = ({ item }: { item: CommunityComment }) => {
    const isOwnComment = !!currentUserId && item.author.id === currentUserId;
    const canMark = isPostAuthor && !isOwnComment;
    const isHelpful = item.helpfulCount > 0;
    const isSolved = item.solvedCount > 0;
    const isMarking = markingId === item.id;

    return (
      <View style={styles.commentBlock}>
        <View style={styles.commentRow}>
          {item.author.avatarUrl ? (
            <Image
              source={{ uri: item.author.avatarUrl }}
              style={styles.commentAvatar}
            />
          ) : (
            <View
              style={[
                styles.commentAvatarPlaceholder,
                { backgroundColor: theme.primary },
              ]}
            >
              <Text style={styles.avatarInitials}>
                {getInitials(item.author.fullName)}
              </Text>
            </View>
          )}

          <View style={styles.commentBody}>
            <View style={styles.commentHeaderLine}>
              {/* //UPDATED : name + reputation score on the same line */}
              <Text
                style={[styles.commentAuthor, { color: theme.text }]}
                numberOfLines={1}
              >
                {item.author.fullName}
              </Text>
              {/* //NEW ADDITION : subtle reputation badge beside comment author name */}
              <View style={styles.reputationBadge}>
                <Ionicons
                  name="star"
                  size={moderateScale(10)}
                  color="#F59E0B"
                />
                <Text style={styles.reputationText}>
                  {item.author.reputationScore ?? 0}
                </Text>
              </View>
              {/* //NO CHANGES : relative time stays after the score */}
              <Text
                style={[styles.commentTime, { color: theme.tabIconDefault }]}
              >
                {formatRelativeTime(item.createdAt)}
              </Text>
            </View>

            <Text style={[styles.commentText, { color: theme.text }]}>
              {item.content}
            </Text>

            <View style={styles.commentActions}>
              {canMark && (
                <TouchableOpacity
                  style={[
                    styles.markPill,
                    isSolved ? styles.markPillSolved : styles.markPillOutline,
                  ]}
                  activeOpacity={0.75}
                  disabled={isMarking || submitting}
                  onPress={() => handleMark(item.id, "solved", isSolved)}
                >
                  {isMarking ? (
                    <ActivityIndicator size="small" color="#16A34A" />
                  ) : (
                    <>
                      <Text
                        style={[
                          styles.markPillText,
                          isSolved
                            ? styles.markPillTextActive
                            : { color: theme.primary },
                        ]}
                      >
                        Solved
                      </Text>
                      {isSolved && (
                        <Ionicons
                          name="checkmark"
                          size={moderateScale(12)}
                          color="#16A34A"
                        />
                      )}
                    </>
                  )}
                </TouchableOpacity>
              )}

              {!canMark && isSolved && (
                <View style={[styles.markPill, styles.markPillSolved]}>
                  <Text
                    style={[styles.markPillText, styles.markPillTextActive]}
                  >
                    Solved
                  </Text>
                  <Ionicons
                    name="checkmark"
                    size={moderateScale(12)}
                    color="#16A34A"
                  />
                </View>
              )}

              {canMark && (
                <TouchableOpacity
                  style={[
                    styles.markPill,
                    isHelpful ? styles.markPillHelpful : styles.markPillOutline,
                  ]}
                  activeOpacity={0.75}
                  disabled={isMarking || submitting}
                  onPress={() => handleMark(item.id, "helpful", isHelpful)}
                >
                  <Text
                    style={[
                      styles.markPillText,
                      isHelpful
                        ? styles.markPillTextActive
                        : { color: theme.primary },
                    ]}
                  >
                    Helpful
                  </Text>
                  {isHelpful && (
                    <Ionicons
                      name="checkmark"
                      size={moderateScale(12)}
                      color="#16A34A"
                    />
                  )}
                </TouchableOpacity>
              )}

              {!canMark && isHelpful && (
                <View style={[styles.markPill, styles.markPillHelpful]}>
                  <Text
                    style={[styles.markPillText, styles.markPillTextActive]}
                  >
                    Helpful
                  </Text>
                  <Ionicons
                    name="checkmark"
                    size={moderateScale(12)}
                    color="#16A34A"
                  />
                </View>
              )}

              <TouchableOpacity
                activeOpacity={0.7}
                disabled={submitting || loading}
                onPress={() => startReply(item.id, item.author.fullName)}
                style={styles.replyButton}
              >
                <Text
                  style={[styles.replyButtonText, { color: theme.primary }]}
                >
                  Reply
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          {/* 
          <TouchableOpacity
            style={[styles.miniFollow, { backgroundColor: theme.primary }]}
            activeOpacity={0.8}
            disabled={submitting || loading}
            onPress={() =>
              Alert.alert(
                "Coming soon",
                "Following farmers will be available in a future update.",
              )
            }
          >
            <Text style={styles.miniFollowText}>Follow</Text>
          </TouchableOpacity> */}
        </View>

        {(item.replies ?? []).map((reply) => {
          const isAuthorReply =
            !!post?.author?.id && reply.author.id === post.author.id;
          return (
            <View key={reply.id} style={styles.replyRow}>
              {reply.author.avatarUrl ? (
                <Image
                  source={{ uri: reply.author.avatarUrl }}
                  style={styles.replyAvatar}
                />
              ) : (
                <View
                  style={[
                    styles.replyAvatarPlaceholder,
                    { backgroundColor: theme.primary },
                  ]}
                >
                  <Text style={styles.replyAvatarInitials}>
                    {getInitials(reply.author.fullName)}
                  </Text>
                </View>
              )}
              <View style={styles.replyBody}>
                <View style={styles.commentHeaderLine}>
                  {/* //UPDATED : reply author name + reputation score */}
                  <Text
                    style={[styles.commentAuthor, { color: theme.text }]}
                    numberOfLines={1}
                  >
                    {reply.author.fullName}
                  </Text>
                  {/* //NEW ADDITION : reputation badge on replies too */}
                  <View style={styles.reputationBadge}>
                    <Ionicons
                      name="star"
                      size={moderateScale(10)}
                      color="#F59E0B"
                    />
                    <Text style={styles.reputationText}>
                      {reply.author.reputationScore ?? 0}
                    </Text>
                  </View>
                  {/* //NO CHANGES : Author badge when the reply is from the post owner */}
                  {isAuthorReply && (
                    <View style={styles.authorBadge}>
                      <Text style={styles.authorBadgeText}>Author</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.commentText, { color: theme.text }]}>
                  {reply.content}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  disabled={submitting || loading}
                  onPress={() => startReply(item.id, item.author.fullName)}
                  style={styles.replyButton}
                >
                  <Text
                    style={[styles.replyButtonText, { color: theme.primary }]}
                  >
                    Reply
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  // Header block: original post card (matches screenshot)
  const ListHeader = () => {
    if (!post) return null;
    const initials = getInitials(post.author.fullName);

    return (
      <View>
        <View
          style={[
            styles.postCard,
            {
              backgroundColor: theme.surface,
              borderColor:
                colorScheme === "light" ? "#E5E7EB" : theme.inputBorder,
            },
          ]}
        >
          <View style={styles.postHeader}>
            <View style={styles.postHeaderLeft}>
              {post.author.avatarUrl ? (
                <Image
                  source={{ uri: post.author.avatarUrl }}
                  style={styles.postAvatar}
                />
              ) : (
                <View
                  style={[
                    styles.postAvatarPlaceholder,
                    { backgroundColor: theme.primary },
                  ]}
                >
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </View>
              )}
              <View style={styles.postHeaderText}>
                {/* //UPDATED : post author name row now includes reputation score */}
                <View style={styles.nameRow}>
                  <Text
                    style={[styles.postAuthor, { color: theme.text }]}
                    numberOfLines={1}
                  >
                    {post.author.fullName}
                  </Text>
                  {/* //NEW ADDITION : reputation badge in the modal post header */}
                  <View style={styles.reputationBadge}>
                    <Ionicons
                      name="star"
                      size={moderateScale(11)}
                      color="#F59E0B"
                    />
                    <Text style={styles.reputationText}>
                      {post.author.reputationScore ?? 0}
                    </Text>
                  </View>
                </View>
                {/* //NO CHANGES : region + time meta */}
                <Text
                  style={[styles.postMeta, { color: theme.tabIconDefault }]}
                  numberOfLines={1}
                >
                  {post.region ? `${post.region} Region` : "Location not set"}
                  {"  ·  "}
                  {formatRelativeTime(post.createdAt)}
                </Text>
              </View>
            </View>
            {/* <TouchableOpacity
              style={[styles.followBtn, { backgroundColor: theme.primary }]}
              activeOpacity={0.8}
              disabled={submitting || loading}
              onPress={() =>
                Alert.alert(
                  "Coming soon",
                  "Following farmers will be available in a future update.",
                )
              }
            >
              <Text style={styles.followBtnText}>Follow</Text>
            </TouchableOpacity> */}
          </View>

          <Text style={[styles.postContent, { color: theme.text }]}>
            {post.content}
          </Text>

          {post.imageUrls.length > 0 && (
            <View style={styles.imagesRow}>
              {post.imageUrls.slice(0, 3).map((url, idx) => (
                <Image
                  key={`${post.id}-img-${idx}`}
                  source={{ uri: url }}
                  style={[
                    styles.postImage,
                    post.imageUrls.length === 1 && styles.postImageSingle,
                  ]}
                  resizeMode="cover"
                />
              ))}
            </View>
          )}

          {post.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {post.tags.map((tag) => (
                <View
                  key={tag.id}
                  style={[
                    styles.tagChip,
                    {
                      backgroundColor:
                        colorScheme === "light" ? "#EBF7E9" : "#1E2C20",
                    },
                  ]}
                >
                  <Text style={[styles.tagChipText, { color: theme.primary }]}>
                    #{tag.name.replace(/\s+/g, "")}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <Text style={[styles.commentsCountLabel, { color: theme.text }]}>
          {loading && comments.length === 0
            ? "Loading comments..."
            : `${totalCount} Comment${totalCount === 1 ? "" : "s"}`}
        </Text>
      </View>
    );
  };

  if (!post) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/*
        //UPDATED : GestureHandlerRootView must wrap Modal content.
        React Native Modal renders in a separate native root, so the app-level
        GestureHandlerRootView does not cover gestures inside this Modal.
        Without this wrapper, GestureDetector throws:
        "GestureDetector must be used as a descendant of GestureHandlerRootView"
        Docs: https://docs.swmansion.com/react-native-gesture-handler/docs/fundamentals/installation
      */}
      <GestureHandlerRootView style={styles.root}>
        {/*
          Blur + full-screen Pressable locks the background (project rule).
          Sheet sits at the bottom and is height-animated by the pan gesture.
        */}
        <BlurView
          intensity={45}
          tint={colorScheme === "dark" ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </BlurView>

        {/*
          Animated sheet height. GestureDetector wraps only the drag handle
          + header so the FlatList can still scroll freely.
        */}
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.background,
              paddingBottom: Math.max(insets.bottom, verticalScale(8)),
            },
            animatedSheetStyle,
          ]}
        >
          {/* Drag handle + header (gesture target) */}
          <GestureDetector gesture={panGesture}>
            <View>
              <View style={styles.handleHitArea}>
                <View style={styles.handle} />
              </View>

              <View style={styles.headerBar}>
                <TouchableOpacity
                  onPress={onClose}
                  activeOpacity={0.7}
                  style={styles.backBtn}
                  disabled={submitting}
                  accessibilityLabel="Close comments"
                >
                  <Ionicons
                    name="arrow-back"
                    size={moderateScale(22)}
                    color={theme.primary}
                  />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>
                  Comments
                </Text>
                {/* Spacer so title stays centered */}
                <View style={styles.backBtn} />
              </View>
            </View>
          </GestureDetector>

          {/* Comments list — flex:1 so it fills remaining sheet height */}
          <View style={styles.listWrap}>
            {loading && comments.length === 0 ? (
              <View style={styles.centerBox}>
                <ActivityIndicator size="large" color={theme.primary} />
              </View>
            ) : error && comments.length === 0 ? (
              <View style={styles.centerBox}>
                <Text style={[styles.errorText, { color: theme.text }]}>
                  {error}
                </Text>
                <TouchableOpacity
                  onPress={loadComments}
                  style={[styles.retryBtn, { backgroundColor: theme.primary }]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.retryBtnText}>Try again</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                ref={listRef}
                data={comments}
                keyExtractor={(item) => item.id}
                renderItem={renderComment}
                ListHeaderComponent={ListHeader}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                // Extra bottom padding so last comment is not hidden
                // under the composer when keyboard is closed.
                ListFooterComponent={
                  <View style={{ height: verticalScale(12) }} />
                }
                ListEmptyComponent={
                  !loading ? (
                    <View style={styles.emptyBox}>
                      <Ionicons
                        name="chatbubble-outline"
                        size={moderateScale(28)}
                        color={theme.tabIconDefault}
                      />
                      <Text
                        style={[
                          styles.emptyText,
                          { color: theme.tabIconDefault },
                        ]}
                      >
                        No comments yet. Be the first to respond!
                      </Text>
                    </View>
                  ) : null
                }
              />
            )}
          </View>

          {/*
            //UPDATED : KeyboardStickyView keeps the composer glued above the
            keyboard instead of letting the system keyboard cover it.
            Docs: https://kirillzyusko.github.io/react-native-keyboard-controller/docs/api/components/keyboard-sticky-view
            KeyboardProvider is already wrapping the app in app/_layout.tsx.
          */}
          <KeyboardStickyView
            offset={{
              closed: 0,
              // Small extra lift on iOS so the input is never flush against
              // the keyboard top edge.
              opened: Platform.OS === "ios" ? 8 : 0,
            }}
          >
            <View
              style={[
                styles.composer,
                {
                  backgroundColor: theme.surface,
                  borderTopColor:
                    colorScheme === "light" ? "#E5E7EB" : theme.inputBorder,
                },
              ]}
            >
              {replyTo && (
                <View style={styles.replyBanner}>
                  <Text
                    style={[styles.replyBannerText, { color: theme.text }]}
                    numberOfLines={1}
                  >
                    Replying to {replyTo.name}
                  </Text>
                  <TouchableOpacity
                    onPress={cancelReply}
                    disabled={submitting}
                    hitSlop={8}
                  >
                    <Ionicons
                      name="close-circle"
                      size={moderateScale(18)}
                      color={theme.tabIconDefault}
                    />
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.composerRow}>
                <TextInput
                  ref={inputRef}
                  style={[
                    styles.input,
                    {
                      color: theme.text,
                      backgroundColor:
                        colorScheme === "light" ? "#F3F4F6" : "#111827",
                    },
                  ]}
                  placeholder={
                    replyTo ? "Write a reply..." : "Add a comment..."
                  }
                  placeholderTextColor={theme.placeholder}
                  value={text}
                  onChangeText={setText}
                  editable={!submitting && !loading}
                  multiline
                  maxLength={1000}
                  returnKeyType="send"
                  onSubmitEditing={handleSubmit}
                  // //UPDATED : when keyboard opens, auto-expand sheet to full
                  // so the user has room to see the thread above the input.
                  onFocus={() => {
                    sheetHeight.value = withSpring(SNAP_FULL, {
                      damping: 20,
                      stiffness: 180,
                    });
                  }}
                />
                <TouchableOpacity
                  style={[
                    styles.sendBtn,
                    {
                      backgroundColor: theme.primary,
                      opacity: !text.trim() || submitting || loading ? 0.5 : 1,
                    },
                  ]}
                  activeOpacity={0.8}
                  disabled={!text.trim() || submitting || loading}
                  onPress={handleSubmit}
                  accessibilityLabel="Send comment"
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons
                      name="send"
                      size={moderateScale(18)}
                      color="#FFFFFF"
                    />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardStickyView>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    overflow: "hidden",
    width: "100%",
    // Height is driven by animatedSheetStyle — do not set a fixed height here.
  },
  // Larger hit area so the handle is easy to grab
  handleHitArea: {
    alignItems: "center",
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(4),
  },
  handle: {
    width: scale(40),
    height: verticalScale(5),
    borderRadius: 3,
    backgroundColor: "#D9D9D9",
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
  },
  backBtn: {
    width: moderateScale(36),
    height: moderateScale(36),
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: moderateScale(16),
    fontWeight: "700",
  },
  listWrap: {
    flex: 1,
    minHeight: 0, // required so FlatList can shrink inside animated height
  },
  listContent: {
    paddingHorizontal: scale(14),
    paddingBottom: verticalScale(8),
  },
  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: verticalScale(40),
    gap: verticalScale(12),
  },
  errorText: {
    fontSize: moderateScale(13),
    textAlign: "center",
    paddingHorizontal: scale(24),
  },
  retryBtn: {
    paddingHorizontal: scale(18),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(20),
  },
  retryBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: moderateScale(12),
  },
  emptyBox: {
    alignItems: "center",
    paddingVertical: verticalScale(28),
    gap: verticalScale(8),
  },
  emptyText: {
    fontSize: moderateScale(12.5),
    textAlign: "center",
  },

  // ── Original post card ──
  postCard: {
    borderRadius: moderateScale(14),
    borderWidth: 1,
    padding: scale(12),
    marginBottom: verticalScale(12),
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: verticalScale(8),
  },
  postHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: scale(8),
  },
  postAvatar: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
  },
  postAvatarPlaceholder: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    color: "#FFFFFF",
    fontSize: moderateScale(12),
    fontWeight: "700",
  },
  postHeaderText: {
    marginLeft: scale(8),
    flex: 1,
  },
  // //NEW ADDITION : name + score sit on one line in the modal post header
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    flexShrink: 1,
  },
  postAuthor: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
    flexShrink: 1,
  },
  postMeta: {
    fontSize: moderateScale(10.5),
    marginTop: verticalScale(1),
  },
  followBtn: {
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(16),
  },
  followBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(11),
    fontWeight: "700",
  },
  postContent: {
    fontSize: moderateScale(12.5),
    lineHeight: verticalScale(18),
    marginBottom: verticalScale(10),
  },
  imagesRow: {
    flexDirection: "row",
    gap: scale(6),
    marginBottom: verticalScale(10),
  },
  postImage: {
    flex: 1,
    height: verticalScale(72),
    borderRadius: moderateScale(8),
  },
  postImageSingle: {
    height: verticalScale(120),
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(6),
  },
  tagChip: {
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderRadius: moderateScale(10),
  },
  tagChipText: {
    fontSize: moderateScale(10),
    fontWeight: "600",
  },
  commentsCountLabel: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    marginBottom: verticalScale(12),
  },

  // ── Comment rows ──
  commentBlock: {
    marginBottom: verticalScale(16),
  },
  commentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  commentAvatar: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
  },
  commentAvatarPlaceholder: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    alignItems: "center",
    justifyContent: "center",
  },
  commentBody: {
    flex: 1,
    marginLeft: scale(8),
    marginRight: scale(6),
  },
  commentHeaderLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    marginBottom: verticalScale(2),
  },
  commentAuthor: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    flexShrink: 1,
  },
  // //NEW ADDITION : shared subtle reputation badge (star + number)
  reputationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(2),
    paddingHorizontal: scale(5),
    paddingVertical: verticalScale(1),
    borderRadius: moderateScale(8),
    backgroundColor: "rgba(245, 158, 11, 0.12)",
  },
  reputationText: {
    fontSize: moderateScale(10),
    fontWeight: "700",
    color: "#D97706",
  },
  commentTime: {
    fontSize: moderateScale(10.5),
  },
  commentText: {
    fontSize: moderateScale(12.5),
    lineHeight: verticalScale(18),
    marginBottom: verticalScale(6),
  },
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: scale(8),
  },
  markPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(3),
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(14),
  },
  markPillOutline: {
    borderWidth: 1,
    borderColor: "#16A34A",
    backgroundColor: "transparent",
  },
  markPillSolved: {
    backgroundColor: "#DCFCE7",
    borderWidth: 1,
    borderColor: "#86EFAC",
  },
  markPillHelpful: {
    backgroundColor: "#DCFCE7",
    borderWidth: 1,
    borderColor: "#86EFAC",
  },
  markPillText: {
    fontSize: moderateScale(11),
    fontWeight: "600",
  },
  markPillTextActive: {
    color: "#16A34A",
  },
  replyButton: {
    paddingVertical: verticalScale(2),
  },
  replyButtonText: {
    fontSize: moderateScale(11.5),
    fontWeight: "600",
  },
  miniFollow: {
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(5),
    borderRadius: moderateScale(14),
  },
  miniFollowText: {
    color: "#FFFFFF",
    fontSize: moderateScale(10),
    fontWeight: "700",
  },

  // Nested reply
  replyRow: {
    flexDirection: "row",
    marginLeft: scale(42),
    marginTop: verticalScale(10),
  },
  replyAvatar: {
    width: moderateScale(26),
    height: moderateScale(26),
    borderRadius: moderateScale(13),
  },
  replyAvatarPlaceholder: {
    width: moderateScale(26),
    height: moderateScale(26),
    borderRadius: moderateScale(13),
    alignItems: "center",
    justifyContent: "center",
  },
  replyAvatarInitials: {
    color: "#FFFFFF",
    fontSize: moderateScale(9),
    fontWeight: "700",
  },
  replyBody: {
    flex: 1,
    marginLeft: scale(8),
  },
  authorBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: scale(6),
    paddingVertical: verticalScale(1),
    borderRadius: moderateScale(6),
  },
  authorBadgeText: {
    color: "#DC2626",
    fontSize: moderateScale(9),
    fontWeight: "700",
  },

  // Composer
  composer: {
    borderTopWidth: 1,
    paddingHorizontal: scale(12),
    paddingTop: verticalScale(8),
    paddingBottom: verticalScale(6),
  },
  replyBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: verticalScale(6),
    paddingHorizontal: scale(4),
  },
  replyBannerText: {
    fontSize: moderateScale(11.5),
    fontWeight: "600",
    flex: 1,
  },
  composerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: scale(8),
  },
  input: {
    flex: 1,
    minHeight: verticalScale(40),
    maxHeight: verticalScale(100),
    borderRadius: moderateScale(20),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(10),
    fontSize: moderateScale(13),
  },
  sendBtn: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    alignItems: "center",
    justifyContent: "center",
  },
});
