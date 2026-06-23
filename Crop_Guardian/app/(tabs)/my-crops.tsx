// app/(tabs)/my-crops.tsx
// Full My Crops screen: list, add, edit status, delete, and per-crop history

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";

import API from "@/services/api";

import AddCropModal from "../../components/crops/components/AddCropModal";
import CropCard from "../../components/crops/components/CropCard";
import CropDetailSheet from "../../components/crops/components/CropDetailSheet";
import DeleteConfirmModal from "../../components/crops/components/DeleteConfirmModal";
import EditStatusModal from "../../components/crops/components/EditStatusModal";

// ─── TypeScript interfaces ────────────────────────────────────────────────────

export type CropType =
  | "MAIZE"
  | "TOMATO"
  | "CASSAVA"
  | "PLANTAIN"
  | "PEPPER"
  | "COCOA";

export type CropStatus = "HEALTHY" | "MONITORING" | "AT_RISK" | "HARVEST_READY";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface LastDetection {
  diseaseName: string;
  date: string;
  confidence: number;
}

export interface MyCrop {
  cropType: CropType;
  customName: string | null;
  status: CropStatus;
  farmSize: number | null;
  farmSizeUnit: string;
  plantingDate: string | null;
  expectedHarvestDate: string | null;
  notes: string | null;
  lastActivityDate: string | null;
  lastDetection: LastDetection | null;
  riskLevel: RiskLevel;
}

export interface DetectionHistoryItem {
  id: string;
  imageUrl: string | null;
  diseaseName: string;
  confidence: number;
  symptoms: string | null;
  createdAt: string;
  localNotes: string | null;
  aiProvider: string;
}

export interface HistoryAggregates {
  totalDetections: number;
  avgConfidence: number;
  mostCommonDisease: string | null;
}

// ─── Static meta maps ─────────────────────────────────────────────────────────

export const CROP_META: Record<
  CropType,
  { emoji: string; accent: string; label: string }
> = {
  MAIZE: { emoji: "🌽", accent: "#F59E0B", label: "Maize" },
  TOMATO: { emoji: "🍅", accent: "#EF4444", label: "Tomato" },
  CASSAVA: { emoji: "🌿", accent: "#10B981", label: "Cassava" },
  PLANTAIN: { emoji: "🍌", accent: "#F97316", label: "Plantain" },
  PEPPER: { emoji: "🌶️", accent: "#DC2626", label: "Pepper" },
  COCOA: { emoji: "🍫", accent: "#92400E", label: "Cocoa" },
};

export const STATUS_META: Record<CropStatus, { color: string; label: string }> =
  {
    HEALTHY: { color: "#22C55E", label: "Healthy" },
    MONITORING: { color: "#F59E0B", label: "Monitoring" },
    AT_RISK: { color: "#EF4444", label: "At Risk" },
    HARVEST_READY: { color: "#6366F1", label: "Harvest Ready" },
  };

export const RISK_META: Record<RiskLevel, { color: string; bg: string }> = {
  LOW: { color: "#166534", bg: "#DCFCE7" },
  MEDIUM: { color: "#92400E", bg: "#FEF3C7" },
  HIGH: { color: "#991B1B", bg: "#FEE2E2" },
};

export const ALL_CROPS: CropType[] = [
  "MAIZE",
  "TOMATO",
  "CASSAVA",
  "PLANTAIN",
  "PEPPER",
  "COCOA",
];
export const ALL_STATUSES: CropStatus[] = [
  "HEALTHY",
  "MONITORING",
  "AT_RISK",
  "HARVEST_READY",
];

// ─── Safe meta resolver helpers ───────────────────────────────────────────────

export function getCropMeta(raw: string): {
  emoji: string;
  accent: string;
  label: string;
} {
  const key = raw?.toUpperCase() as CropType;
  return (
    CROP_META[key] ?? {
      emoji: "🌾",
      accent: "#6B7280",
      label: raw ?? "Unknown",
    }
  );
}

export function getStatusMeta(raw: string): { color: string; label: string } {
  const key = raw?.toUpperCase() as CropStatus;
  return STATUS_META[key] ?? { color: "#6B7280", label: raw ?? "Unknown" };
}

export function getRiskMeta(raw: string): { color: string; bg: string } {
  const key = raw?.toUpperCase() as RiskLevel;
  return RISK_META[key] ?? { color: "#374151", bg: "#F3F4F6" };
}

export function normalizeType(raw: string): CropType {
  return raw?.toUpperCase() as CropType;
}

// ─── Format helpers ───────────────────────────────────────────────────────────

export const fmtConfidence = (val: number): string =>
  `${(val * 100).toFixed(0)}%`;

