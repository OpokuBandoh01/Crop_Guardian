// services/communityApi.ts
// Wrapper functions for the community endpoints the Community (Latest
// feed) screen calls. Only tags, the main feed, and like/unlike are
// wired here — comment, reply, save, and post-creation calls will be
// added when those screens are built, per the step-by-step plan.

import API from "@/services/api";
import type {
  CommentMarkResponse,
  CommunitySimpleResponse,
  CreateCommentResponse,
  CreatePostPayload,
  CreatePostResponse,
  GetCommentsResponse,
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

export async function createCommunityPost(
  payload: CreatePostPayload,
): Promise<CreatePostResponse> {
  // FormData is a built-in browser/RN type, no import needed.
  const formData = new FormData();

  formData.append("content", payload.content);

  // IMPORTANT: tagIds must be a JSON-STRINGIFIED array inside the
  // multipart field, not a normal repeated field. Every multipart field
  // arrives at the backend as a plain string, so the backend explicitly
  // JSON.parse()s this one field before validating it as an array of
  // tag IDs. Appending each tag ID as its own "tagIds" field (the way
  // you might with a normal HTML form) will NOT parse correctly there.
  formData.append("tagIds", JSON.stringify(payload.tagIds));

  if (payload.region) {
    formData.append("region", payload.region);
  }
  if (payload.cropType) {
    formData.append("cropType", payload.cropType);
  }

  (payload.images ?? []).forEach((uri, index) => {
    // Same { uri, name, type } pattern used for avatar upload — React
    // Native's FormData accepts this object in place of a real
    // Blob/File, since a true File object does not exist on-device the
    // way it does in a browser. The cast tells TypeScript to trust this
    // shape, since it does not match the DOM's real Blob type.
    formData.append("images", {
      uri,
      name: `post-image-${index}.jpg`,
      type: "image/jpeg",
    } as unknown as Blob);
  });

  const res = await API.post<CreatePostResponse>(
    "/api/community/posts",
    formData,
    {
      headers: {
        // Forces axios/RN to generate the correct multipart boundary
        // instead of falling back to the application/json default set
        // on the shared API instance.
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return res.data;
}

export async function fetchPostComments(
  postId: string,
  params?: { page?: number; limit?: number },
): Promise<GetCommentsResponse> {
  const res = await API.get<GetCommentsResponse>(
    `/api/community/posts/${postId}/comments`,
    { params },
  );
  return res.data;
}

export async function createPostComment(
  postId: string,
  content: string,
): Promise<CreateCommentResponse> {
  const res = await API.post<CreateCommentResponse>(
    `/api/community/posts/${postId}/comments`,
    { content },
  );
  return res.data;
}

export async function createCommentReply(
  commentId: string,
  content: string,
): Promise<CreateCommentResponse> {
  const res = await API.post<CreateCommentResponse>(
    `/api/community/comments/${commentId}/replies`,
    { content },
  );
  return res.data;
}

export async function deleteComment(
  commentId: string,
): Promise<CommunitySimpleResponse> {
  const res = await API.delete<CommunitySimpleResponse>(
    `/api/community/comments/${commentId}`,
  );
  return res.data;
}

export async function markCommentHelpful(
  commentId: string,
): Promise<CommentMarkResponse> {
  const res = await API.post<CommentMarkResponse>(
    `/api/community/comments/${commentId}/helpful`,
  );
  return res.data;
}

export async function unmarkCommentHelpful(
  commentId: string,
): Promise<CommentMarkResponse> {
  const res = await API.delete<CommentMarkResponse>(
    `/api/community/comments/${commentId}/helpful`,
  );
  return res.data;
}

export async function markCommentSolved(
  commentId: string,
): Promise<CommentMarkResponse> {
  const res = await API.post<CommentMarkResponse>(
    `/api/community/comments/${commentId}/solved`,
  );
  return res.data;
}

export async function unmarkCommentSolved(
  commentId: string,
): Promise<CommentMarkResponse> {
  const res = await API.delete<CommentMarkResponse>(
    `/api/community/comments/${commentId}/solved`,
  );
  return res.data;
}
