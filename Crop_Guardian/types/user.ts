// types/user.ts

export type CropType =
  | "MAIZE"
  | "TOMATO"
  | "CASSAVA"
  | "PLANTAIN"
  | "PEPPER"
  | "COCOA"
  | "RICE"
  | "YAM"
  | "GROUNDNUT"
  | "ONION";

export interface UserLocation {
  latitude: number;
  longitude: number;
  // The `?` makes this optional. address is nice-to-have display text,
  // latitude/longitude are the values the backend actually needs.
  address?: string;
}

export interface UserProfile {
  id?: string;
  fullName: string;
  avatarUrl: string | null;
  location: UserLocation | null;
  preferredCrops: CropType[];
  //NEW ADDITION: community reputation fields from Profile model
  reputationScore?: number;
  helpfulAnswersCount?: number;
  solvedAnswersCount?: number;
}

export interface UserProfileData {
  id: string;
  email: string;
  role: string;
  phoneNumber: string;
  language: "en" | "tw";
  isOnboarded: boolean;
  isEmailVerified: boolean;
  createdAt?: string;
  updatedAt?: string;
  profile: UserProfile;
}

export interface UserStats {
  cropsCount: number;
  detectionsCount: number;
  notificationsCount: number;
  unreadNotificationsCount: number;
  followersCount: number;
  followingCount: number;
}

// Full shape of GET /api/auth/me.
export interface MeResponse {
  success: boolean;
  user: UserProfileData;
  stats: UserStats;
}

// Body accepted by PUT /api/auth/profile. Both fields are optional per the
// backend, but the backend rejects an empty body with a 400, so the
// calling code is responsible for filling in at least one.
export interface UpdateProfilePayload {
  fullName?: string;
  location?: UserLocation;
}

export interface UpdateProfileResponse {
  success: boolean;
  message: string;
  profile: UserProfile;
}

export interface UpdateAvatarResponse {
  success: boolean;
  message: string;
  avatarUrl: string;
  profile: UserProfile;
}
