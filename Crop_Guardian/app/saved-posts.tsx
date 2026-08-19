// app/saved-posts.tsx

import CommentsModal from "@/components/community/CommentsModal";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useCommunityStore } from "@/stores/communityStore";
import type { CommunityPost } from "@/types/community";
import { formatRelativeTime } from "@/utils/timeFormat";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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

export default function SavedPostsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  const {
    savedPosts,
    savedLoading,
    savedRefreshing,
    savedLoadingMore,
    savedError,
    savingPostIds,
    fetchSavedPostsList,
    refreshSavedPosts,
    loadMoreSavedPosts,
    toggleSave,
  } = useCommunityStore();

  const [commentsPost, setCommentsPost] = useState<CommunityPost | null>(null);

  useEffect(() => {
    fetchSavedPostsList({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderRow = ({ item }: { item: CommunityPost }) => {
    const initials = item.author.fullName
      .split(" ")
      .map((p) => p.charAt(0))
      .slice(0, 2)
      .join("")
      .toUpperCase();

    const thumb = item.imageUrls[0];
    const isSaving = Boolean(savingPostIds[item.id]);

    return (
      <TouchableOpacity
        style={[
          styles.rowCard,
          {
            backgroundColor: theme.surface,
            borderColor: theme.inputBorder,
          },
        ]}
        activeOpacity={0.85}
        onPress={() => setCommentsPost(item)}
      >
        <View style={styles.rowLeft}>
          {item.author.avatarUrl ? (
            <Image
              source={{ uri: item.author.avatarUrl }}
              style={styles.avatar}
            />
          ) : (
            <View
              style={[
                styles.avatarPlaceholder,
                { backgroundColor: theme.primary },
              ]}
            >
              <Text style={styles.avatarInitials}>{initials || "?"}</Text>
            </View>
          )}

          <View style={styles.rowTextBlock}>
            <View style={styles.nameTimeRow}>
              <Text
                style={[styles.authorName, { color: theme.text }]}
                numberOfLines={1}
              >
                {item.author.fullName}
              </Text>
              <Text style={[styles.timeText, { color: theme.icon }]}>
                {formatRelativeTime(item.savedAt ?? item.createdAt)}
              </Text>
            </View>
            <Text
              style={[styles.previewText, { color: theme.text }]}
              numberOfLines={2}
            >
              {item.content}
            </Text>
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

          <TouchableOpacity
            style={styles.unsaveBtn}
            disabled={isSaving}
            onPress={() => toggleSave(item.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="bookmark"
              size={moderateScale(18)}
              color={theme.primary}
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
        >
          <Ionicons
            name="arrow-back"
            size={moderateScale(22)}
            color={theme.primary}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.primary }]}>
          Saved Posts
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={savedPosts}
        keyExtractor={(item) => item.id}
        renderItem={renderRow}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={savedRefreshing}
            onRefresh={refreshSavedPosts}
            tintColor={theme.primary}
          />
        }
        onEndReached={loadMoreSavedPosts}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          !savedLoading ? (
            <View style={styles.emptyBox}>
              <Ionicons
                name="bookmark-outline"
                size={moderateScale(36)}
                color={theme.icon}
              />
              <Text style={[styles.emptyText, { color: theme.icon }]}>
                {savedError ?? "You have not saved any posts yet"}
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
          savedLoadingMore ? (
            <ActivityIndicator
              style={{ marginVertical: 16 }}
              color={theme.primary}
            />
          ) : null
        }
      />

      <CommentsModal
        visible={commentsPost !== null}
        post={commentsPost}
        onClose={() => setCommentsPost(null)}
        onCommentAdded={() => refreshSavedPosts()}
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
  avatar: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
  },
  avatarPlaceholder: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: moderateScale(12),
  },
  rowTextBlock: {
    flex: 1,
    marginLeft: scale(10),
  },
  nameTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: scale(8),
  },
  authorName: {
    fontSize: moderateScale(13),
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
  unsaveBtn: {
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
  },
});
