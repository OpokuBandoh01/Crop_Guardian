// components/crops/CropFormModal.tsx
// A single reusable modal for both adding a new tracked crop and editing
// an existing one. mode="add" shows the crop-type picker (only real for
// new crops, cropType can never change on an existing entry, since the
// URL param itself identifies which crop is being edited). mode="edit"
// locks the crop type and additionally exposes the status selector, since
// only PATCH accepts `status`.

import { CustomButton } from "@/components/CustomButton";
import { CustomInput } from "@/components/CustomInput";
import { CROP_OPTIONS } from "@/constants/cropOptions";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { CropStatus, TrackedCrop } from "@/types/crops";
import type { CropType } from "@/types/user";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React, { useEffect, useState } from "react";
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";
import { CropStatusPill } from "./CropStatusPill";

const STATUS_OPTIONS: CropStatus[] = [
  "HEALTHY",
  "MONITORING",
  "AT_RISK",
  "HARVEST_READY",
];

// A date typed as YYYY-MM-DD is accepted, this regex is the client-side
// gate before we ever build an ISO string to send to the backend, so a
// malformed date never reaches the API (see Important Behavior Note 1's
// general lesson: validate enum/format-sensitive fields before sending).
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

interface CropFormModalProps {
  visible: boolean;
  mode: "add" | "edit";
  // The crop being edited, undefined in add mode.
  existingCrop?: TrackedCrop;
  // Crop types already tracked, used to gray out options already added
  // in add mode (the backend would reject a duplicate with a 400 anyway,
  // this just prevents the user from hitting that error at all).
  alreadyTrackedTypes?: CropType[];
  saving: boolean;
  onClose: () => void;
  onSubmitAdd?: (payload: {
    cropType: CropType;
    customName?: string;
    farmSize?: number;
    plantingDate?: string;
    expectedHarvestDate?: string;
    notes?: string;
  }) => void;
  onSubmitEdit?: (payload: {
    customName?: string;
    farmSize?: number;
    plantingDate?: string;
    expectedHarvestDate?: string;
    notes?: string;
    status?: CropStatus;
  }) => void;
}

