// services/detectionApi.ts
// //NEW ADDITION : API wrappers for detection history + offline first-page cache
//
// Cache strategy (simple, good for final-year project):
// - On a successful list fetch for page 1, save that page to AsyncStorage.
// - Cache key includes cropType + q so filtered views cache separately.
// - On network failure for page 1, return the last cached page if present
//   and set `fromCache: true` so the UI can show a subtle offline banner.
// - Detail responses are also cached by id for offline open-from-history.
//
// Docs referenced patterns:
// - Axios query params: https://axios-http.com/docs/req_config
// - AsyncStorage: https://react-native-async-storage.github.io/async-storage/

import API from "@/services/api";
import type {
  GetDetectionByIdResponse,
  GetMyDetectionsParams,
  GetMyDetectionsResponse,
} from "@/types/detection";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LIST_CACHE_PREFIX = "@detections:list:";
const DETAIL_CACHE_PREFIX = "@detections:detail:";

// //NEW ADDITION : build a stable cache key from the filters the user applied
function listCacheKey(params: GetMyDetectionsParams): string {
  const crop = params.cropType ?? "all";
  const q = params.q?.trim().toLowerCase() ?? "";
  return `${LIST_CACHE_PREFIX}${crop}:${q || "none"}`;
}

// GET /api/detection/my
// Axios drops keys whose value is undefined, so optional filters are safe.
export async function fetchMyDetections(
  params: GetMyDetectionsParams = {},
): Promise<GetMyDetectionsResponse & { fromCache?: boolean }> {
  const page = params.page ?? 1;

  try {
    const res = await API.get<GetMyDetectionsResponse>("/api/detection/my", {
      params: {
        page,
        limit: params.limit ?? 10,
        cropType: params.cropType,
        q: params.q,
      },
    });

    // Only cache the first page so offline browse stays small and predictable
    if (page === 1 && res.data.success) {
      try {
        await AsyncStorage.setItem(
          listCacheKey(params),
          JSON.stringify(res.data),
        );
      } catch (cacheWriteError) {
        // Non-blocking: a failed cache write must never break the live response
        console.warn("Detection list cache write failed:", cacheWriteError);
      }
    }

    return res.data;
  } catch (error) {
    // Offline / network error: serve page-1 cache when available
    if (page === 1) {
      try {
        const raw = await AsyncStorage.getItem(listCacheKey(params));
        if (raw) {
          const cached = JSON.parse(raw) as GetMyDetectionsResponse;
          return { ...cached, fromCache: true };
        }
      } catch (cacheReadError) {
        console.warn("Detection list cache read failed:", cacheReadError);
      }
    }
    throw error;
  }
}

// GET /api/detection/:id
export async function fetchDetectionById(
  id: string,
): Promise<GetDetectionByIdResponse & { fromCache?: boolean }> {
  try {
    const res = await API.get<GetDetectionByIdResponse>(
      `/api/detection/${id}`,
    );

    if (res.data.success && res.data.data) {
      try {
        await AsyncStorage.setItem(
          `${DETAIL_CACHE_PREFIX}${id}`,
          JSON.stringify(res.data),
        );
      } catch (cacheWriteError) {
        console.warn("Detection detail cache write failed:", cacheWriteError);
      }
    }

    return res.data;
  } catch (error) {
    try {
      const raw = await AsyncStorage.getItem(`${DETAIL_CACHE_PREFIX}${id}`);
      if (raw) {
        const cached = JSON.parse(raw) as GetDetectionByIdResponse;
        return { ...cached, fromCache: true };
      }
    } catch (cacheReadError) {
      console.warn("Detection detail cache read failed:", cacheReadError);
    }
    throw error;
  }
}

// //NEW ADDITION : confidence label for cards (psychology: plain language)
export function confidenceLabel(confidence: number): string {
  // Backend stores 0–1; guard in case a value is already 0–100
  const pct = confidence > 1 ? confidence : confidence * 100;
  if (pct >= 75) return "High Confidence";
  if (pct >= 45) return "Medium Confidence";
  return "Low Confidence";
}

export function confidencePercent(confidence: number): string {
  const pct = confidence > 1 ? confidence : confidence * 100;
  return `${Math.round(pct)}%`;
}
