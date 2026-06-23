// components/crops/components/CropDetailSheet.tsx
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import React from "react";
import {
    ActivityIndicator,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";
import {
    DetectionHistoryItem,
    fmtConfidence,
    fmtDate,
    getCropMeta,
    getRiskMeta,
    getStatusMeta,
    HistoryAggregates,
    MyCrop,
} from "../../../app/(tabs)/my-crops";

interface CropDetailSheetProps {
  visible: boolean;
  selectedCrop: MyCrop | null;
  history: DetectionHistoryItem[];
  aggregates: HistoryAggregates | null;
  historyLoading: boolean;
  historyError: string | null;
  onClose: () => void;
  onEdit: (crop: MyCrop) => void;
  onDelete: (crop: MyCrop) => void;
}

export default function CropDetailSheet({
  visible,
  selectedCrop,
  history,
  aggregates,
  historyLoading,
  historyError,
  onClose,
  onEdit,
  onDelete,
}: CropDetailSheetProps) {
  const router = useRouter();

  if (!selectedCrop) return null;

  const sMeta = getCropMeta(selectedCrop.cropType);
  const sStatusMeta = getStatusMeta(selectedCrop.status);
  const sRiskMeta = getRiskMeta(selectedCrop.riskLevel);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <BlurView intensity={50} tint="dark" style={styles.modalBackdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.bottomSheet, styles.bottomSheetTall]}>
          <View style={styles.sheetHandle} />

          <View style={styles.detailHeader}>
            <View style={styles.detailEmojiWrap}>
              <Text style={styles.detailEmoji}>{sMeta.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailCropName}>{sMeta.label}</Text>
              {selectedCrop.customName ? (
                <Text style={styles.detailCustomName}>
                  "{selectedCrop.customName}"
                </Text>
              ) : null}
              <View style={styles.detailStatusRow}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: sStatusMeta.color },
                  ]}
                />
                <Text
                  style={[
                    styles.detailStatusText,
                    { color: sStatusMeta.color },
                  ]}
                >
                  {sStatusMeta.label}
                </Text>
              </View>
            </View>
            <View style={styles.detailIconActions}>
              <TouchableOpacity
                onPress={() => onEdit(selectedCrop)}
                style={styles.detailIconBtn}
              >
                <Ionicons name="pencil-outline" size={18} color="#094A04" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onDelete(selectedCrop)}
                style={styles.detailIconBtn}
              >
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statChip}>
              <Text style={styles.statValue}>
                {selectedCrop.farmSize
                  ? `${selectedCrop.farmSize} ${selectedCrop.farmSizeUnit}`
                  : "N/A"}
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
                {selectedCrop.plantingDate
                  ? fmtDate(selectedCrop.plantingDate)
                  : "N/A"}
              </Text>
              <Text style={styles.statLabel}>Planted</Text>
            </View>
          </View>

          {selectedCrop.notes ? (
            <View style={styles.notesBox}>
              <Ionicons
                name="document-text-outline"
                size={14}
                color="#6B7280"
              />
              <Text style={styles.notesText}>{selectedCrop.notes}</Text>
            </View>
          ) : null}

          {aggregates && aggregates.totalDetections > 0 ? (
            <View style={styles.aggregatesRow}>
              <View style={styles.aggregateChip}>
                <Text style={styles.aggregateValue}>
                  {aggregates.totalDetections}
                </Text>
                <Text style={styles.aggregateLabel}>Total Scans</Text>
              </View>
              <View style={styles.aggregateChip}>
                <Text style={styles.aggregateValue}>
                  {fmtConfidence(aggregates.avgConfidence)}
                </Text>
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

          <Text style={styles.historyTitle}>Scan History</Text>

          {historyLoading ? (
            <ActivityIndicator
              size="small"
              color="#094A04"
              style={{ marginVertical: verticalScale(16) }}
            />
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
                onPress={() => {
                  onClose();
                  router.push("/scan" as any);
                }}
              >
                <Ionicons name="camera-outline" size={16} color="#FFFFE7" />
                <Text style={styles.scanNowText}>Scan Now</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              style={styles.historyScroll}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {history.map((item) => (
                <View key={item.id} style={styles.historyItem}>
                  <View style={styles.historyItemHeader}>
                    <Text style={styles.historyDiseaseName} numberOfLines={1}>
                      {item.diseaseName}
                    </Text>
                    <Text style={styles.historyDate}>
                      {fmtDate(item.createdAt)}
                    </Text>
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
                  <Text style={styles.confLabel}>
                    {fmtConfidence(item.confidence)} confidence
                  </Text>
                  {item.symptoms ? (
                    <Text style={styles.historySymptoms} numberOfLines={2}>
                      {item.symptoms}
                    </Text>
                  ) : null}
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: { flex: 1, justifyContent: "flex-end", alignItems: "center" },
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
  statusDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
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
  detailIconActions: {
    flexDirection: "row",
    gap: scale(8),
    marginLeft: "auto",
  },
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
});
