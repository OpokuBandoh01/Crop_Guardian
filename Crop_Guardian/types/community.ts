// types/community.ts
// Shapes for the /api/community/* endpoints this screen actually uses.
// Only what the backend API guide documents as LIVE is modeled here.
// The planning doc describes a bigger feature (follow system, Following
// feed, Popular feed, community profiles), but those endpoints do not
// exist in the deployed backend yet, so they are deliberately left out
// of these types for now. Add them here once that backend work ships,
// so we never accidentally call something that 404s.

import type { CropType } from "@/types/user";

// One tag/category, as returned by GET /api/community/tags.
// Tags are backend-seeded, there is no endpoint to create one from the app.
export interface CommunityTag {
  id: string;
  name: string;
  slug: string;
}

// The author block embedded inside a post. This is a subset of the full
// user profile, it is all the backend actually sends back on a post.
export interface CommunityAuthor {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  reputationScore: number;
}

// One post, as returned inside the array from GET /api/community/posts.
// `isLiked` / `isSaved` use `?` (making them OPTIONAL properties) because
// the backend only includes them at all when the request was
// authenticated. Reading `post.isLiked` when it is genuinely absent (not
// just false) is still type-safe because of the `?`, it just resolves to
// `undefined`, which we treat as "not liked" wherever we display it.
export interface CommunityPost {
  id: string;
  content: string;
  imageUrls: string[];
  region: string | null;
  cropType: CropType | null;
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  createdAt: string;
  updatedAt?: string;
  author: CommunityAuthor;
  tags: CommunityTag[];
  isLiked?: boolean;
  isSaved?: boolean;
}

// Pagination metadata, identical shape across every paginated community
// endpoint (posts, comments, likes, saved).
export interface CommunityPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// GET /api/community/tags
export interface GetTagsResponse {
  success: boolean;
  message: string;
  data: CommunityTag[];
  total: number;
}

// GET /api/community/posts
export interface GetPostsResponse {
  success: boolean;
  message: string;
  data: CommunityPost[];
  pagination: CommunityPagination;
}

// Query params accepted by GET /api/community/posts. Every field is
// optional (the `?` again) — the caller only sends the filters it
// actually wants to apply.
export interface GetPostsParams {
  page?: number;
  limit?: number;
  tag?: string;
  region?: string;
  cropType?: CropType;
  q?: string;
}

// POST/DELETE .../like and .../save just return a success flag + a
// message, no data payload, so one shared shape covers both actions.
export interface CommunitySimpleResponse {
  success: boolean;
  message: string;
}
