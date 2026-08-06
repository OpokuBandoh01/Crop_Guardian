// hooks/useMyCrops.ts
// Single source of truth for the "My Crops" list, mirrors the shape of
// useUserProfile.ts, refetches on focus so navigating back into this
// screen (e.g. after adding a crop from a different flow) always shows
// current data without a manual pull to refresh.

import {
    addMyCrop,
    deleteMyCrop,
    fetchMyCrops,
    updateMyCrop,
} from "@/services/cropApi";
import type {
    AddCropPayload,
    TrackedCrop,
    UpdateCropPayload,
} from "@/types/crops";
import type { CropType } from "@/types/user";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useRef, useState } from "react";

interface UseMyCropsResult {
  crops: TrackedCrop[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addCrop: (
    payload: AddCropPayload,
  ) => Promise<{ success: boolean; message?: string }>;
  editCrop: (
    cropType: CropType,
    payload: UpdateCropPayload,
  ) => Promise<{ success: boolean; message?: string }>;
  removeCrop: (
    cropType: CropType,
  ) => Promise<{ success: boolean; message?: string }>;
}

export function useMyCrops(): UseMyCropsResult {
  const [crops, setCrops] = useState<TrackedCrop[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);

  const load = useCallback(async (isRefresh: boolean) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await fetchMyCrops();
      if (data.success) {
        setCrops(data.crops);
      }
    } catch (err) {
      console.warn("Failed to fetch my crops:", err);
      setError("Could not load your crops. Pull down to try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFetchingRef.current = false;
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(false);
    }, [load]),
  );

  const refetch = useCallback(() => load(true), [load]);

  // NEW ADDITION: each mutation calls refetch() on success rather than
  // trying to hand-compute the updated list locally. The backend computes
  // riskLevel, lastActivityDate, and farmSizeUnit server-side, refetching
  // is the only way to guarantee the UI reflects the real, authoritative
  // values instead of a guessed local copy.
  const addCrop = useCallback(
    async (payload: AddCropPayload) => {
      try {
        const res = await addMyCrop(payload);
        if (res.success) {
          await refetch();
          return { success: true };
        }
        return { success: false, message: "Could not add this crop." };
      } catch (err: any) {
        // Secure, generic message, never the raw backend error text.
        const message =
          err?.response?.status === 400
            ? "This crop may already be in your list, or the details entered are invalid."
            : "Could not add this crop. Please try again.";
        return { success: false, message };
      }
    },
    [refetch],
  );

  const editCrop = useCallback(
    async (cropType: CropType, payload: UpdateCropPayload) => {
      try {
        const res = await updateMyCrop(cropType, payload);
        if (res.success) {
          await refetch();
          return { success: true };
        }
        return { success: false, message: "Could not update this crop." };
      } catch {
        return {
          success: false,
          message: "Could not update this crop. Please try again.",
        };
      }
    },
    [refetch],
  );

  const removeCrop = useCallback(
    async (cropType: CropType) => {
      try {
        const res = await deleteMyCrop(cropType);
        if (res.success) {
          await refetch();
          return { success: true };
        }
        return { success: false, message: "Could not remove this crop." };
      } catch {
        return {
          success: false,
          message: "Could not remove this crop. Please try again.",
        };
      }
    },
    [refetch],
  );

  return {
    crops,
    loading,
    refreshing,
    error,
    refetch,
    addCrop,
    editCrop,
    removeCrop,
  };
}
