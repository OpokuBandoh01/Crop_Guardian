// components/community/PostCard.tsx
// //UPDATED : wired the comment icon to open the Comments slide-up modal
//            instead of the previous "Coming soon" Alert.
// //UPDATED : show author reputationScore next to the name (subtle star + number).
// //NO CHANGES to layout structure, like handling, or Follow button behavior.
//
// One post in the Community feed. Matches the screenshot layout: avatar
// + name + region/time + Follow button, post text, up to 3 images, tag
// chips, then a like/comment footer.

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
  // //NEW ADDITION : opens the Comments modal for this post
  onCommentPress: (post: CommunityPost) => void;
}

function stopBubble(e: { stopPropagation: () => void }) {
  e.stopPropagation();
}

export default function PostCard({
  post,
  onLikePress,
  isLiking,
  onCommentPress, // //NEW ADDITION
}: PostCardProps) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  const showComingSoon = (feature: string) => {
    Alert.alert(
      "Coming soon",
      `${feature} will be available in a future update.`,
    );
  };

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
      // //NO CHANGES : full-post view still coming soon
      onPress={() => showComingSoon("Viewing the full post")}
    >
      {/* //NO CHANGES */}
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
            {/* //UPDATED : name row now includes reputation score beside the name */}
            <View style={styles.nameRow}>
              <Text
                style={[styles.authorName, { color: theme.text }]}
                numberOfLines={1}
              >
                {post.author.fullName}
              </Text>
              {/* //NEW ADDITION : subtle reputation badge (star + score) for social proof */}
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
            {/* //NO CHANGES : region + relative time meta line */}
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

        {/* //NO CHANGES : Follow still coming soon */}
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

      {/* //NO CHANGES */}
      <Text style={[styles.content, { color: theme.text }]} numberOfLines={4}>
        {post.content}
      </Text>

      {/* //NO CHANGES */}
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

      {/* //NO CHANGES */}
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

      <View style={styles.footerRow}>
        {/* //NO CHANGES : like still wired to backend */}
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

        {/* //UPDATED : open Comments modal instead of Coming soon Alert */}
        <TouchableOpacity
          style={styles.footerAction}
          activeOpacity={0.7}
          onPress={(e) => {
            stopBubble(e);
            onCommentPress(post);
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

// //UPDATED : added nameRow + reputationBadge styles; everything else unchanged
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
  // //NEW ADDITION : horizontal row so name + score sit on one line
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    flexShrink: 1,
  },
  authorName: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
    flexShrink: 1,
  },
  // //NEW ADDITION : small star + score badge (subtle, not heavy)
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
    fontSize: moderateScale(10.5),
    fontWeight: "700",
    color: "#D97706",
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
