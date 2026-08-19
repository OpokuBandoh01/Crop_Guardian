// stores/communityStore.ts

import {
  fetchCommunityPosts,
  fetchCommunityTags,
  fetchSavedPosts,
  followCommunityUser,
  likeCommunityPost,
  saveCommunityPost,
  unfollowCommunityUser,
  unlikeCommunityPost,
  unsaveCommunityPost,
} from "@/services/communityApi";
import type { CommunityPost, CommunityTag } from "@/types/community";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const POSTS_PER_PAGE = 10;
const SAVED_PER_PAGE = 10;

interface CommunityStore {
  tags: CommunityTag[];
  tagsLoading: boolean;

  posts: CommunityPost[];
  postsLoading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  postsError: string | null;

  page: number;
  totalPages: number;

  selectedTagSlug: string | null;
  searchQuery: string;

  likingPostIds: Record<string, boolean>;

  savingPostIds: Record<string, boolean>;
  followingUserIds: Record<string, boolean>;
  //in-flight follow requests keyed by userId
  followLoadingUserIds: Record<string, boolean>;

  //saved posts screen state
  savedPosts: CommunityPost[];
  savedLoading: boolean;
  savedRefreshing: boolean;
  savedLoadingMore: boolean;
  savedError: string | null;
  savedPage: number;
  savedTotalPages: number;

  fetchTags: () => Promise<void>;
  fetchPosts: (options?: { reset?: boolean }) => Promise<void>;
  refreshPosts: () => Promise<void>;
  loadMorePosts: () => Promise<void>;
  setSelectedTag: (slug: string | null) => void;
  setSearchQuery: (query: string) => void;
  submitSearch: () => void;
  toggleLike: (postId: string) => Promise<void>;

  toggleSave: (postId: string) => Promise<void>;
  toggleFollow: (userId: string) => Promise<void>;
  fetchSavedPostsList: (options?: { reset?: boolean }) => Promise<void>;
  refreshSavedPosts: () => Promise<void>;
  loadMoreSavedPosts: () => Promise<void>;
}

