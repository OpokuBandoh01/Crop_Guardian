// app/create-post.tsx
// Create Post screen. Matches the mockup's layout, with three
// corrections to match what the live backend actually accepts:
//   1. Photos capped at 3, not 4 (backend rejects a 4th image outright).
//   2. Character limit is 2000, not 500 (the real Zod rule on the post's
//      `content` field).
//   3. Tags are picked from the real backend-seeded tag list, there is
//      no way to add a brand-new tag from the app, so "+ Add tag" was
//      replaced with a plain multi-select chip list.
// "Category" (required) and "Tags" (optional) both end up inside the
// same `tagIds` array the backend expects, Category is just always
// included as the first entry.

import SelectModal, {
    SelectModalOption,
} from "@/components/community/SelectModal";
import { CROP_TYPE_OPTIONS } from "@/constants/cropTypeOptions";
import { GHANA_REGIONS } from "@/constants/ghanaRegions";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { createCommunityPost } from "@/services/communityApi";
import { useCommunityStore } from "@/stores/communityStore";
import type { CropType } from "@/types/user";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";

const MAX_CONTENT_LENGTH = 2000; // real backend limit, not the mockup's 500
const MAX_IMAGES = 3; // real backend limit, not the mockup's 4

export default function CreatePostScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  // Reuses the same tags already fetched for the main feed's Categories
  // row, but refetches here too in case this screen is ever reached
  // without the feed having loaded first (e.g. a future deep link).
  const { tags, tagsLoading, fetchTags, refreshPosts } = useCommunityStore();

  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [categoryTagId, setCategoryTagId] = useState<string | null>(null);
  const [cropType, setCropType] = useState<CropType | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [showRegionModal, setShowRegionModal] = useState(false);

  useEffect(() => {
    if (tags.length === 0) {
      fetchTags();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // `useMemo` recalculates this list only when `tags` actually changes,
  // instead of rebuilding it on every keystroke in the content box.
  const categoryOptions: SelectModalOption[] = useMemo(
    () => tags.map((tag) => ({ label: tag.name, value: tag.id })),
    [tags],
  );

  const cropOptions: SelectModalOption[] = useMemo(
    () => CROP_TYPE_OPTIONS.map((c) => ({ label: c.label, value: c.value })),
    [],
  );

  const regionOptions: SelectModalOption[] = useMemo(
    () => GHANA_REGIONS.map((r) => ({ label: r, value: r })),
    [],
  );

  const selectedCategoryLabel =
    categoryOptions.find((o) => o.value === categoryTagId)?.label ?? null;
  const selectedCropLabel =
    cropOptions.find((o) => o.value === cropType)?.label ?? null;

  const isValid = content.trim().length > 0 && categoryTagId !== null;

  const toggleExtraTag = (tagId: string) => {
    if (submitting) return;
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  };

  const handleAddImage = () => {
    if (submitting || images.length >= MAX_IMAGES) return;

    Alert.alert("Add a Photo", "Choose where to get the image from.", [
      { text: "Take Photo", onPress: () => pickImage("camera") },
      { text: "Choose from Gallery", onPress: () => pickImage("gallery") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const pickImage = async (source: "camera" | "gallery") => {
    try {
      if (source === "camera") {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            "Permission needed",
            "Camera access is required to take a photo.",
          );
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          quality: 0.7,
        });

        if (!result.canceled && result.assets?.[0]?.uri) {
          setImages((prev) =>
            [...prev, result.assets[0].uri].slice(0, MAX_IMAGES),
          );
        }
      } else {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            "Permission needed",
            "Photo library access is required to choose an image.",
          );
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          quality: 0.7,
          allowsMultipleSelection: true,
          selectionLimit: MAX_IMAGES - images.length,
        });

        if (!result.canceled && result.assets.length > 0) {
          const newUris = result.assets.map((asset) => asset.uri);
          setImages((prev) => [...prev, ...newUris].slice(0, MAX_IMAGES));
        }
      }
    } catch (err) {
      console.error("Image picker error:", err);
      Alert.alert(
        "Something went wrong",
        "Could not open the image picker. Please try again.",
      );
    }
  };

  const removeImage = (index: number) => {
    if (submitting) return;
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setErrorMessage(null);
    setSubmitting(true);

    // The category is always included first, extra tags follow. A `Set`
    // here just de-duplicates in case a user's chosen category also
    // happens to be toggled on in the extra-tags list.
    const tagIds = Array.from(
      new Set([categoryTagId as string, ...selectedTagIds]),
    );

    try {
      await createCommunityPost({
        content: content.trim(),
        tagIds,
        region: region ?? undefined,
        cropType: cropType ?? undefined,
        images,
      });

      // Refresh the main feed in the background so the new post is
      // there by the time the user lands back on it.
      refreshPosts();

      Alert.alert("Post created", "Your post is now live in the community.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      console.error("Failed to create post:", err);
      // Secure, non-leaky fallback message — never render a raw backend
      // error string (which can be an unformatted Zod issue array) to
      // the user, per project convention.
      const backendMessage = err?.response?.data?.message;
      setErrorMessage(
        typeof backendMessage === "string" && backendMessage.length < 120
          ? backendMessage
          : "Could not create your post. Please check your connection and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      edges={["top", "left", "right"]}
    >
      {/* ── Header ── */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={[styles.backButton, { borderColor: theme.primary }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
          disabled={submitting}
        >
          <Ionicons
            name="arrow-back"
            size={moderateScale(18)}
            color={theme.primary}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Create Post
        </Text>
        {/* Empty spacer so the title stays visually centered against the
            back button on the left. */}
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Content textarea ── */}
        <View
          style={[
            styles.contentBox,
            { backgroundColor: theme.surface, borderColor: theme.inputBorder },
          ]}
        >
          <TextInput
            style={[styles.contentInput, { color: theme.text }]}
            placeholder="What is happening in your farm?"
            placeholderTextColor={theme.placeholder}
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={MAX_CONTENT_LENGTH}
            editable={!submitting}
          />
          <Text style={[styles.charCount, { color: theme.icon }]}>
            {content.length}/{MAX_CONTENT_LENGTH}
          </Text>
        </View>

        {/* ── Add Photos ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionLabel, { color: theme.primary }]}>
            Add Photos (max {MAX_IMAGES})
          </Text>
          <Text style={[styles.sectionCount, { color: theme.icon }]}>
            {images.length}/{MAX_IMAGES}
          </Text>
        </View>

        <View style={styles.photosRow}>
          {images.map((uri, index) => (
            <View key={uri} style={styles.photoSlotFilled}>
              <Image source={{ uri }} style={styles.photoImage} />
              <TouchableOpacity
                style={styles.removePhotoButton}
                onPress={() => removeImage(index)}
                disabled={submitting}
                hitSlop={6}
              >
                <Ionicons
                  name="close-circle"
                  size={moderateScale(18)}
                  color="#EF4444"
                />
              </TouchableOpacity>
            </View>
          ))}

          {images.length < MAX_IMAGES && (
            <TouchableOpacity
              style={[
                styles.photoSlotEmpty,
                { borderColor: theme.inputBorder },
              ]}
              onPress={handleAddImage}
              activeOpacity={0.7}
              disabled={submitting}
            >
              <Ionicons
                name="camera-outline"
                size={moderateScale(22)}
                color={theme.primary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Category (required) ── */}
        <Text style={[styles.fieldLabel, { color: theme.primary }]}>
          Category *
        </Text>
        <TouchableOpacity
          style={[
            styles.dropdownField,
            { backgroundColor: theme.surface, borderColor: theme.inputBorder },
          ]}
          onPress={() => setShowCategoryModal(true)}
          activeOpacity={0.7}
          disabled={submitting || tagsLoading}
        >
          <Text
            style={[
              styles.dropdownText,
              {
                color: selectedCategoryLabel ? theme.text : theme.placeholder,
              },
            ]}
          >
            {selectedCategoryLabel ??
              (tagsLoading ? "Loading categories..." : "Select a category")}
          </Text>
          <Ionicons
            name="chevron-down"
            size={moderateScale(16)}
            color={theme.icon}
          />
        </TouchableOpacity>

        {/* ── Crop Type (optional) ── */}
        <Text style={[styles.fieldLabel, { color: theme.primary }]}>
          Crop Type
        </Text>
        <TouchableOpacity
          style={[
            styles.dropdownField,
            { backgroundColor: theme.surface, borderColor: theme.inputBorder },
          ]}
          onPress={() => setShowCropModal(true)}
          activeOpacity={0.7}
          disabled={submitting}
        >
          <Text
            style={[
              styles.dropdownText,
              { color: selectedCropLabel ? theme.text : theme.placeholder },
            ]}
          >
            {selectedCropLabel ?? "Select a crop (optional)"}
          </Text>
          <Ionicons
            name="chevron-down"
            size={moderateScale(16)}
            color={theme.icon}
          />
        </TouchableOpacity>

        {/* ── Region/District (optional) ── */}
        <Text style={[styles.fieldLabel, { color: theme.primary }]}>
          Region/District
        </Text>
        <TouchableOpacity
          style={[
            styles.dropdownField,
            { backgroundColor: theme.surface, borderColor: theme.inputBorder },
          ]}
          onPress={() => setShowRegionModal(true)}
          activeOpacity={0.7}
          disabled={submitting}
        >
          <Text
            style={[
              styles.dropdownText,
              { color: region ? theme.text : theme.placeholder },
            ]}
          >
            {region ?? "Select a region (optional)"}
          </Text>
          <Ionicons
            name="chevron-down"
            size={moderateScale(16)}
            color={theme.icon}
          />
        </TouchableOpacity>

        {/* ── Tags (optional, picked from real backend list) ── */}
        <Text style={[styles.fieldLabel, { color: theme.primary }]}>
          Tags (optional)
        </Text>
        <View style={styles.tagsWrap}>
          {tags
            .filter((tag) => tag.id !== categoryTagId)
            .map((tag) => {
              const isSelected = selectedTagIds.includes(tag.id);
              return (
                <TouchableOpacity
                  key={tag.id}
                  style={[
                    styles.tagChip,
                    {
                      backgroundColor: isSelected
                        ? theme.primary
                        : colorScheme === "light"
                          ? "#EBF7E9"
                          : "#1E2C20",
                    },
                  ]}
                  onPress={() => toggleExtraTag(tag.id)}
                  activeOpacity={0.7}
                  disabled={submitting}
                >
                  <Text
                    style={[
                      styles.tagChipText,
                      { color: isSelected ? "#FFFFFF" : theme.primary },
                    ]}
                  >
                    #{tag.name.replace(/\s+/g, "")}
                  </Text>
                </TouchableOpacity>
              );
            })}
        </View>

        {errorMessage && (
          <Text style={[styles.errorText, { color: "#EF4444" }]}>
            {errorMessage}
          </Text>
        )}

        {/* ── Submit ── */}
        <TouchableOpacity
          style={[
            styles.postButton,
            {
              backgroundColor: theme.primary,
              opacity: !isValid || submitting ? 0.5 : 1,
            },
          ]}
          onPress={handleSubmit}
          activeOpacity={0.85}
          disabled={!isValid || submitting}
        >
          <Text style={styles.postButtonText}>
            {submitting ? "Posting..." : "Post"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <SelectModal
        visible={showCategoryModal}
        title="Select a category"
        options={categoryOptions}
        selectedValue={categoryTagId}
        onSelect={(value) => setCategoryTagId(value)}
        onClose={() => setShowCategoryModal(false)}
      />

      <SelectModal
        visible={showCropModal}
        title="Select a crop"
        options={cropOptions}
        selectedValue={cropType}
        onSelect={(value) => setCropType(value as CropType)}
        onClose={() => setShowCropModal(false)}
      />

      <SelectModal
        visible={showRegionModal}
        title="Select a region"
        options={regionOptions}
        selectedValue={region}
        onSelect={(value) => setRegion(value)}
        onClose={() => setShowRegionModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(8),
    paddingBottom: verticalScale(12),
  },
  backButton: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: moderateScale(17),
    fontWeight: "700",
  },
  headerSpacer: {
    width: moderateScale(34),
  },
  scrollContent: {
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(60),
  },
  contentBox: {
    borderWidth: 1,
    borderRadius: moderateScale(12),
    padding: scale(12),
    minHeight: verticalScale(110),
    marginBottom: verticalScale(18),
  },
  contentInput: {
    fontSize: moderateScale(13),
    lineHeight: verticalScale(19),
    minHeight: verticalScale(70),
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: moderateScale(10.5),
    textAlign: "right",
    marginTop: verticalScale(4),
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(8),
  },
  sectionLabel: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
  },
  sectionCount: {
    fontSize: moderateScale(11),
    fontWeight: "600",
  },
  photosRow: {
    flexDirection: "row",
    gap: scale(10),
    marginBottom: verticalScale(20),
  },
  photoSlotEmpty: {
    width: moderateScale(64),
    height: moderateScale(64),
    borderRadius: moderateScale(10),
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  photoSlotFilled: {
    width: moderateScale(64),
    height: moderateScale(64),
    borderRadius: moderateScale(10),
    overflow: "visible",
  },
  photoImage: {
    width: "100%",
    height: "100%",
    borderRadius: moderateScale(10),
  },
  removePhotoButton: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(10),
  },
  fieldLabel: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    marginBottom: verticalScale(6),
  },
  dropdownField: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: moderateScale(10),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(12),
    marginBottom: verticalScale(16),
  },
  dropdownText: {
    fontSize: moderateScale(12.5),
  },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(8),
    marginBottom: verticalScale(20),
  },
  tagChip: {
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(14),
  },
  tagChipText: {
    fontSize: moderateScale(11),
    fontWeight: "600",
  },
  errorText: {
    fontSize: moderateScale(12),
    marginBottom: verticalScale(12),
    textAlign: "center",
  },
  postButton: {
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(14),
    alignItems: "center",
    justifyContent: "center",
    marginTop: verticalScale(4),
  },
  postButtonText: {
    color: "#FFFFFF",
    fontSize: moderateScale(14),
    fontWeight: "700",
  },
});