export const fmtDate = (iso: string | null): string => {
  if (!iso) return "Unknown";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MyCropsScreen() {
  const router = useRouter();

  // List state
  const [crops, setCrops] = useState<MyCrop[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  // Add crop modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedNewCrop, setSelectedNewCrop] = useState<CropType | null>(null);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Crop detail / history
  const [selectedCrop, setSelectedCrop] = useState<MyCrop | null>(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [history, setHistory] = useState<DetectionHistoryItem[]>([]);
  const [aggregates, setAggregates] = useState<HistoryAggregates | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Edit status modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState<MyCrop | null>(null);
  const [editStatus, setEditStatus] = useState<CropStatus>("HEALTHY");
  const [editNotes, setEditNotes] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete confirm modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MyCrop | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Animated header
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [verticalScale(100), verticalScale(56)],
    extrapolate: "clamp",
  });
  const greetingOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  // API: fetch crop list
  const fetchCrops = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setListError(null);
    try {
      const res = await API.get("/api/crops/my-crops");
      if (res.data?.success) {
        setCrops(res.data.crops as MyCrop[]);
      } else {
        setListError(res.data?.message || "Could not load crops.");
      }
    } catch {
      setListError("Connection failed. Pull down to retry.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCrops();
  }, [fetchCrops]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCrops(true);
  }, [fetchCrops]);

  // API: fetch scan history
  const fetchHistory = useCallback(async (cropType: string) => {
    setHistoryLoading(true);
    setHistoryError(null);
    setHistory([]);
    setAggregates(null);
    try {
      const res = await API.get(
        `/api/crops/my-crops/${cropType.toUpperCase()}/history?limit=10`,
      );
      if (res.data?.success) {
        setHistory(res.data.history as DetectionHistoryItem[]);
        setAggregates(res.data.aggregates as HistoryAggregates);
      } else {
        setHistoryError(res.data?.message || "Could not load history.");
      }
    } catch {
      setHistoryError("Failed to load scan history.");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const openDetailSheet = (crop: MyCrop) => {
    setSelectedCrop(crop);
    setShowDetailSheet(true);
    fetchHistory(crop.cropType);
  };

  // API: add crop
  const handleAddCrop = async () => {
    if (!selectedNewCrop) return;
    setAddLoading(true);
    setAddError(null);
    try {
      const res = await API.post("/api/crops/my-crops", {
        cropType: selectedNewCrop,
      });
      if (res.data?.success) {
        setShowAddModal(false);
        setSelectedNewCrop(null);
        fetchCrops(true);
      } else {
        setAddError(res.data?.message || "Could not add this crop.");
      }
    } catch (err: any) {
      setAddError(
        err?.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setAddLoading(false);
    }
  };

  // API: edit crop status
  const openEditModal = (crop: MyCrop) => {
    setEditTarget(crop);
    setEditStatus(normalizeType(crop.status) as CropStatus);
    setEditNotes(crop.notes || "");
    setEditError(null);
    setShowEditModal(true);
    setShowDetailSheet(false);
  };

  const handleEditSave = async () => {
    if (!editTarget) return;
    setEditLoading(true);
    setEditError(null);
    try {
      const res = await API.patch(
        `/api/crops/my-crops/${editTarget.cropType.toUpperCase()}`,
        {
          status: editStatus,
          notes: editNotes || undefined,
        },
      );
      if (res.data?.success) {
        setShowEditModal(false);
        setEditTarget(null);
        fetchCrops(true);
      } else {
        setEditError(res.data?.message || "Could not update crop.");
      }
    } catch (err: any) {
      setEditError(
        err?.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setEditLoading(false);
    }
  };

  // API: delete crop
  const openDeleteModal = (crop: MyCrop) => {
    setDeleteTarget(crop);
    setDeleteError(null);
    setShowDeleteModal(true);
    setShowDetailSheet(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await API.delete(
        `/api/crops/my-crops/${deleteTarget.cropType.toUpperCase()}`,
      );
      if (res.data?.success) {
        setShowDeleteModal(false);
        setDeleteTarget(null);
        fetchCrops(true);
      } else {
        setDeleteError(res.data?.message || "Could not remove crop.");
      }
    } catch (err: any) {
      setDeleteError(
        err?.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const addableCrops = ALL_CROPS.filter(
    (c) => !crops.some((existing) => normalizeType(existing.cropType) === c),
  );

  // Empty state
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>🌱</Text>
      <Text style={styles.emptyTitle}>No crops tracked yet</Text>
      <Text style={styles.emptySubtitle}>
        Add your first crop and start monitoring its health in one place.
      </Text>
      <TouchableOpacity
        style={styles.emptyAddButton}
        onPress={() => setShowAddModal(true)}
      >
        <Ionicons name="add" size={18} color="#FFFFE7" />
        <Text style={styles.emptyAddText}>Add Your First Crop</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Animated sticky header */}
      <Animated.View style={[styles.stickyHeader, { height: headerHeight }]}>
        <Animated.View style={{ opacity: greetingOpacity }}>
          <Text style={styles.headerGreeting}>Your Farm</Text>
          <Text style={styles.headerSub}>
            {crops.length} crop{crops.length !== 1 ? "s" : ""} being monitored
          </Text>
        </Animated.View>

        <TouchableOpacity
          style={[
            styles.addHeaderBtn,
            (loading || addableCrops.length === 0) && styles.disabledOpacity,
          ]}
          onPress={() => setShowAddModal(true)}
          disabled={loading || addableCrops.length === 0}
        >
          <Ionicons name="add" size={20} color="#FFFFE7" />
          <Text style={styles.addHeaderText}>Add Crop</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* List / loading / error */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#094A04" />
          <Text style={styles.loadingText}>Loading your crops...</Text>
        </View>
      ) : listError ? (
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={48} color="#9CA3AF" />
          <Text style={styles.errorText}>{listError}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => fetchCrops()}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Animated.FlatList
          data={crops}
          keyExtractor={(item) => item.cropType}
          renderItem={({ item }) => (
            <CropCard
              item={item}
              onPress={openDetailSheet}
              onEdit={openEditModal}
              onDelete={openDeleteModal}
            />
          )}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[
            styles.listContent,
            crops.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false },
          )}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#094A04"
              colors={["#094A04"]}
            />
          }
        />
      )}

      {/* Modals */}
      <AddCropModal
        visible={showAddModal}
        addableCrops={addableCrops}
        selectedNewCrop={selectedNewCrop}
        addLoading={addLoading}
        addError={addError}
        onClose={() => {
          setShowAddModal(false);
          setSelectedNewCrop(null);
          setAddError(null);
        }}
        onSelectCrop={setSelectedNewCrop}
        onAddCrop={handleAddCrop}
        CROP_META={CROP_META}
      />

      <CropDetailSheet
        visible={showDetailSheet}
        selectedCrop={selectedCrop}
        history={history}
        aggregates={aggregates}
        historyLoading={historyLoading}
        historyError={historyError}
        onClose={() => setShowDetailSheet(false)}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
      />

      <EditStatusModal
        visible={showEditModal}
        editTarget={editTarget}
        editStatus={editStatus}
        editNotes={editNotes}
        editLoading={editLoading}
        editError={editError}
        onClose={() => setShowEditModal(false)}
        onStatusChange={setEditStatus}
        onNotesChange={setEditNotes}
        onSave={handleEditSave}
      />

      <DeleteConfirmModal
        visible={showDeleteModal}
        deleteTarget={deleteTarget}
        deleteLoading={deleteLoading}
        deleteError={deleteError}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
      />
    </SafeAreaView>
  );
}

