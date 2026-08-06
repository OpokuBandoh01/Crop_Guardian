// services/cropApi.ts
// Wrapper functions for the /api/crops/my-crops endpoints, following the
// same pattern as services/userApi.ts, one file per backend resource.

import API from "@/services/api";
import type {
    AddCropPayload,
    AddCropResponse,
    DeleteCropResponse,
    GetMyCropsResponse,
    UpdateCropPayload,
    UpdateCropResponse,
} from "@/types/crops";
import type { CropType } from "@/types/user";

export async function fetchMyCrops(): Promise<GetMyCropsResponse> {
  const res = await API.get<GetMyCropsResponse>("/api/crops/my-crops");
  return res.data;
}

export async function addMyCrop(
  payload: AddCropPayload,
): Promise<AddCropResponse> {
  const res = await API.post<AddCropResponse>("/api/crops/my-crops", payload);
  return res.data;
}

// NEW ADDITION: cropType is always sent uppercase from the client, even
// though the backend uppercases it server-side too (Important Behavior
// Note 8 in the API guide), staying consistent avoids relying on that
// server-side leniency.
export async function updateMyCrop(
  cropType: CropType,
  payload: UpdateCropPayload,
): Promise<UpdateCropResponse> {
  const res = await API.patch<UpdateCropResponse>(
    `/api/crops/my-crops/${cropType.toUpperCase()}`,
    payload,
  );
  return res.data;
}

export async function deleteMyCrop(
  cropType: CropType,
): Promise<DeleteCropResponse> {
  const res = await API.delete<DeleteCropResponse>(
    `/api/crops/my-crops/${cropType.toUpperCase()}`,
  );
  return res.data;
}
