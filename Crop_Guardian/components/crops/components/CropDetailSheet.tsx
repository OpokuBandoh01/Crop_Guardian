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
      {/*
       * BlurView locks background and prevents interaction while detail sheet is open.
       * intensity 50 + dark tint gives a slightly lighter blur than the action modals,
       * appropriate for a larger informational sheet vs a decision modal.
       */}
      <BlurView intensity={50} tint="dark" style={styles.modalBackdrop}>
        {/* Dismiss on outside tap */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.bottomSheet}>
          {/* Drag handle: #D9D9D9 matches home's blendBorder / divider */}
          <View style={styles.sheetHandle} />

          {/* ---- Crop header: emoji + name + status + action icons ---- */}
          <View style={styles.detailHeader}>
            {/* Emoji bg: #EBF7E9 matches home's overviewCard healthy tinted bg */}
            <View style={styles.detailEmojiWrap}>
              <Text style={styles.detailEmoji}>{sMeta.emoji}</Text>
            </View>

            <View style={{ flex: 1 }}>
              {/* #11181C matches home's primary heading text color */}
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

            {/* Icon action buttons: #F3F4F6 bg is the only original value kept
                because home doesn't have icon-only buttons but this is the
                closest neutral surface token available */}
            <View style={styles.detailIconActions}>
              <TouchableOpacity
                onPress={() => onEdit(selectedCrop)}
                style={styles.detailIconBtn}
              >
                {/* #094A04 matches home's primary icon color */}
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

          {/* ---- Stats row: tinted chips matching home's overviewCard pattern ---- */}
          <View style={styles.statsRow}>
            {/* #EBF7E9 matches home's overviewCard healthy green tinted bg */}
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

          {/* ---- Notes box: #FFFCE2 matches home's overviewCard warning tinted bg ---- */}
          {selectedCrop.notes ? (
            <View style={styles.notesBox}>
              <Ionicons
                name="document-text-outline"
                size={14}
                color="#687076"
              />
              <Text style={styles.notesText}>{selectedCrop.notes}</Text>
            </View>
          ) : null}

          {/* ---- Aggregates: same #EBF7E9 chip pattern as statsRow ---- */}
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

          {/* ---- Section label: matches home's sectionTitle style ---- */}
          {/* //UPDATED : title row + link to full detections list filtered by this crop */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={styles.historyTitle}>Scan History</Text>
            <TouchableOpacity
              onPress={() => {
                onClose();
                router.push(
                  `/detections?cropType=${selectedCrop.cropType}` as any,
                );
              }}
            >
              <Text
                style={{
                  color: "#094A04",
                  fontWeight: "700",
                  fontSize: 12,
                }}
              >
                View all
              </Text>
            </TouchableOpacity>
          </View>

          {historyLoading ? (
            // Primary green spinner matching home's RefreshControl tintColor
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
              {/* CTA button: #094A04 + #FFFFE7 matching home's primary button pattern */}
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
                /*
                 * History item card: #FFFFE7 matches the app's cream background,
                 * giving a subtle "inset" feel against the white sheet.
                 * This mirrors how home uses its background as a card-on-card contrast.
                 */
                <TouchableOpacity
                  key={item.id}
                  style={styles.historyItem}
                  activeOpacity={0.85}
                  onPress={() => {
                    onClose();
                    router.push(`/detection/${item.id}` as any);
                  }}
                >
                  <View style={styles.historyItemHeader}>
                    {/* #11181C matches home's primary heading text color */}
                    <Text style={styles.historyDiseaseName} numberOfLines={1}>
                      {item.diseaseName}
                    </Text>
                    {/* #687076 matches home's recentScanTime color */}
                    <Text style={styles.historyDate}>
                      {fmtDate(item.createdAt)}
                    </Text>
                  </View>

                  {/* Confidence bar: matches home's progress-like visual indicator pattern */}
                  <View style={styles.confBarWrap}>
                    <View
                      style={[
                        styles.confBar,
                        // Width is a percentage string - typed as `any` because RN's
                        // ViewStyle width accepts string percentages at runtime but
                        // TypeScript's type definitions require a number here
                        { width: `${item.confidence * 100}%` as any },
                        item.confidence > 0.7
                          ? { backgroundColor: "#EF4444" }
                          : item.confidence > 0.4
                            ? { backgroundColor: "#E4A11B" } // matches home's cropStatusWarning color
                            : { backgroundColor: "#2E7D32" }, // matches home's cropStatusHealthy color
                      ]}
                    />
                  </View>

                  {/* #687076 matches home's recentScanConfidence / secondary text */}
                  <Text style={styles.confLabel}>
                    {fmtConfidence(item.confidence)} confidence
                  </Text>
                  {item.symptoms ? (
                    <Text style={styles.historySymptoms} numberOfLines={2}>
                      {item.symptoms}
                    </Text>
                  ) : null}
                </TouchableOpacity>
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
    // #FFFFFF surface card: matches home's dailyTipCard / quickActionBtn
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(Platform.OS === "ios" ? 36 : 24),
    paddingTop: verticalScale(16),
    width: "100%",
    maxHeight: "90%",
    // Shadow matches home's scanBanner / bottomCard elevation
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 10,
  },
  sheetHandle: {
    width: scale(36),
    height: verticalScale(4),
    backgroundColor: "#D9D9D9", // matches home's blendBorder / divider color
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
    // #EBF7E9 matches home's overviewCard healthy tinted bg
    backgroundColor: "#EBF7E9",
    alignItems: "center",
    justifyContent: "center",
  },
  detailEmoji: { fontSize: moderateScale(26) },
  detailCropName: {
    fontSize: moderateScale(16), // matches home's sectionTitle fontSize
    fontWeight: "700", // matches home's greetingText fontWeight
    color: "#11181C", // matches home's primary text color
  },
  detailCustomName: {
    fontSize: moderateScale(11),
    color: "#687076", // matches home's cropConditionSub color
    fontStyle: "italic",
  },
  detailStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    marginTop: verticalScale(4),
  },
  statusDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
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
    // Soft neutral bg for icon buttons - consistent with home's subtle card surfaces
    backgroundColor: "#EBF7E9",
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
    // #EBF7E9 matches home's overviewCard healthy tinted background
    backgroundColor: "#EBF7E9",
    borderRadius: moderateScale(10),
    padding: moderateScale(10),
    alignItems: "center",
    // Shadow matches home's overviewCard elevation
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#11181C", // matches home's cropNameText / primary heading color
    textAlign: "center",
  },
  statLabel: {
    fontSize: moderateScale(10),
    color: "#687076", // matches home's cropConditionSub color
    marginTop: verticalScale(2),
    textAlign: "center",
  },
  notesBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: scale(6),
    // #FFFCE2 matches home's overviewCard warning/attention tinted bg
    backgroundColor: "#FFFCE2",
    borderRadius: moderateScale(10),
    padding: moderateScale(10),
    marginBottom: verticalScale(14),
    borderLeftWidth: 3,
    // #E4A11B matches home's cropStatusWarning color
    borderLeftColor: "#E4A11B",
  },
  notesText: {
    flex: 1,
    fontSize: moderateScale(13),
    color: "#11181C", // matches home's primary text color
    lineHeight: moderateScale(20),
  },
  aggregatesRow: {
    flexDirection: "row",
    gap: scale(8),
    marginBottom: verticalScale(16),
  },
  aggregateChip: {
    flex: 1,
    // #EBF7E9 consistent with statChip and home's overviewCard tinted bg
    backgroundColor: "#EBF7E9",
    borderRadius: moderateScale(10),
    padding: moderateScale(10),
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  aggregateValue: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#11181C", // matches home's primary text color
    textAlign: "center",
  },
  aggregateLabel: {
    fontSize: moderateScale(9),
    color: "#687076", // matches home's cropConditionSub color
    marginTop: verticalScale(2),
    textAlign: "center",
  },
  historyTitle: {
    fontSize: moderateScale(15), // matches home's sectionTitle fontSize range
    fontWeight: "700", // matches home's sectionTitle fontWeight
    color: "#11181C", // matches home's primary text color
    marginBottom: verticalScale(12),
  },
  historyScroll: { maxHeight: verticalScale(260) },
  historyItem: {
    // #FFFFE7 cream bg: the app's background color used as a card inset,
    // matching home's use of the background to create layered depth
    backgroundColor: "#FFFFE7",
    borderRadius: moderateScale(12), // matches home's overviewCard / quickActionBtn radius
    padding: moderateScale(12),
    marginBottom: verticalScale(10),
    // Shadow matches home's overviewCard elevation
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  historyItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: verticalScale(8),
    alignItems: "center",
  },
  historyDiseaseName: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#11181C", // matches home's recentScanDisease / primary text color
    flex: 1,
  },
  historyDate: {
    fontSize: moderateScale(11),
    color: "#687076", // matches home's recentScanTime color
    marginLeft: scale(8),
  },
  confBarWrap: {
    height: verticalScale(5),
    // #D9D9D9 matches home's divider / blendBorder color for the track
    backgroundColor: "#D9D9D9",
    borderRadius: 99,
    marginBottom: verticalScale(4),
    overflow: "hidden",
  },
  confBar: { height: "100%", borderRadius: 99 },
  confLabel: {
    fontSize: moderateScale(10),
    color: "#687076", // matches home's secondary text color
    marginBottom: verticalScale(6),
  },
  historySymptoms: {
    fontSize: moderateScale(12),
    color: "#4B5563", // matches home's dailyTipBody text color
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
    color: "#687076", // matches home's cropConditionSub color
    textAlign: "center",
    lineHeight: moderateScale(20),
  },
  scanNowBtn: {
    flexDirection: "row",
    alignItems: "center",
    // #094A04 + #FFFFE7 matches home's primary scan action button
    backgroundColor: "#094A04",
    borderRadius: moderateScale(28), // pill radius matching home's scan buttons
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(16),
    gap: scale(6),
    marginTop: verticalScale(8),
  },
  scanNowText: {
    color: "#FFFFE7", // cream text matching home's scanActionTextSolid
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
