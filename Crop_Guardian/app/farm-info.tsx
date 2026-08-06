import { ConfirmDeleteModal } from "@/components/crops/ConfirmDeleteModal";
import { CropCard } from "@/components/crops/CropCard2";
import { CropFormModal } from "@/components/crops/CropFormModal";
import { getCropLabel } from "@/constants/cropOptions";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useMyCrops } from "@/hooks/useMyCrops";
import type { TrackedCrop } from "@/types/crops";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";

export default function FarmInfoScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  const {
    crops,
    loading,
    refreshing,
    error,
    refetch,
    addCrop,
    editCrop,
    removeCrop,
  } = useMyCrops();

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editingCrop, setEditingCrop] = useState<TrackedCrop | null>(null);
  const [deletingCrop, setDeletingCrop] = useState<TrackedCrop | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState<string | null>(null);

  const highRiskCount = crops.filter((c) => c.riskLevel === "HIGH").length;

  const flashSuccess = (message: string) => {
    setShowSuccess(message);
    setTimeout(() => setShowSuccess(null), 2500);
  };

  const handleAddSubmit = async (
    payload: Parameters<
      NonNullable<React.ComponentProps<typeof CropFormModal>["onSubmitAdd"]>
    >[0],
  ) => {
    setSaving(true);
    setActionError(null);
    const result = await addCrop(payload);
    setSaving(false);

    if (result.success) {
      setAddModalVisible(false);
      flashSuccess(`${getCropLabel(payload.cropType)} added to your crops.`);
    } else {
      setActionError(result.message || "Could not add this crop.");
    }
  };

  const handleEditSubmit = async (
    payload: Parameters<
      NonNullable<React.ComponentProps<typeof CropFormModal>["onSubmitEdit"]>
    >[0],
  ) => {
    if (!editingCrop) return;
    setSaving(true);
    setActionError(null);
    const result = await editCrop(editingCrop.cropType, payload);
    setSaving(false);

    if (result.success) {
      setEditingCrop(null);
      flashSuccess("Crop details updated.");
    } else {
      setActionError(result.message || "Could not update this crop.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCrop) return;
    setDeleting(true);
    const result = await removeCrop(deletingCrop.cropType);
    setDeleting(false);
    setDeletingCrop(null);

    if (result.success) {
      flashSuccess("Crop removed.");
    } else {
      setActionError(result.message || "Could not remove this crop.");
    }
  };

  const isBusy = loading || saving || deleting;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top", "left", "right"]}
    >
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={[
            styles.backButton,
            { borderColor: theme.primary, opacity: isBusy ? 0.5 : 1 },
          ]}
          onPress={() => router.back()}
          activeOpacity={0.7}
          disabled={isBusy}
        >
          <Ionicons
            name="arrow-back"
            size={moderateScale(18)}
            color={theme.primary}
          />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.primary }]}>
          My Crops
        </Text>

        <TouchableOpacity
          style={[styles.addButton, { opacity: isBusy ? 0.5 : 1 }]}
          onPress={() => setAddModalVisible(true)}
          activeOpacity={0.7}
          disabled={isBusy}
        >
          <Ionicons name="add" size={moderateScale(20)} color="#094A04" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refetch}
            tintColor={theme.primary}
          />
        }
      >
        {showSuccess && (
          <View style={styles.successBanner}>
            <Ionicons
              name="checkmark-circle"
              size={moderateScale(15)}
              color="#FFFFFF"
            />
            <Text style={styles.successText}>{showSuccess}</Text>
          </View>
        )}

        {actionError && (
          <View style={styles.errorBanner}>
            <Ionicons
              name="alert-circle-outline"
              size={moderateScale(15)}
              color="#FFFFFF"
            />
            <Text style={styles.errorBannerText}>{actionError}</Text>
          </View>
        )}

        {/* Summary card, built entirely from real fetched data, no mock
            farm name/soil/irrigation fields, since the backend has no
            concept of those. */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryStatItem}>
            <Text style={styles.summaryStatVal}>{crops.length}</Text>
            <Text style={styles.summaryStatLabel}>Tracked Crops</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryStatItem}>
            <Text
              style={[
                styles.summaryStatVal,
                highRiskCount > 0 && { color: "#DC2626" },
              ]}
            >
              {highRiskCount}
            </Text>
            <Text style={styles.summaryStatLabel}>High Risk</Text>
          </View>
        </View>

        {loading && crops.length === 0 ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={theme.primary} />
          </View>
        ) : crops.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="leaf-outline"
              size={moderateScale(32)}
              color="#A3C89E"
            />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              No crops tracked yet
            </Text>
            <Text style={styles.emptyHint}>
              Add a crop to start tracking its health, risk level, and scan
              history.
            </Text>
          </View>
        ) : (
          crops.map((crop) => (
            <CropCard
              key={crop.cropType}
              crop={crop}
              onPress={() => setEditingCrop(crop)}
              onDelete={() => setDeletingCrop(crop)}
              disabled={isBusy}
            />
          ))
        )}
      </ScrollView>

      <CropFormModal
        visible={addModalVisible}
        mode="add"
        alreadyTrackedTypes={crops.map((c) => c.cropType)}
        saving={saving}
        onClose={() => {
          setAddModalVisible(false);
          setActionError(null);
        }}
        onSubmitAdd={handleAddSubmit}
      />

      <CropFormModal
        visible={!!editingCrop}
        mode="edit"
        existingCrop={editingCrop || undefined}
        saving={saving}
        onClose={() => {
          setEditingCrop(null);
          setActionError(null);
        }}
        onSubmitEdit={handleEditSubmit}
      />

      <ConfirmDeleteModal
        visible={!!deletingCrop}
        cropLabel={deletingCrop ? getCropLabel(deletingCrop.cropType) : ""}
        deleting={deleting}
        onCancel={() => setDeletingCrop(null)}
        onConfirm={handleConfirmDelete}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
  },
  backButton: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: moderateScale(17), fontWeight: "700" },
  addButton: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: "#EBF7E9",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(8),
    paddingBottom: verticalScale(40),
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    backgroundColor: "#2E7D32",
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(14),
    borderRadius: moderateScale(10),
    marginBottom: verticalScale(14),
  },
  successText: {
    color: "#FFFFFF",
    fontSize: moderateScale(12),
    fontWeight: "700",
    flex: 1,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    backgroundColor: "#DC2626",
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(14),
    borderRadius: moderateScale(10),
    marginBottom: verticalScale(14),
  },
  errorBannerText: {
    color: "#FFFFFF",
    fontSize: moderateScale(12),
    fontWeight: "700",
    flex: 1,
  },
  summaryCard: {
    flexDirection: "row",
    backgroundColor: "#094A04",
    borderRadius: moderateScale(14),
    paddingVertical: verticalScale(14),
    marginBottom: verticalScale(16),
  },
  summaryStatItem: { flex: 1, alignItems: "center" },
  summaryStatVal: {
    fontSize: moderateScale(18),
    fontWeight: "800",
    color: "#FFFFFF",
  },
  summaryStatLabel: {
    fontSize: moderateScale(10),
    fontWeight: "600",
    color: "#A3C89E",
    marginTop: verticalScale(2),
  },
  summaryDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.2)" },
  loadingState: { paddingVertical: verticalScale(40), alignItems: "center" },
  emptyState: {
    alignItems: "center",
    paddingVertical: verticalScale(40),
    paddingHorizontal: scale(24),
  },
  emptyTitle: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    marginTop: verticalScale(10),
  },
  emptyHint: {
    fontSize: moderateScale(11),
    color: "#687076",
    textAlign: "center",
    marginTop: verticalScale(6),
  },
});
