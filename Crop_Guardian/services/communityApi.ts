// services/communityApi.ts
// Wrapper functions for the community endpoints the Community (Latest
// feed) screen calls. Only tags, the main feed, and like/unlike are
// wired here — comment, reply, save, and post-creation calls will be
// added when those screens are built, per the step-by-step plan.

import API from "@/services/api";
import type {
    CommunitySimpleResponse,
    GetPostsParams,
    GetPostsResponse,
    GetTagsResponse,
} from "@/types/community";

// GET /api/community/tags
// No auth required, this list is public and is used to populate the
// category chips row at the top of the feed.
export async function fetchCommunityTags(): Promise<GetTagsResponse> {
  const res = await API.get<GetTagsResponse>("/api/community/tags");
  return res.data;
}

// GET /api/community/posts
// `params` is passed straight through as the axios query string. Axios
// drops any key whose value is `undefined`, so callers can safely spread
// in optional filters (tag, region, cropType, q) without hand-building
// the query string themselves.
export async function fetchCommunityPosts(
  params: GetPostsParams,
): Promise<GetPostsResponse> {
  const res = await API.get<GetPostsResponse>("/api/community/posts", {
    params,
  });
  return res.data;
}

// POST /api/community/posts/:postId/like
export async function likeCommunityPost(
  postId: string,
): Promise<CommunitySimpleResponse> {
  const res = await API.post<CommunitySimpleResponse>(
    `/api/community/posts/${postId}/like`,
  );
  return res.data;
}

// DELETE /api/community/posts/:postId/like
export async function unlikeCommunityPost(
  postId: string,
): Promise<CommunitySimpleResponse> {
  const res = await API.delete<CommunitySimpleResponse>(
    `/api/community/posts/${postId}/like`,
  );
  return res.data;
}