// ─── Remaining Styles (shared + list + empty + header) ────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F7F2",
  },
  stickyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(10),
    backgroundColor: "#F5F7F2",
    borderBottomWidth: 1,
    borderBottomColor: "#E5EBE3",
    overflow: "hidden",
  },
  headerGreeting: {
    fontSize: moderateScale(26),
    fontWeight: "800",
    color: "#083D04",
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: moderateScale(13),
    color: "#6B7280",
    marginTop: verticalScale(2),
  },
  addHeaderBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#094A04",
    borderRadius: moderateScale(20),
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(14),
    gap: scale(4),
  },
  addHeaderText: {
    color: "#FFFFE7",
    fontSize: moderateScale(13),
    fontWeight: "700",
  },
  listContent: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(16),
    paddingBottom: verticalScale(110),
  },
  listContentEmpty: { flex: 1, justifyContent: "center" },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: verticalScale(12),
    paddingHorizontal: scale(32),
  },
  loadingText: { fontSize: moderateScale(13), color: "#6B7280" },
  errorText: {
    fontSize: moderateScale(14),
    color: "#6B7280",
    textAlign: "center",
  },
  retryBtn: {
    marginTop: verticalScale(8),
    backgroundColor: "#094A04",
    borderRadius: moderateScale(20),
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(24),
  },
  retryText: {
    color: "#FFFFE7",
    fontSize: moderateScale(13),
    fontWeight: "700",
  },
  emptyContainer: {
    alignItems: "center",
    paddingHorizontal: scale(32),
    paddingTop: verticalScale(40),
  },
  emptyEmoji: { fontSize: moderateScale(56), marginBottom: verticalScale(16) },
  emptyTitle: {
    fontSize: moderateScale(20),
    fontWeight: "700",
    color: "#083D04",
    marginBottom: verticalScale(8),
  },
  emptySubtitle: {
    fontSize: moderateScale(14),
    color: "#6B7280",
    textAlign: "center",
    lineHeight: moderateScale(22),
    marginBottom: verticalScale(24),
  },
  emptyAddButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#094A04",
    borderRadius: moderateScale(24),
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(24),
    gap: scale(6),
  },
  emptyAddText: {
    color: "#FFFFE7",
    fontSize: moderateScale(14),
    fontWeight: "700",
  },
  disabledOpacity: { opacity: 0.5 },
});
