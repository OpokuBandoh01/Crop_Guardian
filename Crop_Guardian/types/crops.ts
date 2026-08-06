// types/crop.ts
// Shapes for the /api/crops/my-crops family of endpoints. Kept separate
// from types/user.ts since these describe a different resource
// (tracked crops), even though CropType is shared between them.

import type { CropType } from "@/types/user";

export type CropStatus = "HEALTHY" | "MONITORING" | "AT_RISK" | "HARVEST_READY";
export type RiskLevel = "HIGH" | "MEDIUM" | "LOW";

export interface LastDetectionSummary {
  diseaseName: string;
  date: string;
  confidence: number;
}

// One row as returned by GET /api/crops/my-crops.
export interface TrackedCrop {
  cropType: CropType;
  customName: string | null;
  status: CropStatus;
  farmSize: number | null;
  // NEW ADDITION: always "acres" right now, the backend does not accept
  // a unit field on write, this exists purely for display.
  farmSizeUnit: string;
  plantingDate: string | null;
  expectedHarvestDate: string | null;
  notes: string | null;
  lastActivityDate: string;
  lastDetection: LastDetectionSummary | null;
  riskLevel: RiskLevel;
}

export interface GetMyCropsResponse {
  success: boolean;
  crops: TrackedCrop[];
  total: number;
  message: string;
}

// Body accepted by POST /api/crops/my-crops. cropType is required, every
// other field is optional. FREE is deliberately excluded from CropType
// already (see types/user.ts), so it can never be sent here by mistake.
export interface AddCropPayload {
  cropType: CropType;
  customName?: string;
  plantingDate?: string;
  expectedHarvestDate?: string;
  farmSize?: number;
  notes?: string;
}

export interface AddCropResponse {
  success: boolean;
  data: TrackedCrop;
  message: string;
}

// Body accepted by PATCH /api/crops/my-crops/:cropType. Every field is
// optional, unlike AddCropPayload this can also change `status`.
export interface UpdateCropPayload {
  customName?: string;
  plantingDate?: string;
  expectedHarvestDate?: string;
  farmSize?: number;
  notes?: string;
  status?: CropStatus;
}

export interface UpdateCropResponse {
  success: boolean;
  data: Partial<TrackedCrop>;
  message: string;
}

export interface DeleteCropResponse {
  success: boolean;
  message: string;
}