export const useCommunityStore = create<CommunityStore>()(
  persist(
    (set, get) => ({
      tags: [],
      tagsLoading: false,

      posts: [],
      postsLoading: false,
      refreshing: false,
      loadingMore: false,
      postsError: null,

      page: 1,
      totalPages: 1,

      selectedTagSlug: null,
      searchQuery: "",

      likingPostIds: {},
      savingPostIds: {},
      followingUserIds: {},
      followLoadingUserIds: {},

      savedPosts: [],
      savedLoading: false,
      savedRefreshing: false,
      savedLoadingMore: false,
      savedError: null,
      savedPage: 1,
      savedTotalPages: 1,

      fetchTags: async () => {
        set({ tagsLoading: true });
        try {
          const res = await fetchCommunityTags();
          if (res.success) {
            set({ tags: res.data });
          }
        } catch (err) {
          console.error("Failed to fetch community tags:", err);
        } finally {
          set({ tagsLoading: false });
        }
      },

      fetchPosts: async (options) => {
        const reset = options?.reset ?? true;
        const { selectedTagSlug, searchQuery } = get();
        const isFirstLoad = reset && get().posts.length === 0;
        set({
          postsLoading: isFirstLoad,
          postsError: null,
        });

        try {
          const res = await fetchCommunityPosts({
            page: reset ? 1 : get().page,
            limit: POSTS_PER_PAGE,
            tag: selectedTagSlug ?? undefined,
            q: searchQuery.trim() ? searchQuery.trim() : undefined,
          });

          if (res.success) {
            //seed followingUserIds from author.isFollowing on this page
            const followUpdates: Record<string, boolean> = {
              ...get().followingUserIds,
            };
            res.data.forEach((p) => {
              if (typeof p.author.isFollowing === "boolean") {
                followUpdates[p.author.id] = p.author.isFollowing;
              }
            });

            set((state) => ({
              posts: reset ? res.data : [...state.posts, ...res.data],
              page: res.pagination.page,
              totalPages: res.pagination.totalPages,
              followingUserIds: followUpdates,
            }));
          }
        } catch (err) {
          console.error("Failed to fetch community posts:", err);
          set({ postsError: "Could not load posts. Pull down to try again." });
        } finally {
          set({ postsLoading: false });
        }
      },

      refreshPosts: async () => {
        set({ refreshing: true });
        await get().fetchPosts({ reset: true });
        set({ refreshing: false });
      },

      loadMorePosts: async () => {
        const { page, totalPages, loadingMore, postsLoading, refreshing } =
          get();
        if (loadingMore || postsLoading || refreshing) return;
        if (page >= totalPages) return;

        set({ loadingMore: true, page: page + 1 });
        await get().fetchPosts({ reset: false });
        set({ loadingMore: false });
      },

      setSelectedTag: (slug) => {
        const current = get().selectedTagSlug;
        const next = current === slug ? null : slug;
        set({ selectedTagSlug: next });
        get().fetchPosts({ reset: true });
      },

      setSearchQuery: (query) => set({ searchQuery: query }),

      submitSearch: () => {
        get().fetchPosts({ reset: true });
      },

      toggleLike: async (postId) => {
        const { posts, likingPostIds, savedPosts } = get();
        if (likingPostIds[postId]) return;

        const target =
          posts.find((p) => p.id === postId) ??
          savedPosts.find((p) => p.id === postId);
        if (!target) return;

        const wasLiked = target.isLiked ?? false;
        const previousCount = target.likesCount;

        const applyLike = (list: CommunityPost[]) =>
          list.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  isLiked: !wasLiked,
                  likesCount: wasLiked ? p.likesCount - 1 : p.likesCount + 1,
                }
              : p,
          );

        set({
          likingPostIds: { ...likingPostIds, [postId]: true },
          posts: applyLike(posts),
          savedPosts: applyLike(savedPosts),
        });

        try {
          if (wasLiked) {
            await unlikeCommunityPost(postId);
          } else {
            await likeCommunityPost(postId);
          }
        } catch (err) {
          console.error("Failed to toggle like:", err);
          set((state) => ({
            posts: state.posts.map((p) =>
              p.id === postId
                ? { ...p, isLiked: wasLiked, likesCount: previousCount }
                : p,
            ),
            savedPosts: state.savedPosts.map((p) =>
              p.id === postId
                ? { ...p, isLiked: wasLiked, likesCount: previousCount }
                : p,
            ),
          }));
        } finally {
          set((state) => {
            const updated = { ...state.likingPostIds };
            delete updated[postId];
            return { likingPostIds: updated };
          });
        }
      },

      //optimistic save / unsave
      toggleSave: async (postId) => {
        const { posts, savingPostIds, savedPosts } = get();
        if (savingPostIds[postId]) return;

        const inFeed = posts.find((p) => p.id === postId);
        const inSaved = savedPosts.find((p) => p.id === postId);
        const target = inFeed ?? inSaved;
        if (!target) return;

        // On saved list every item is saved; on feed use isSaved
        const wasSaved = inSaved ? true : (target.isSaved ?? false);
        const previousCount = target.savesCount;

        const applySave = (list: CommunityPost[]) =>
          list.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  isSaved: !wasSaved,
                  savesCount: wasSaved
                    ? Math.max(0, p.savesCount - 1)
                    : p.savesCount + 1,
                }
              : p,
          );

        set({
          savingPostIds: { ...savingPostIds, [postId]: true },
          posts: applySave(posts),
          // If unsaving from saved screen, remove the row immediately
          savedPosts: wasSaved
            ? savedPosts.filter((p) => p.id !== postId)
            : applySave(savedPosts),
        });

        try {
          if (wasSaved) {
            await unsaveCommunityPost(postId);
          } else {
            await saveCommunityPost(postId);
          }
        } catch (err) {
          console.error("Failed to toggle save:", err);
          set((state) => ({
            posts: state.posts.map((p) =>
              p.id === postId
                ? { ...p, isSaved: wasSaved, savesCount: previousCount }
                : p,
            ),
            // Put the row back if unsave failed
            savedPosts:
              wasSaved && inSaved
                ? [inSaved, ...state.savedPosts.filter((p) => p.id !== postId)]
                : state.savedPosts,
          }));
        } finally {
          set((state) => {
            const updated = { ...state.savingPostIds };
            delete updated[postId];
            return { savingPostIds: updated };
          });
        }
      },

      //optimistic follow / unfollow (persisted via followingUserIds)
      toggleFollow: async (userId) => {
        const { followingUserIds, followLoadingUserIds, posts } = get();
        if (followLoadingUserIds[userId]) return;

        const wasFollowing =
          followingUserIds[userId] ??
          posts.find((p) => p.author.id === userId)?.author.isFollowing ??
          false;

        set({
          followLoadingUserIds: { ...followLoadingUserIds, [userId]: true },
          followingUserIds: {
            ...followingUserIds,
            [userId]: !wasFollowing,
          },
          posts: posts.map((p) =>
            p.author.id === userId
              ? {
                  ...p,
                  author: {
                    ...p.author,
                    isFollowing: !wasFollowing,
                  },
                }
              : p,
          ),
        });

        try {
          if (wasFollowing) {
            await unfollowCommunityUser(userId);
          } else {
            await followCommunityUser(userId);
          }
        } catch (err) {
          console.error("Failed to toggle follow:", err);
          set((state) => ({
            followingUserIds: {
              ...state.followingUserIds,
              [userId]: wasFollowing,
            },
            posts: state.posts.map((p) =>
              p.author.id === userId
                ? {
                    ...p,
                    author: {
                      ...p.author,
                      isFollowing: wasFollowing,
                    },
                  }
                : p,
            ),
          }));
        } finally {
          set((state) => {
            const updated = { ...state.followLoadingUserIds };
            delete updated[userId];
            return { followLoadingUserIds: updated };
          });
        }
      },

      //saved posts list
      fetchSavedPostsList: async (options) => {
        const reset = options?.reset ?? true;
        const isFirstLoad = reset && get().savedPosts.length === 0;
        set({
          savedLoading: isFirstLoad,
          savedError: null,
        });

        try {
          const res = await fetchSavedPosts({
            page: reset ? 1 : get().savedPage,
            limit: SAVED_PER_PAGE,
          });

          if (res.success) {
            set((state) => ({
              savedPosts: reset ? res.data : [...state.savedPosts, ...res.data],
              savedPage: res.pagination.page,
              savedTotalPages: res.pagination.totalPages,
            }));
          }
        } catch (err) {
          console.error("Failed to fetch saved posts:", err);
          set({
            savedError: "Could not load saved posts. Pull down to try again.",
          });
        } finally {
          set({ savedLoading: false });
        }
      },

      refreshSavedPosts: async () => {
        set({ savedRefreshing: true });
        await get().fetchSavedPostsList({ reset: true });
        set({ savedRefreshing: false });
      },

      loadMoreSavedPosts: async () => {
        const {
          savedPage,
          savedTotalPages,
          savedLoadingMore,
          savedLoading,
          savedRefreshing,
        } = get();
        if (savedLoadingMore || savedLoading || savedRefreshing) return;
        if (savedPage >= savedTotalPages) return;

        set({ savedLoadingMore: true, savedPage: savedPage + 1 });
        await get().fetchSavedPostsList({ reset: false });
        set({ savedLoadingMore: false });
      },
    }),
    {
      //persist only follow map so Follow/Following survives restart
      name: "community-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        followingUserIds: state.followingUserIds,
      }),
    },
  ),
);
