// components/community/PostCard.tsx
// One post in the Community feed. Matches the screenshot layout: avatar
// + name + region/time + Follow button, post text, up to 3 images, tag
// chips, then a like/comment footer.
//
// Follow, opening the full post, and the comment icon all point at
// screens/features that do not exist yet in this step-by-step build, so
// they stay visible and tappable (per instruction, not hidden) but show
// a plain "Coming soon" message instead of navigating anywhere. Liking a
// post IS wired to the real backend, since that endpoint already exists.

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { CommunityPost } from "@/types/community";
import { formatRelativeTime } from "@/utils/timeFormat";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Alert,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";

interface PostCardProps {
  post: CommunityPost;
  onLikePress: (postId: string) => void;
  isLiking: boolean;
}

// A small helper local to this file. `GestureResponderEvent` is the type
// React Native gives every onPress handler; we only need `.stopPropagation`
// off it here, so it is typed loosely as `{ stopPropagation: () => void }`
// rather than importing the full RN event type just for this one call.
function stopBubble(e: { stopPropagation: () => void }) {
  // Prevents a tap on a button INSIDE the card (Follow, like, comment)
  // from also triggering the card's own onPress (which opens the post).
  e.stopPropagation();
}

export default function PostCard({
  post,
  onLikePress,
  isLiking,
}: PostCardProps) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  const showComingSoon = (feature: string) => {
    Alert.alert(
      "Coming soon",
      `${feature} will be available in a future update.`,
    );
  };

  // Simple initials fallback for authors without an avatar photo yet,
  // e.g. "Kofi Mensah" -> "KM".
  const initials = post.author.fullName
    .split(" ")
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.inputBorder },
      ]}
      activeOpacity={0.85}
      onPress={() => showComingSoon("Viewing the full post")}
    >
      {/* ── Header: avatar, name, region + time, Follow button ── */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          {post.author.avatarUrl ? (
            <Image
              source={{ uri: post.author.avatarUrl }}
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

          <View style={styles.headerTextBlock}>
            <Text
              style={[styles.authorName, { color: theme.text }]}
              numberOfLines={1}
            >
              {post.author.fullName}
            </Text>
            <Text
              style={[styles.metaText, { color: theme.icon }]}
              numberOfLines={1}
            >
              {post.region ? `${post.region} Region` : "Location not set"}
              {"  \u00B7  "}
              {formatRelativeTime(post.createdAt)}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.followButton, { backgroundColor: theme.primary }]}
          activeOpacity={0.8}
          onPress={(e) => {
            stopBubble(e);
            showComingSoon("Following farmers");
          }}
        >
          <Text style={styles.followButtonText}>Follow</Text>
        </TouchableOpacity>
      </View>

      {/* ── Post text ── */}
      <Text style={[styles.content, { color: theme.text }]} numberOfLines={4}>
        {post.content}
      </Text>

      {/* ── Images (up to 3) ── */}
      {post.imageUrls.length > 0 && (
        <View style={styles.imagesRow}>
          {post.imageUrls.slice(0, 3).map((url, idx) => (
            <Image
              key={`${post.id}-img-${idx}`}
              source={{ uri: url }}
              style={[
                styles.postImage,
                // A single image gets more width so it does not look
                // tiny next to two empty slots.
                post.imageUrls.length === 1 && styles.postImageSingle,
              ]}
              resizeMode="cover"
            />
          ))}
        </View>
      )}

      {/* ── Tag chips ── */}
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

      {/* ── Footer: like + comment counts ── */}
      <View style={styles.footerRow}>
        <TouchableOpacity
          style={styles.footerAction}
          activeOpacity={0.7}
          disabled={isLiking}
          onPress={(e) => {
            stopBubble(e);
            onLikePress(post.id);
          }}
        >
          <Ionicons
            name={post.isLiked ? "heart" : "heart-outline"}
            size={moderateScale(18)}
            color={post.isLiked ? "#EF4444" : theme.icon}
          />
          <Text style={[styles.footerActionText, { color: theme.icon }]}>
            {post.likesCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerAction}
          activeOpacity={0.7}
          onPress={(e) => {
            stopBubble(e);
            showComingSoon("Comments");
          }}
        >
          <Ionicons
            name="chatbubble-outline"
            size={moderateScale(16)}
            color={theme.icon}
          />
          <Text style={[styles.footerActionText, { color: theme.icon }]}>
            {post.commentsCount}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: moderateScale(14),
    borderWidth: 1,
    padding: scale(12),
    marginBottom: verticalScale(14),
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: verticalScale(8),
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: scale(8),
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
    color: "#FFFFFF",
    fontSize: moderateScale(13),
    fontWeight: "700",
  },
  headerTextBlock: {
    marginLeft: scale(8),
    flex: 1,
  },
  authorName: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
  },
  metaText: {
    fontSize: moderateScale(10.5),
    marginTop: verticalScale(1),
  },
  followButton: {
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(16),
  },
  followButtonText: {
    color: "#FFFFFF",
    fontSize: moderateScale(11),
    fontWeight: "700",
  },
  content: {
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
    height: verticalScale(80),
    borderRadius: moderateScale(8),
  },
  postImageSingle: {
    height: verticalScale(140),
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(6),
    marginBottom: verticalScale(10),
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
  footerRow: {
    flexDirection: "row",
    gap: scale(18),
  },
  footerAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
  },
  footerActionText: {
    fontSize: moderateScale(11.5),
    fontWeight: "600",
  },
});