export function CropFormModal({
  visible,
  mode,
  existingCrop,
  alreadyTrackedTypes = [],
  saving,
  onClose,
  onSubmitAdd,
  onSubmitEdit,
}: CropFormModalProps) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  const [selectedType, setSelectedType] = useState<CropType | null>(null);
  const [customName, setCustomName] = useState("");
  const [farmSize, setFarmSize] = useState("");
  const [plantingDate, setPlantingDate] = useState("");
  const [expectedHarvestDate, setExpectedHarvestDate] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<CropStatus>("HEALTHY");
  const [formError, setFormError] = useState<string | null>(null);

  // Resets the form fields every time the modal opens, pre-filled from
  // existingCrop when editing, blank when adding.
  useEffect(() => {
    if (!visible) return;
    setFormError(null);

    if (mode === "edit" && existingCrop) {
      setSelectedType(existingCrop.cropType);
      setCustomName(existingCrop.customName || "");
      setFarmSize(
        existingCrop.farmSize != null ? String(existingCrop.farmSize) : "",
      );
      setPlantingDate(
        existingCrop.plantingDate ? existingCrop.plantingDate.slice(0, 10) : "",
      );
      setExpectedHarvestDate(
        existingCrop.expectedHarvestDate
          ? existingCrop.expectedHarvestDate.slice(0, 10)
          : "",
      );
      setNotes(existingCrop.notes || "");
      setStatus(existingCrop.status);
    } else {
      setSelectedType(null);
      setCustomName("");
      setFarmSize("");
      setPlantingDate("");
      setExpectedHarvestDate("");
      setNotes("");
      setStatus("HEALTHY");
    }
  }, [visible, mode, existingCrop]);

  const toIsoOrUndefined = (dateText: string): string | undefined => {
    if (!dateText.trim()) return undefined;
    return `${dateText}T00:00:00.000Z`;
  };

  const validateDates = (): string | null => {
    if (plantingDate && !DATE_PATTERN.test(plantingDate)) {
      return "Planting date must be in YYYY-MM-DD format.";
    }
    if (expectedHarvestDate && !DATE_PATTERN.test(expectedHarvestDate)) {
      return "Expected harvest date must be in YYYY-MM-DD format.";
    }
    return null;
  };

  const handleSubmit = () => {
    setFormError(null);

    if (mode === "add" && !selectedType) {
      setFormError("Please select a crop type.");
      return;
    }

    const dateError = validateDates();
    if (dateError) {
      setFormError(dateError);
      return;
    }

    const parsedFarmSize = farmSize.trim() ? parseFloat(farmSize) : undefined;
    if (
      farmSize.trim() &&
      (Number.isNaN(parsedFarmSize) || (parsedFarmSize as number) <= 0)
    ) {
      setFormError("Farm size must be a positive number.");
      return;
    }

    if (mode === "add" && selectedType && onSubmitAdd) {
      onSubmitAdd({
        cropType: selectedType,
        customName: customName.trim() || undefined,
        farmSize: parsedFarmSize,
        plantingDate: toIsoOrUndefined(plantingDate),
        expectedHarvestDate: toIsoOrUndefined(expectedHarvestDate),
        notes: notes.trim() || undefined,
      });
    } else if (mode === "edit" && onSubmitEdit) {
      onSubmitEdit({
        customName: customName.trim() || undefined,
        farmSize: parsedFarmSize,
        plantingDate: toIsoOrUndefined(plantingDate),
        expectedHarvestDate: toIsoOrUndefined(expectedHarvestDate),
        notes: notes.trim() || undefined,
        status,
      });
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={() => {
        // Background is locked while saving, same rule as the logout modal.
        if (!saving) onClose();
      }}
    >
      <View style={styles.backdrop}>
        <BlurView
          style={StyleSheet.absoluteFill}
          intensity={100}
          tint={colorScheme === "light" ? "light" : "dark"}
        />

        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: theme.text }]}>
              {mode === "add" ? "Add a Crop" : "Edit Crop"}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              disabled={saving}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="close"
                size={moderateScale(20)}
                color={theme.icon}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.scrollArea}
          >
            {mode === "add" && (
              <>
                <Text style={[styles.label, { color: theme.primary }]}>
                  CROP TYPE
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.cropOptionsRow}
                >
                  {CROP_OPTIONS.map((option) => {
                    const isSelected = selectedType === option.type;
                    const isTaken = alreadyTrackedTypes.includes(option.type);
                    return (
                      <TouchableOpacity
                        key={option.type}
                        style={[
                          styles.cropOption,
                          isSelected && styles.cropOptionSelected,
                          isTaken && styles.cropOptionDisabled,
                        ]}
                        onPress={() =>
                          !isTaken && !saving && setSelectedType(option.type)
                        }
                        disabled={isTaken || saving}
                        activeOpacity={0.8}
                      >
                        {option.image ? (
                          <View style={styles.cropOptionIconWrap}>
                            <Ionicons
                              name="leaf-outline"
                              size={moderateScale(20)}
                              color="#094A04"
                            />
                          </View>
                        ) : (
                          <Ionicons
                            name="leaf-outline"
                            size={moderateScale(20)}
                            color="#094A04"
                          />
                        )}
                        <Text
                          style={[
                            styles.cropOptionText,
                            isSelected && styles.cropOptionTextSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}

            <CustomInput
              label="CUSTOM NAME (OPTIONAL)"
              placeholder="e.g. Backyard Maize"
              value={customName}
              onChangeText={setCustomName}
              editable={!saving}
              containerStyle={styles.inputSpacing}
            />

            <CustomInput
              label="FARM SIZE, ACRES (OPTIONAL)"
              placeholder="e.g. 2.5"
              keyboardType="numeric"
              value={farmSize}
              onChangeText={setFarmSize}
              editable={!saving}
              containerStyle={styles.inputSpacing}
            />

            <CustomInput
              label="PLANTING DATE, YYYY-MM-DD (OPTIONAL)"
              placeholder="e.g. 2026-03-01"
              value={plantingDate}
              onChangeText={setPlantingDate}
              editable={!saving}
              containerStyle={styles.inputSpacing}
            />

            <CustomInput
              label="EXPECTED HARVEST DATE, YYYY-MM-DD (OPTIONAL)"
              placeholder="e.g. 2026-07-01"
              value={expectedHarvestDate}
              onChangeText={setExpectedHarvestDate}
              editable={!saving}
              containerStyle={styles.inputSpacing}
            />

            <CustomInput
              label="NOTES (OPTIONAL)"
              placeholder="e.g. Near the river"
              value={notes}
              onChangeText={setNotes}
              editable={!saving}
              multiline
              containerStyle={styles.inputSpacing}
            />

            {mode === "edit" && (
              <>
                <Text style={[styles.label, { color: theme.primary }]}>
                  STATUS
                </Text>
                <View style={styles.statusRow}>
                  {STATUS_OPTIONS.map((s) => (
                    <TouchableOpacity
                      key={s}
                      onPress={() => !saving && setStatus(s)}
                      disabled={saving}
                      style={[
                        styles.statusOption,
                        status === s && styles.statusOptionSelected,
                      ]}
                    >
                      <CropStatusPill status={s} />
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {formError && <Text style={styles.errorText}>{formError}</Text>}
          </ScrollView>

          <CustomButton
            title={mode === "add" ? "Add Crop" : "Save Changes"}
            loading={saving}
            disabled={saving}
            onPress={handleSubmit}
            style={styles.submitButton}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: scale(20),
  },
  card: {
    width: "100%",
    maxHeight: "85%",
    borderRadius: moderateScale(16),
    padding: scale(18),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(14),
  },
  title: { fontSize: moderateScale(16), fontWeight: "700" },
  scrollArea: { maxHeight: verticalScale(420) },
  label: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    marginBottom: verticalScale(6),
  },
  cropOptionsRow: { gap: scale(8), paddingBottom: verticalScale(12) },
  cropOption: {
    width: scale(72),
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(10),
    borderWidth: 1.2,
    borderColor: "rgba(9, 74, 4, 0.15)",
  },
  cropOptionSelected: { borderColor: "#094A04", backgroundColor: "#EBF7E9" },
  cropOptionDisabled: { opacity: 0.35 },
  cropOptionIconWrap: { marginBottom: verticalScale(4) },
  cropOptionText: {
    fontSize: moderateScale(10),
    fontWeight: "600",
    marginTop: verticalScale(4),
    textAlign: "center",
  },
  cropOptionTextSelected: { color: "#094A04" },
  inputSpacing: { marginBottom: verticalScale(10) },
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(8),
    marginBottom: verticalScale(10),
  },
  statusOption: { borderRadius: moderateScale(10) },
  statusOptionSelected: { borderWidth: 1.5, borderColor: "#094A04" },
  errorText: {
    fontSize: moderateScale(11),
    color: "#DC2626",
    fontWeight: "600",
    marginBottom: verticalScale(8),
  },
  submitButton: { marginTop: verticalScale(4) },
});
