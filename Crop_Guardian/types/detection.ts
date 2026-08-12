// types/detection.ts
// //NEW ADDITION : shapes for GET /api/detection/my and GET /api/detection/:id
// Kept separate from types/crops.ts so scan history stays independent of
// the tracked-crop resource, even though both talk about cropType.

import type { CropType } from "@/types/user";

// One row in the history list (lightweight — no long treatment text).
export interface DetectionListItem {
  id: string;
  imageUrl: string | null;
  cropType: CropType | "FREE" | string;
  diseaseName: string;
  confidence: number;
  // Backend truncates symptoms to ~80 chars with ellipsis when needed.
  symptomsSnippet: string;
  createdAt: string;
}

// Full detail payload for the detection detail screen.
// rawResponse is intentionally absent (backend never sends it to clients).
export interface DetectionDetail {
  id: string;
  imageUrl: string | null;
  cropType: CropType | "FREE" | string;
  diseaseName: string;
  confidence: number;
  possibleDiseases: Array<{ name: string; confidence: number }> | null;
  symptoms: string | null;
  causes: string | null;
  organicTreatments: string | null;
  chemicalOptions: string | null;
  prevention: string | null;
  localNotes: string | null;
  aiProvider: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DetectionPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Query params for GET /api/detection/my. All optional at the call site.
export interface GetMyDetectionsParams {
  page?: number;
  limit?: number;
  cropType?: string;
  q?: string;
}

export interface GetMyDetectionsResponse {
  success: boolean;
  message: string;
  data: DetectionListItem[];
  pagination: DetectionPagination;
}

export interface GetDetectionByIdResponse {
  success: boolean;
  message: string;
  data?: DetectionDetail;
}
