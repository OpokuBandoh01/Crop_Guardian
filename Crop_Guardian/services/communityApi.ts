// services/communityApi.ts

import API from "@/services/api";
import type {
  CommentMarkResponse,
  CommunitySimpleResponse,
  CreateCommentResponse,
  CreatePostPayload,
  CreatePostResponse,
  FollowUserResponse,
  GetCommentsResponse,
  GetPostsParams,
  GetPostsResponse,
  GetSavedPostsResponse,
  GetTagsResponse,
} from "@/types/community";

export async function fetchCommunityTags(): Promise<GetTagsResponse> {
  const res = await API.get<GetTagsResponse>("/api/community/tags");
  return res.data;
}

export async function fetchCommunityPosts(
  params: GetPostsParams,
): Promise<GetPostsResponse> {
  const res = await API.get<GetPostsResponse>("/api/community/posts", {
    params,
  });
  return res.data;
}

export async function likeCommunityPost(
  postId: string,
): Promise<CommunitySimpleResponse> {
  const res = await API.post<CommunitySimpleResponse>(
    `/api/community/posts/${postId}/like`,
  );
  return res.data;
}

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
  const formData = new FormData();

  formData.append("content", payload.content);

  formData.append("tagIds", JSON.stringify(payload.tagIds));

  if (payload.region) {
    formData.append("region", payload.region);
  }
  if (payload.cropType) {
    formData.append("cropType", payload.cropType);
  }

  (payload.images ?? []).forEach((uri, index) => {
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

export async function saveCommunityPost(
  postId: string,
): Promise<CommunitySimpleResponse> {
  const res = await API.post<CommunitySimpleResponse>(
    `/api/community/posts/${postId}/save`,
  );
  return res.data;
}

export async function unsaveCommunityPost(
  postId: string,
): Promise<CommunitySimpleResponse> {
  const res = await API.delete<CommunitySimpleResponse>(
    `/api/community/posts/${postId}/save`,
  );
  return res.data;
}

export async function fetchSavedPosts(params?: {
  page?: number;
  limit?: number;
}): Promise<GetSavedPostsResponse> {
  const res = await API.get<GetSavedPostsResponse>("/api/community/saved", {
    params,
  });
  return res.data;
}

export async function followCommunityUser(
  userId: string,
): Promise<FollowUserResponse> {
  const res = await API.post<FollowUserResponse>(
    `/api/community/users/${userId}/follow`,
  );
  return res.data;
}

export async function unfollowCommunityUser(
  userId: string,
): Promise<FollowUserResponse> {
  const res = await API.delete<FollowUserResponse>(
    `/api/community/users/${userId}/follow`,
  );
  return res.data;
}
