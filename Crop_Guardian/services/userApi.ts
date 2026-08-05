// services/userApi.ts
// Wrapper functions for the endpoints that read/update the logged-in
// user's own profile. Kept separate from services/api.ts (which handles
// login/register/reset) so profile.tsx and personal-info.tsx both import
// from one place instead of each hand-rolling their own axios calls.

import API from "@/services/api";
import type {
    MeResponse,
    UpdateAvatarResponse,
    UpdateProfilePayload,
    UpdateProfileResponse,
} from "@/types/user";

// GET /api/auth/me
// The <MeResponse> generic tells axios (and us) exactly what shape
// `res.data` is, so `res.data.stats.cropsCount` is type-checked instead
// of being `any`.
export async function fetchMe(): Promise<MeResponse> {
  const res = await API.get<MeResponse>("/api/auth/me");
  return res.data;
}

// PUT /api/auth/profile
// Only fullName and location can ever be sent here, per the backend docs.
// email, phoneNumber, role, and preferredCrops have no update endpoint yet.
export async function updateProfile(
  payload: UpdateProfilePayload,
): Promise<UpdateProfileResponse> {
  const res = await API.put<UpdateProfileResponse>(
    "/api/auth/profile",
    payload,
  );
  return res.data;
}

// PUT /api/auth/avatar
// Must be multipart/form-data, not JSON, this is a hard backend
// requirement (same pattern as the disease detection upload).
export async function uploadAvatar(
  imageUri: string,
): Promise<UpdateAvatarResponse> {
  // FormData is the standard way to build a multipart body in
  // JavaScript/TypeScript, no extra import needed, it is a built-in type.
  const formData = new FormData();

  // React Native's FormData implementation accepts this
  // { uri, name, type } object in place of a real Blob/File, since a real
  // File object does not exist on-device the way it does in a browser.
  // The "as unknown as Blob" cast tells TypeScript to trust us on this,
  // since RN's actual runtime shape does not match the DOM's Blob type.
  formData.append("image", {
    uri: imageUri,
    name: "avatar.jpg",
    type: "image/jpeg",
  } as unknown as Blob);

  const res = await API.put<UpdateAvatarResponse>(
    "/api/auth/avatar",
    formData,
    {
      headers: {
        // Setting this explicitly makes axios/RN generate the correct
        // multipart boundary, instead of falling back to the
        // application/json default set on the shared API instance.
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return res.data;
}
