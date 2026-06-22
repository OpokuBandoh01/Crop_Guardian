// app/(tabs)/my-crops.tsx
// Full My Crops screen: list, add, edit status, delete, and per-crop history
// Covers all endpoints from: GET/POST/PATCH/DELETE /api/crops/my-crops
// and GET /api/crops/my-crops/:cropType/history

import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";

import API from "@/services/api";

// ─── TypeScript interfaces ────────────────────────────────────────────────────

/**
 * CropType: the six crop enum values the backend accepts.
 * Using a union type means TypeScript will warn us if we ever typo one.
 */
type CropType =
  | "MAIZE"
  | "TOMATO"
  | "CASSAVA"
  | "PLANTAIN"
  | "PEPPER"
  | "COCOA";

/**
 * CropStatus: four lifecycle states.
 * Read from list; writable via PATCH.
 */
type CropStatus = "HEALTHY" | "MONITORING" | "AT_RISK" | "HARVEST_READY";

/**
 * RiskLevel: derived by the backend from the last detection confidence score.
 */
type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

interface LastDetection {
  diseaseName: string;
  date: string;
  confidence: number;
}

interface MyCrop {
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

interface DetectionHistoryItem {
  id: string;
  imageUrl: string | null;
  diseaseName: string;
  confidence: number;
  symptoms: string | null;
  createdAt: string;
  localNotes: string | null;
  aiProvider: string;
}

interface HistoryAggregates {
  totalDetections: number;
  avgConfidence: number;
  mostCommonDisease: string | null;
}

// ─── Static meta maps ─────────────────────────────────────────────────────────

const CROP_META: Record<CropType, { emoji: string; accent: string; label: string }> = {
  MAIZE:    { emoji: "🌽", accent: "#F59E0B", label: "Maize" },
  TOMATO:   { emoji: "🍅", accent: "#EF4444", label: "Tomato" },
  CASSAVA:  { emoji: "🌿", accent: "#10B981", label: "Cassava" },
  PLANTAIN: { emoji: "🍌", accent: "#F97316", label: "Plantain" },
  PEPPER:   { emoji: "🌶️", accent: "#DC2626", label: "Pepper" },
  COCOA:    { emoji: "🍫", accent: "#92400E", label: "Cocoa" },
};

const STATUS_META: Record<CropStatus, { color: string; label: string }> = {
  HEALTHY:        { color: "#22C55E", label: "Healthy" },
  MONITORING:     { color: "#F59E0B", label: "Monitoring" },
  AT_RISK:        { color: "#EF4444", label: "At Risk" },
  HARVEST_READY:  { color: "#6366F1", label: "Harvest Ready" },
};

const RISK_META: Record<RiskLevel, { color: string; bg: string }> = {
  LOW:    { color: "#166534", bg: "#DCFCE7" },
  MEDIUM: { color: "#92400E", bg: "#FEF3C7" },
  HIGH:   { color: "#991B1B", bg: "#FEE2E2" },
};

const ALL_CROPS: CropType[] = ["MAIZE", "TOMATO", "CASSAVA", "PLANTAIN", "PEPPER", "COCOA"];
const ALL_STATUSES: CropStatus[] = ["HEALTHY", "MONITORING", "AT_RISK", "HARVEST_READY"];

// ─── Safe meta resolver helpers ───────────────────────────────────────────────
// The root cause of the crash: the server may return lowercase or unexpected
// cropType/status/riskLevel strings. These helpers uppercase the value before
// the lookup and return a safe fallback object when the key is unknown,
// so the render function NEVER receives undefined.

/**
 * getCropMeta — looks up crop emoji/accent/label.
 * Falls back to a grey placeholder if the key is not in CROP_META.
 *
 * TypeScript: the parameter is `string` (not `CropType`) so we can safely
 * pass raw server values without a cast. The return type is explicit so the
 * caller always gets a fully-shaped object.
 */
function getCropMeta(raw: string): { emoji: string; accent: string; label: string } {
  const key = raw?.toUpperCase() as CropType;
  return CROP_META[key] ?? { emoji: "🌾", accent: "#6B7280", label: raw ?? "Unknown" };
}

/** getStatusMeta — safe lookup for crop status. */
function getStatusMeta(raw: string): { color: string; label: string } {
  const key = raw?.toUpperCase() as CropStatus;
  return STATUS_META[key] ?? { color: "#6B7280", label: raw ?? "Unknown" };
}

/** getRiskMeta — safe lookup for risk level. */
function getRiskMeta(raw: string): { color: string; bg: string } {
  const key = raw?.toUpperCase() as RiskLevel;
  return RISK_META[key] ?? { color: "#374151", bg: "#F3F4F6" };
}

/** normalizeType — uppercases a raw cropType string for use as an API param. */
function normalizeType(raw: string): CropType {
  return raw?.toUpperCase() as CropType;
}

// ─── Format helpers ───────────────────────────────────────────────────────────

const fmtConfidence = (val: number): string => `${(val * 100).toFixed(0)}%`;

const fmtDate = (iso: string | null): string => {
  if (!iso) return "Unknown";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MyCropsScreen() {
  const router = useRouter();

  // ── List state ───────────────────────────────────────────────────────────────
  const [crops, setCrops]         = useState<MyCrop[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  // ── Add crop modal ───────────────────────────────────────────────────────────
  const [showAddModal, setShowAddModal]         = useState(false);
  const [selectedNewCrop, setSelectedNewCrop]   = useState<CropType | null>(null);
  const [addLoading, setAddLoading]             = useState(false);
  const [addError, setAddError]                 = useState<string | null>(null);

  // ── Crop detail / history sheet ──────────────────────────────────────────────
  const [selectedCrop, setSelectedCrop]         = useState<MyCrop | null>(null);
  const [showDetailSheet, setShowDetailSheet]   = useState(false);
  const [history, setHistory]                   = useState<DetectionHistoryItem[]>([]);
  const [aggregates, setAggregates]             = useState<HistoryAggregates | null>(null);
  const [historyLoading, setHistoryLoading]     = useState(false);
  const [historyError, setHistoryError]         = useState<string | null>(null);

  // ── Edit status modal ────────────────────────────────────────────────────────
  const [showEditModal, setShowEditModal]   = useState(false);
  const [editTarget, setEditTarget]         = useState<MyCrop | null>(null);
  const [editStatus, setEditStatus]         = useState<CropStatus>("HEALTHY");
  const [editNotes, setEditNotes]           = useState("");
  const [editLoading, setEditLoading]       = useState(false);
  const [editError, setEditError]           = useState<string | null>(null);

  // ── Delete confirm modal ─────────────────────────────────────────────────────
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget]       = useState<MyCrop | null>(null);
  const [deleteLoading, setDeleteLoading]     = useState(false);
  const [deleteError, setDeleteError]         = useState<string | null>(null);

  // ── Animated header ──────────────────────────────────────────────────────────
  // useRef keeps the Animated.Value stable across renders without re-creating it
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

  // ── API: fetch crop list ─────────────────────────────────────────────────────
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

  useEffect(() => { fetchCrops(); }, [fetchCrops]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCrops(true);
  }, [fetchCrops]);

  // ── API: fetch scan history ──────────────────────────────────────────────────
  const fetchHistory = useCallback(async (cropType: string) => {
    setHistoryLoading(true);
    setHistoryError(null);
    setHistory([]);
    setAggregates(null);
    try {
      // Backend accepts case-insensitive cropType in the URL path (see readme §3 note 5)
      const res = await API.get(`/api/crops/my-crops/${cropType.toUpperCase()}/history?limit=10`);
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

  // ── API: add crop ────────────────────────────────────────────────────────────
  const handleAddCrop = async () => {
    if (!selectedNewCrop) return;
    setAddLoading(true);
    setAddError(null);
    try {
      const res = await API.post("/api/crops/my-crops", { cropType: selectedNewCrop });
      if (res.data?.success) {
        setShowAddModal(false);
        setSelectedNewCrop(null);
        fetchCrops(true);
      } else {
        setAddError(res.data?.message || "Could not add this crop.");
      }
    } catch (err: any) {
      // TypeScript: err typed as `any` — Axios errors have no fixed compile-time shape
      setAddError(err?.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setAddLoading(false);
    }
  };

  // ── API: edit crop status ────────────────────────────────────────────────────
  const openEditModal = (crop: MyCrop) => {
    setEditTarget(crop);
    setEditStatus(normalizeType(crop.status) as unknown as CropStatus);
    setEditNotes(crop.notes || "");
    setEditError(null);
    setShowEditModal(true);
    setShowDetailSheet(false); // avoid layered modals
  };

  const handleEditSave = async () => {
    if (!editTarget) return;
    setEditLoading(true);
    setEditError(null);
    try {
      const res = await API.patch(`/api/crops/my-crops/${editTarget.cropType.toUpperCase()}`, {
        status: editStatus,
        notes: editNotes || undefined,
      });
      if (res.data?.success) {
        setShowEditModal(false);
        setEditTarget(null);
        fetchCrops(true);
      } else {
        setEditError(res.data?.message || "Could not update crop.");
      }
    } catch (err: any) {
      setEditError(err?.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setEditLoading(false);
    }
  };

  // ── API: delete crop ─────────────────────────────────────────────────────────
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
      const res = await API.delete(`/api/crops/my-crops/${deleteTarget.cropType.toUpperCase()}`);
      if (res.data?.success) {
        setShowDeleteModal(false);
        setDeleteTarget(null);
        fetchCrops(true);
      } else {
        setDeleteError(res.data?.message || "Could not remove crop.");
      }
    } catch (err: any) {
      setDeleteError(err?.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Crops the user has NOT yet added — shown in the Add modal grid
  const addableCrops = ALL_CROPS.filter(
    (c) => !crops.some((existing) => normalizeType(existing.cropType) === c)
  );

  // ─── CropCard ────────────────────────────────────────────────────────────────
  /**
   * Uses the safe getCropMeta / getStatusMeta / getRiskMeta helpers defined
   * above so undefined is IMPOSSIBLE even if the server sends unexpected casing.
   */
  const renderCropCard = ({ item }: { item: MyCrop }) => {
    // All three helpers uppercase internally — safe against any server casing
    const meta       = getCropMeta(item.cropType);
    const statusMeta = getStatusMeta(item.status);
    const riskMeta   = getRiskMeta(item.riskLevel);

    return (
      <TouchableOpacity
        style={styles.cropCard}
        onPress={() => openDetailSheet(item)}
        activeOpacity={0.85}
      >
        {/* Left colour strip — instant crop-type recognition */}
        <View style={[styles.cardAccent, { backgroundColor: meta.accent }]} />

        <View style={styles.cardBody}>
          {/* Row 1: emoji + name + risk badge */}
          <View style={styles.cardHeaderRow}>
            <View style={styles.cropEmojiWrapper}>
              <Text style={styles.cropEmoji}>{meta.emoji}</Text>
            </View>

            <View style={styles.cropNameBlock}>
              <Text style={styles.cropLabel}>{meta.label}</Text>
              {item.customName ? (
                <Text style={styles.customName} numberOfLines={1}>
                  {item.customName}
                </Text>
              ) : null}
            </View>

            <View style={[styles.riskBadge, { backgroundColor: riskMeta.bg }]}>
              <Text style={[styles.riskText, { color: riskMeta.color }]}>
                {(item.riskLevel ?? "LOW").toUpperCase()} RISK
              </Text>
            </View>
          </View>

          {/* Row 2: status pill + last activity date */}
          <View style={styles.cardMidRow}>
            <View style={[styles.statusPill, { backgroundColor: statusMeta.color + "22" }]}>
              <View style={[styles.statusDot, { backgroundColor: statusMeta.color }]} />
              <Text style={[styles.statusText, { color: statusMeta.color }]}>
                {statusMeta.label}
              </Text>
            </View>

            <Text style={styles.lastActivity}>
              {item.lastActivityDate ? `Last scan ${fmtDate(item.lastActivityDate)}` : "No scans yet"}
            </Text>
          </View>

          {/* Row 3: last detection summary */}
          {item.lastDetection ? (
            <View style={styles.lastDetectionRow}>
              <Ionicons name="bug-outline" size={12} color="#6B7280" />
              <Text style={styles.lastDetectionText} numberOfLines={1}>
                {item.lastDetection.diseaseName} — {fmtConfidence(item.lastDetection.confidence)} confidence
              </Text>
            </View>
          ) : (
            <View style={styles.lastDetectionRow}>
              <Ionicons name="checkmark-circle-outline" size={12} color="#22C55E" />
              <Text style={[styles.lastDetectionText, { color: "#22C55E" }]}>
                No disease detected yet
              </Text>
            </View>
          )}

          {/* Row 4: quick action buttons */}
          <View style={styles.cardActionRow}>
            <TouchableOpacity
              style={styles.cardActionBtn}
              onPress={() => openEditModal(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="pencil-outline" size={14} color="#094A04" />
              <Text style={styles.cardActionText}>Edit Status</Text>
            </TouchableOpacity>

            <View style={styles.cardActionDivider} />

            <TouchableOpacity
              style={styles.cardActionBtn}
              onPress={() => openDetailSheet(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="time-outline" size={14} color="#094A04" />
              <Text style={styles.cardActionText}>History</Text>
            </TouchableOpacity>

            <View style={styles.cardActionDivider} />

            <TouchableOpacity
              style={styles.cardActionBtn}
              onPress={() => openDeleteModal(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={14} color="#EF4444" />
              <Text style={[styles.cardActionText, { color: "#EF4444" }]}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ─── Empty state ──────────────────────────────────────────────────────────────
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

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>

      {/* ── Animated sticky header ─────────────────────────────────────────── */}
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

      {/* ── List / loading / error ─────────────────────────────────────────── */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#094A04" />
          <Text style={styles.loadingText}>Loading your crops...</Text>
        </View>
      ) : listError ? (
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={48} color="#9CA3AF" />
          <Text style={styles.errorText}>{listError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchCrops()}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Animated.FlatList
          data={crops}
          keyExtractor={(item) => item.cropType}
          renderItem={renderCropCard}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[
            styles.listContent,
            crops.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
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

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 1 — Add Crop
          Grid of crops NOT yet in the user's list.
          Every interactive element disabled when addLoading === true.
      ═══════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => !addLoading && setShowAddModal(false)}
      >
        <BlurView intensity={60} tint="dark" style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => !addLoading && setShowAddModal(false)}
          />
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Add a Crop</Text>
            <Text style={styles.sheetSubtitle}>Pick a crop to start tracking its health</Text>

            {addableCrops.length === 0 ? (
              <View style={styles.allAddedWrap}>
                <Text style={styles.allAddedEmoji}>🎉</Text>
                <Text style={styles.allAddedText}>You are tracking all available crops!</Text>
              </View>
            ) : (
              <View style={styles.cropGrid}>
                {addableCrops.map((crop) => {
                  // CROP_META[crop] is ALWAYS defined here because addableCrops
                  // is derived from ALL_CROPS which only contains valid keys
                  const meta = CROP_META[crop];
                  const isSelected = selectedNewCrop === crop;
                  return (
                    <TouchableOpacity
                      key={crop}
                      style={[
                        styles.cropGridItem,
                        isSelected && { borderColor: meta.accent, backgroundColor: meta.accent + "18" },
                        addLoading && styles.disabledOpacity,
                      ]}
                      onPress={() => setSelectedNewCrop(crop)}
                      disabled={addLoading}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.cropGridEmoji}>{meta.emoji}</Text>
                      <Text style={[styles.cropGridLabel, isSelected && { color: meta.accent, fontWeight: "700" }]}>
                        {meta.label}
                      </Text>
                      {isSelected && (
                        <View style={[styles.cropGridCheck, { backgroundColor: meta.accent }]}>
                          <Ionicons name="checkmark" size={10} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {addError ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={14} color="#EF4444" />
                <Text style={styles.errorBannerText}>{addError}</Text>
              </View>
            ) : null}

            {addableCrops.length > 0 && (
              <TouchableOpacity
                style={[styles.primaryBtn, (!selectedNewCrop || addLoading) && styles.disabledOpacity]}
                onPress={handleAddCrop}
                disabled={!selectedNewCrop || addLoading}
              >
                {addLoading ? (
                  <ActivityIndicator color="#FFFFE7" />
                ) : (
                  <>
                    <Ionicons name="add-circle-outline" size={18} color="#FFFFE7" />
                    <Text style={styles.primaryBtnText}>Add to My Crops</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.ghostBtn, addLoading && styles.disabledOpacity]}
              onPress={() => { if (!addLoading) { setShowAddModal(false); setSelectedNewCrop(null); setAddError(null); } }}
              disabled={addLoading}
            >
              <Text style={styles.ghostBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 2 — Crop Detail + Scan History
          Uses safe meta helpers — impossible to crash on unknown casing.
      ═══════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showDetailSheet}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowDetailSheet(false)}
      >
        <BlurView intensity={50} tint="dark" style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowDetailSheet(false)}
          />
          <View style={[styles.bottomSheet, styles.bottomSheetTall]}>
            <View style={styles.sheetHandle} />

            {selectedCrop && (() => {
              // Resolve meta once here; TypeScript: IIFE (() => JSX)() is a valid
              // pattern to declare local consts inside JSX without a wrapper component
              const sMeta       = getCropMeta(selectedCrop.cropType);
              const sStatusMeta = getStatusMeta(selectedCrop.status);
              const sRiskMeta   = getRiskMeta(selectedCrop.riskLevel);
              return (
                <>
                  {/* Crop header */}
                  <View style={styles.detailHeader}>
                    <View style={styles.detailEmojiWrap}>
                      <Text style={styles.detailEmoji}>{sMeta.emoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailCropName}>{sMeta.label}</Text>
                      {selectedCrop.customName ? (
                        <Text style={styles.detailCustomName}>"{selectedCrop.customName}"</Text>
                      ) : null}
                      <View style={styles.detailStatusRow}>
                        <View style={[styles.statusDot, { backgroundColor: sStatusMeta.color }]} />
                        <Text style={[styles.detailStatusText, { color: sStatusMeta.color }]}>
                          {sStatusMeta.label}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.detailIconActions}>
                      <TouchableOpacity onPress={() => openEditModal(selectedCrop)} style={styles.detailIconBtn}>
                        <Ionicons name="pencil-outline" size={18} color="#094A04" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => openDeleteModal(selectedCrop)} style={styles.detailIconBtn}>
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Stats row */}
                  <View style={styles.statsRow}>
                    <View style={styles.statChip}>
                      <Text style={styles.statValue}>
                        {selectedCrop.farmSize ? `${selectedCrop.farmSize} ${selectedCrop.farmSizeUnit}` : "N/A"}
                      </Text>
                      <Text style={styles.statLabel}>Farm Size</Text>
                    </View>
                    <View style={styles.statChip}>
                      <Text style={[styles.statValue, { color: sRiskMeta.color }]}>
                        {(selectedCrop.riskLevel ?? "LOW").toUpperCase()}
                      </Text>
                      <Text style={styles.statLabel}>Risk Level</Text>
                    </View>
                    <View style={styles.statChip}>
                      <Text style={styles.statValue}>
                        {selectedCrop.plantingDate ? fmtDate(selectedCrop.plantingDate) : "N/A"}
                      </Text>
                      <Text style={styles.statLabel}>Planted</Text>
                    </View>
                  </View>

                  {/* Notes */}
                  {selectedCrop.notes ? (
                    <View style={styles.notesBox}>
                      <Ionicons name="document-text-outline" size={14} color="#6B7280" />
                      <Text style={styles.notesText}>{selectedCrop.notes}</Text>
                    </View>
                  ) : null}

                  {/* Aggregates */}
                  {aggregates && aggregates.totalDetections > 0 ? (
                    <View style={styles.aggregatesRow}>
                      <View style={styles.aggregateChip}>
                        <Text style={styles.aggregateValue}>{aggregates.totalDetections}</Text>
                        <Text style={styles.aggregateLabel}>Total Scans</Text>
                      </View>
                      <View style={styles.aggregateChip}>
                        <Text style={styles.aggregateValue}>{fmtConfidence(aggregates.avgConfidence)}</Text>
                        <Text style={styles.aggregateLabel}>Avg Confidence</Text>
                      </View>
                      <View style={[styles.aggregateChip, { flex: 1.6 }]}>
                        <Text style={styles.aggregateValue} numberOfLines={1}>
                          {aggregates.mostCommonDisease ?? "None"}
                        </Text>
                        <Text style={styles.aggregateLabel}>Most Detected</Text>
                      </View>
                    </View>
                  ) : null}

                  {/* History list */}
                  <Text style={styles.historyTitle}>Scan History</Text>

                  {historyLoading ? (
                    <ActivityIndicator size="small" color="#094A04" style={{ marginVertical: verticalScale(16) }} />
                  ) : historyError ? (
                    <Text style={styles.historyError}>{historyError}</Text>
                  ) : history.length === 0 ? (
                    <View style={styles.historyEmpty}>
                      <Text style={styles.historyEmptyEmoji}>📷</Text>
                      <Text style={styles.historyEmptyText}>
                        No scans yet.{"\n"}Take a photo to start building your history.
                      </Text>
                      <TouchableOpacity
                        style={styles.scanNowBtn}
                        onPress={() => { setShowDetailSheet(false); router.push("/scan" as any); }}
                      >
                        <Ionicons name="camera-outline" size={16} color="#FFFFE7" />
                        <Text style={styles.scanNowText}>Scan Now</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <ScrollView style={styles.historyScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                      {history.map((item) => (
                        <View key={item.id} style={styles.historyItem}>
                          <View style={styles.historyItemHeader}>
                            <Text style={styles.historyDiseaseName} numberOfLines={1}>{item.diseaseName}</Text>
                            <Text style={styles.historyDate}>{fmtDate(item.createdAt)}</Text>
                          </View>
                          <View style={styles.confBarWrap}>
                            <View
                              style={[
                                styles.confBar,
                                { width: `${item.confidence * 100}%` as any },
                                item.confidence > 0.7
                                  ? { backgroundColor: "#EF4444" }
                                  : item.confidence > 0.4
                                  ? { backgroundColor: "#F59E0B" }
                                  : { backgroundColor: "#22C55E" },
                              ]}
                            />
                          </View>
                          <Text style={styles.confLabel}>{fmtConfidence(item.confidence)} confidence</Text>
                          {item.symptoms ? (
                            <Text style={styles.historySymptoms} numberOfLines={2}>{item.symptoms}</Text>
                          ) : null}
                        </View>
                      ))}
                    </ScrollView>
                  )}
                </>
              );
            })()}
          </View>
        </BlurView>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 3 — Edit Crop Status
          All inputs and buttons disabled while editLoading === true.
      ═══════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => !editLoading && setShowEditModal(false)}
      >
        <BlurView intensity={60} tint="dark" style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => !editLoading && setShowEditModal(false)}
          />
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Update Crop</Text>
            {editTarget && (
              <Text style={styles.sheetSubtitle}>
                {getCropMeta(editTarget.cropType).emoji} {getCropMeta(editTarget.cropType).label}
              </Text>
            )}

            <Text style={styles.fieldLabel}>Current Status</Text>
            <View style={styles.statusGrid}>
              {ALL_STATUSES.map((s) => {
                // ALL_STATUSES only contains known keys — safe to index directly
                const sm = STATUS_META[s];
                const isActive = editStatus === s;
                return (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.statusOption,
                      isActive && { borderColor: sm.color, backgroundColor: sm.color + "18" },
                      editLoading && styles.disabledOpacity,
                    ]}
                    onPress={() => setEditStatus(s)}
                    disabled={editLoading}
                  >
                    <View style={[styles.statusDot, { backgroundColor: sm.color }]} />
                    <Text style={[styles.statusOptionText, isActive && { color: sm.color, fontWeight: "700" }]}>
                      {sm.label}
                    </Text>
                    {isActive && (
                      <Ionicons name="checkmark-circle" size={14} color={sm.color} style={{ marginLeft: "auto" }} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>Notes (optional)</Text>
            <TextInput
              style={[styles.textArea, editLoading && styles.disabledOpacity]}
              value={editNotes}
              onChangeText={setEditNotes}
              placeholder="Any observations about this crop..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              maxLength={500}
              editable={!editLoading}
            />
            <Text style={styles.charCount}>{editNotes.length}/500</Text>

            {editError ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={14} color="#EF4444" />
                <Text style={styles.errorBannerText}>{editError}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.primaryBtn, editLoading && styles.disabledOpacity]}
              onPress={handleEditSave}
              disabled={editLoading}
            >
              {editLoading ? <ActivityIndicator color="#FFFFE7" /> : <Text style={styles.primaryBtnText}>Save Changes</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.ghostBtn, editLoading && styles.disabledOpacity]}
              onPress={() => { if (!editLoading) setShowEditModal(false); }}
              disabled={editLoading}
            >
              <Text style={styles.ghostBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 4 — Delete Confirm
          Centred floating card (not bottom sheet) for higher friction on delete.
      ═══════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => !deleteLoading && setShowDeleteModal(false)}
      >
        <BlurView intensity={65} tint="dark" style={[styles.modalBackdrop, { justifyContent: "center" }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => !deleteLoading && setShowDeleteModal(false)}
          />
          <View style={styles.deleteCard}>
            <View style={styles.deleteIconWrap}>
              <Ionicons name="warning-outline" size={32} color="#EF4444" />
            </View>
            <Text style={styles.deleteTitle}>Remove Crop?</Text>
            {deleteTarget && (
              <Text style={styles.deleteMessage}>
                This will remove{" "}
                <Text style={{ fontWeight: "700" }}>{getCropMeta(deleteTarget.cropType).label}</Text>{" "}
                from your tracked crops. Your scan history is preserved.
              </Text>
            )}

            {deleteError ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={14} color="#EF4444" />
                <Text style={styles.errorBannerText}>{deleteError}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.deleteConfirmBtn, deleteLoading && styles.disabledOpacity]}
              onPress={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.deleteConfirmText}>Yes, Remove</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.ghostBtn, deleteLoading && styles.disabledOpacity]}
              onPress={() => { if (!deleteLoading) setShowDeleteModal(false); }}
              disabled={deleteLoading}
            >
              <Text style={styles.ghostBtnText}>Keep Crop</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F7F2",
  },

  // Header
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

  // List
  listContent: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(16),
    paddingBottom: verticalScale(110),
  },
  listContentEmpty: { flex: 1, justifyContent: "center" },

  // Crop card
  cropCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(16),
    marginBottom: verticalScale(14),
    overflow: "hidden",
    shadowColor: "#094A04",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardAccent: { width: scale(5) },
  cardBody: { flex: 1, padding: moderateScale(14) },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(10),
    gap: scale(10),
  },
  cropEmojiWrapper: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(12),
    backgroundColor: "#F0F7EE",
    alignItems: "center",
    justifyContent: "center",
  },
  cropEmoji: { fontSize: moderateScale(22) },
  cropNameBlock: { flex: 1 },
  cropLabel: {
    fontSize: moderateScale(17),
    fontWeight: "700",
    color: "#083D04",
  },
  customName: {
    fontSize: moderateScale(12),
    color: "#6B7280",
    marginTop: verticalScale(1),
  },
  riskBadge: {
    borderRadius: moderateScale(8),
    paddingVertical: verticalScale(3),
    paddingHorizontal: scale(8),
  },
  riskText: {
    fontSize: moderateScale(9),
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  cardMidRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: verticalScale(8),
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: moderateScale(20),
    paddingVertical: verticalScale(3),
    paddingHorizontal: scale(10),
    gap: scale(5),
  },
  statusDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
  },
  statusText: { fontSize: moderateScale(11), fontWeight: "600" },
  lastActivity: { fontSize: moderateScale(11), color: "#9CA3AF" },
  lastDetectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(5),
    marginBottom: verticalScale(12),
  },
  lastDetectionText: {
    fontSize: moderateScale(11),
    color: "#6B7280",
    flex: 1,
  },
  cardActionRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: verticalScale(10),
  },
  cardActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    flex: 1,
    justifyContent: "center",
  },
  cardActionText: {
    fontSize: moderateScale(11),
    fontWeight: "600",
    color: "#094A04",
  },
  cardActionDivider: {
    width: 1,
    height: verticalScale(14),
    backgroundColor: "#E5E7EB",
  },

  // Empty state
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

  // Loading / error
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

  // Modal shared
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  bottomSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(Platform.OS === "ios" ? 36 : 24),
    paddingTop: verticalScale(16),
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
  },
  bottomSheetTall: { maxHeight: "90%" },
  sheetHandle: {
    width: scale(36),
    height: verticalScale(4),
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: verticalScale(16),
  },
  sheetTitle: {
    fontSize: moderateScale(20),
    fontWeight: "800",
    color: "#083D04",
    marginBottom: verticalScale(4),
  },
  sheetSubtitle: {
    fontSize: moderateScale(14),
    color: "#6B7280",
    marginBottom: verticalScale(20),
  },

  // Add crop grid
  cropGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(10),
    marginBottom: verticalScale(20),
  },
  cropGridItem: {
    width: "47%",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: moderateScale(14),
    padding: moderateScale(14),
    alignItems: "center",
    gap: verticalScale(6),
    position: "relative",
  },
  cropGridEmoji: { fontSize: moderateScale(28) },
  cropGridLabel: {
    fontSize: moderateScale(14),
    fontWeight: "600",
    color: "#374151",
  },
  cropGridCheck: {
    position: "absolute",
    top: moderateScale(8),
    right: moderateScale(8),
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(9),
    alignItems: "center",
    justifyContent: "center",
  },
  allAddedWrap: { alignItems: "center", paddingVertical: verticalScale(24) },
  allAddedEmoji: { fontSize: moderateScale(40), marginBottom: verticalScale(8) },
  allAddedText: {
    fontSize: moderateScale(14),
    color: "#6B7280",
    textAlign: "center",
  },

  // Detail sheet
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
    marginBottom: verticalScale(16),
  },
  detailEmojiWrap: {
    width: moderateScale(52),
    height: moderateScale(52),
    borderRadius: moderateScale(14),
    backgroundColor: "#F0F7EE",
    alignItems: "center",
    justifyContent: "center",
  },
  detailEmoji: { fontSize: moderateScale(26) },
  detailCropName: {
    fontSize: moderateScale(18),
    fontWeight: "800",
    color: "#083D04",
  },
  detailCustomName: {
    fontSize: moderateScale(12),
    color: "#6B7280",
    fontStyle: "italic",
  },
  detailStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    marginTop: verticalScale(4),
  },
  detailStatusText: { fontSize: moderateScale(12), fontWeight: "600" },
  detailIconActions: { flexDirection: "row", gap: scale(8), marginLeft: "auto" },
  detailIconBtn: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(10),
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    gap: scale(8),
    marginBottom: verticalScale(14),
  },
  statChip: {
    flex: 1,
    backgroundColor: "#F0F7EE",
    borderRadius: moderateScale(10),
    padding: moderateScale(10),
    alignItems: "center",
  },
  statValue: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#083D04",
    textAlign: "center",
  },
  statLabel: {
    fontSize: moderateScale(10),
    color: "#6B7280",
    marginTop: verticalScale(2),
    textAlign: "center",
  },
  notesBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: scale(6),
    backgroundColor: "#FFFBEB",
    borderRadius: moderateScale(10),
    padding: moderateScale(10),
    marginBottom: verticalScale(14),
    borderLeftWidth: 3,
    borderLeftColor: "#F59E0B",
  },
  notesText: {
    flex: 1,
    fontSize: moderateScale(13),
    color: "#374151",
    lineHeight: moderateScale(20),
  },
  aggregatesRow: {
    flexDirection: "row",
    gap: scale(8),
    marginBottom: verticalScale(16),
  },
  aggregateChip: {
    flex: 1,
    backgroundColor: "#F0F7EE",
    borderRadius: moderateScale(10),
    padding: moderateScale(10),
    alignItems: "center",
  },
  aggregateValue: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#083D04",
    textAlign: "center",
  },
  aggregateLabel: {
    fontSize: moderateScale(9),
    color: "#6B7280",
    marginTop: verticalScale(2),
    textAlign: "center",
  },
  historyTitle: {
    fontSize: moderateScale(15),
    fontWeight: "700",
    color: "#083D04",
    marginBottom: verticalScale(12),
  },
  historyScroll: { maxHeight: verticalScale(260) },
  historyItem: {
    backgroundColor: "#F9FAFB",
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    marginBottom: verticalScale(10),
  },
  historyItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: verticalScale(8),
    alignItems: "center",
  },
  historyDiseaseName: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#111827",
    flex: 1,
  },
  historyDate: {
    fontSize: moderateScale(11),
    color: "#9CA3AF",
    marginLeft: scale(8),
  },
  confBarWrap: {
    height: verticalScale(5),
    backgroundColor: "#E5E7EB",
    borderRadius: 99,
    marginBottom: verticalScale(4),
    overflow: "hidden",
  },
  confBar: { height: "100%", borderRadius: 99 },
  confLabel: {
    fontSize: moderateScale(10),
    color: "#6B7280",
    marginBottom: verticalScale(6),
  },
  historySymptoms: {
    fontSize: moderateScale(12),
    color: "#6B7280",
    lineHeight: moderateScale(18),
  },
  historyEmpty: {
    alignItems: "center",
    paddingVertical: verticalScale(24),
    gap: verticalScale(8),
  },
  historyEmptyEmoji: { fontSize: moderateScale(36) },
  historyEmptyText: {
    fontSize: moderateScale(13),
    color: "#6B7280",
    textAlign: "center",
    lineHeight: moderateScale(20),
  },
  scanNowBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#094A04",
    borderRadius: moderateScale(20),
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(16),
    gap: scale(6),
    marginTop: verticalScale(8),
  },
  scanNowText: {
    color: "#FFFFE7",
    fontSize: moderateScale(13),
    fontWeight: "700",
  },
  historyError: {
    fontSize: moderateScale(13),
    color: "#EF4444",
    textAlign: "center",
    paddingVertical: verticalScale(16),
  },

  // Edit modal
  fieldLabel: {
    fontSize: moderateScale(13),
    fontWeight: "600",
    color: "#374151",
    marginBottom: verticalScale(8),
  },
  statusGrid: { gap: verticalScale(8), marginBottom: verticalScale(16) },
  statusOption: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(14),
    gap: scale(8),
  },
  statusOptionText: {
    fontSize: moderateScale(14),
    color: "#374151",
    fontWeight: "500",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    fontSize: moderateScale(14),
    color: "#111827",
    textAlignVertical: "top",
    minHeight: verticalScale(80),
    marginBottom: verticalScale(4),
  },
  charCount: {
    fontSize: moderateScale(11),
    color: "#9CA3AF",
    textAlign: "right",
    marginBottom: verticalScale(14),
  },

  // Delete card
  deleteCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(20),
    padding: moderateScale(24),
    width: "88%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 14,
  },
  deleteIconWrap: {
    width: moderateScale(64),
    height: moderateScale(64),
    borderRadius: moderateScale(32),
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: verticalScale(16),
  },
  deleteTitle: {
    fontSize: moderateScale(20),
    fontWeight: "800",
    color: "#111827",
    marginBottom: verticalScale(10),
  },
  deleteMessage: {
    fontSize: moderateScale(14),
    color: "#6B7280",
    textAlign: "center",
    lineHeight: moderateScale(22),
    marginBottom: verticalScale(20),
  },
  deleteConfirmBtn: {
    backgroundColor: "#EF4444",
    borderRadius: moderateScale(28),
    paddingVertical: verticalScale(13),
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    minHeight: verticalScale(48),
    marginBottom: verticalScale(10),
  },
  deleteConfirmText: {
    color: "#FFFFFF",
    fontSize: moderateScale(15),
    fontWeight: "700",
  },

  // Shared buttons
  primaryBtn: {
    flexDirection: "row",
    backgroundColor: "#094A04",
    borderRadius: moderateScale(28),
    paddingVertical: verticalScale(14),
    alignItems: "center",
    justifyContent: "center",
    gap: scale(6),
    minHeight: verticalScale(50),
    marginBottom: verticalScale(10),
  },
  primaryBtnText: {
    color: "#FFFFE7",
    fontSize: moderateScale(15),
    fontWeight: "700",
  },
  ghostBtn: {
    borderRadius: moderateScale(28),
    paddingVertical: verticalScale(13),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    minHeight: verticalScale(48),
  },
  ghostBtnText: {
    color: "#6B7280",
    fontSize: moderateScale(15),
    fontWeight: "600",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderRadius: moderateScale(8),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    marginBottom: verticalScale(12),
    gap: scale(6),
  },
  errorBannerText: {
    color: "#EF4444",
    fontSize: moderateScale(13),
    flex: 1,
  },
  // Applied conditionally: [styles.btn, isLoading && styles.disabledOpacity]
  // TypeScript: StyleSheet.create enforces ViewStyle shape, opacity is valid here
  disabledOpacity: { opacity: 0.5 },
});