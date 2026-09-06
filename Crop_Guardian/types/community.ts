// types/community.ts
import type { CropType } from "@/types/user";

export interface CommunityTag {
  id: string;
  name: string;
  slug: string;
}

export interface CommunityAuthor {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  reputationScore: number;
  isFollowing?: boolean;
}

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
  savedAt?: string;
}

export interface CommunityPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface GetTagsResponse {
  success: boolean;
  message: string;
  data: CommunityTag[];
  total: number;
}

export interface GetPostsResponse {
  success: boolean;
  message: string;
  data: CommunityPost[];
  pagination: CommunityPagination;
}

export interface GetPostsParams {
  page?: number;
  limit?: number;
  tag?: string;
  region?: string;
  cropType?: CropType;
  q?: string;
}

export interface CommunitySimpleResponse {
  success: boolean;
  message: string;
}

export interface CreatePostPayload {
  content: string;
  tagIds: string[];
  region?: string;
  cropType?: CropType;
  images?: string[];
}

export interface CreatePostResponse {
  success: boolean;
  message: string;
  data: CommunityPost;
}

export interface CommunityCommentAuthor {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  reputationScore: number;
}

export interface CommunityComment {
  id: string;
  postId: string;
  parentId: string | null;
  content: string;
  helpfulCount: number;
  solvedCount: number;
  createdAt: string;
  author: CommunityCommentAuthor;
  replies?: CommunityComment[];
}

export interface GetCommentsResponse {
  success: boolean;
  message: string;
  data: CommunityComment[];
  pagination: CommunityPagination;
}

export interface CreateCommentResponse {
  success: boolean;
  message: string;
  data: CommunityComment;
}

export interface CommentMarkResponse {
  success: boolean;
  message: string;
  data?: {
    commentId: string;
    helpfulCount: number;
    solvedCount: number;
  };
}

export interface GetSavedPostsResponse {
  success: boolean;
  message: string;
  data: CommunityPost[];
  pagination: CommunityPagination;
}

export interface FollowUserResponse {
  success: boolean;
  message: string;
  isFollowing?: boolean;
  followersCount?: number;
}

export interface GetMyPostsResponse {
  success: boolean;
  message: string;
  data: CommunityPost[];
  pagination: CommunityPagination;
}

export interface GetMyPostsParams {
  page?: number;
  limit?: number;
}

export interface ConnectionUser {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  reputationScore: number;
  followedAt: string;
  isFollowing?: boolean;
}

export interface GetConnectionsResponse {
  success: boolean;
  message: string;
  data: ConnectionUser[];
  pagination: CommunityPagination;
}

export interface GetConnectionsParams {
  page?: number;
  limit?: number;
}
