// stores/communityStore.ts

import {
  deleteCommunityPost,
  fetchCommunityPosts,
  fetchCommunityTags,
  fetchFollowers,
  fetchFollowing,
  fetchMyPosts,
  fetchSavedPosts,
  followCommunityUser,
  likeCommunityPost,
  saveCommunityPost,
  unfollowCommunityUser,
  unlikeCommunityPost,
  unsaveCommunityPost,
} from "@/services/communityApi";
import type {
  CommunityPost,
  CommunityTag,
  ConnectionUser,
} from "@/types/community";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const POSTS_PER_PAGE = 10;
const SAVED_PER_PAGE = 10;
const MY_POSTS_PER_PAGE = 10;
const CONNECTIONS_PER_PAGE = 20;

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

  myPosts: CommunityPost[];
  myPostsLoading: boolean;
  myPostsRefreshing: boolean;
  myPostsLoadingMore: boolean;
  myPostsError: string | null;
  myPostsPage: number;
  myPostsTotalPages: number;
  deletingPostIds: Record<string, boolean>;

  followers: ConnectionUser[];
  followersLoading: boolean;
  followersRefreshing: boolean;
  followersLoadingMore: boolean;
  followersError: string | null;
  followersPage: number;
  followersTotalPages: number;

  followingList: ConnectionUser[];
  followingListLoading: boolean;
  followingListRefreshing: boolean;
  followingListLoadingMore: boolean;
  followingListError: string | null;
  followingListPage: number;
  followingListTotalPages: number;

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

  fetchMyPostsList: (options?: { reset?: boolean }) => Promise<void>;
  refreshMyPosts: () => Promise<void>;
  loadMoreMyPosts: () => Promise<void>;
  // optimistic delete: removes from myPosts + posts + savedPosts, restores on error
  deleteMyPost: (postId: string) => Promise<boolean>;

  fetchFollowersList: (
    userId: string,
    options?: { reset?: boolean },
  ) => Promise<void>;
  refreshFollowersList: (userId: string) => Promise<void>;
  loadMoreFollowers: (userId: string) => Promise<void>;
  fetchFollowingList: (
    userId: string,
    options?: { reset?: boolean },
  ) => Promise<void>;
  refreshFollowingList: (userId: string) => Promise<void>;
  loadMoreFollowing: (userId: string) => Promise<void>;
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

      myPosts: [],
      myPostsLoading: false,
      myPostsRefreshing: false,
      myPostsLoadingMore: false,
      myPostsError: null,
      myPostsPage: 1,
      myPostsTotalPages: 1,
      deletingPostIds: {},

      followers: [],
      followersLoading: false,
      followersRefreshing: false,
      followersLoadingMore: false,
      followersError: null,
      followersPage: 1,
      followersTotalPages: 1,

      followingList: [],
      followingListLoading: false,
      followingListRefreshing: false,
      followingListLoadingMore: false,
      followingListError: null,
      followingListPage: 1,
      followingListTotalPages: 1,

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
        const {
          followingUserIds,
          followLoadingUserIds,
          posts,
          followers,
          followingList,
        } = get();
        if (followLoadingUserIds[userId]) return;

        const wasFollowing =
          followingUserIds[userId] ??
          posts.find((p) => p.author.id === userId)?.author.isFollowing ??
          followers.find((u) => u.id === userId)?.isFollowing ??
          followingList.find((u) => u.id === userId)?.isFollowing ??
          false;

        const applyIsFollowing = (list: ConnectionUser[]) =>
          list.map((u) =>
            u.id === userId ? { ...u, isFollowing: !wasFollowing } : u,
          );

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
          //  keep row, only flip isFollowing on both tabs
          followers: applyIsFollowing(followers),
          followingList: applyIsFollowing(followingList),
        });

        try {
          if (wasFollowing) {
            await unfollowCommunityUser(userId);
          } else {
            await followCommunityUser(userId);
          }
        } catch (err) {
          console.error("Failed to toggle follow:", err);
          const revertIsFollowing = (list: ConnectionUser[]) =>
            list.map((u) =>
              u.id === userId ? { ...u, isFollowing: wasFollowing } : u,
            );
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
            followers: revertIsFollowing(state.followers),
            followingList: revertIsFollowing(state.followingList),
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

      fetchMyPostsList: async (options) => {
        const reset = options?.reset ?? true;
        const isFirstLoad = reset && get().myPosts.length === 0;
        set({
          myPostsLoading: isFirstLoad,
          myPostsError: null,
        });

        try {
          const res = await fetchMyPosts({
            page: reset ? 1 : get().myPostsPage,
            limit: MY_POSTS_PER_PAGE,
          });

          if (res.success) {
            set((state) => ({
              myPosts: reset ? res.data : [...state.myPosts, ...res.data],
              myPostsPage: res.pagination.page,
              myPostsTotalPages: res.pagination.totalPages,
            }));
          }
        } catch (err) {
          console.error("Failed to fetch my posts:", err);
          set({
            myPostsError: "Could not load your posts. Pull down to try again.",
          });
        } finally {
          set({ myPostsLoading: false });
        }
      },

      refreshMyPosts: async () => {
        set({ myPostsRefreshing: true });
        await get().fetchMyPostsList({ reset: true });
        set({ myPostsRefreshing: false });
      },

      loadMoreMyPosts: async () => {
        const {
          myPostsPage,
          myPostsTotalPages,
          myPostsLoadingMore,
          myPostsLoading,
          myPostsRefreshing,
        } = get();
        if (myPostsLoadingMore || myPostsLoading || myPostsRefreshing) return;
        if (myPostsPage >= myPostsTotalPages) return;

        set({ myPostsLoadingMore: true, myPostsPage: myPostsPage + 1 });
        await get().fetchMyPostsList({ reset: false });
        set({ myPostsLoadingMore: false });
      },

      deleteMyPost: async (postId) => {
        const { myPosts, posts, savedPosts, deletingPostIds } = get();

        if (deletingPostIds[postId]) return false;

        const removedFromMy = myPosts.find((p) => p.id === postId);
        if (!removedFromMy) return false;

        const previousMyPosts = myPosts;
        const previousPosts = posts;
        const previousSaved = savedPosts;

        // optimistic remove everywhere this post might appear
        set({
          deletingPostIds: { ...deletingPostIds, [postId]: true },
          myPosts: myPosts.filter((p) => p.id !== postId),
          posts: posts.filter((p) => p.id !== postId),
          savedPosts: savedPosts.filter((p) => p.id !== postId),
        });

        try {
          const res = await deleteCommunityPost(postId);
          if (!res.success) {
            // restore on soft failure
            set({
              myPosts: previousMyPosts,
              posts: previousPosts,
              savedPosts: previousSaved,
            });
            return false;
          }
          return true;
        } catch (err) {
          console.error("Failed to delete post:", err);
          // restore on network / hard failure
          set({
            myPosts: previousMyPosts,
            posts: previousPosts,
            savedPosts: previousSaved,
          });
          return false;
        } finally {
          set((state) => {
            const updated = { ...state.deletingPostIds };
            delete updated[postId];
            return { deletingPostIds: updated };
          });
        }
      },

      //  followers list for connections screen
      fetchFollowersList: async (userId, options) => {
        const reset = options?.reset ?? true;
        const isFirstLoad = reset && get().followers.length === 0;
        set({
          followersLoading: isFirstLoad,
          followersError: null,
        });

        try {
          const res = await fetchFollowers(userId, {
            page: reset ? 1 : get().followersPage,
            limit: CONNECTIONS_PER_PAGE,
          });

          if (res.success) {
            const followUpdates: Record<string, boolean> = {
              ...get().followingUserIds,
            };
            res.data.forEach((u) => {
              if (typeof u.isFollowing === "boolean") {
                followUpdates[u.id] = u.isFollowing;
              }
            });

            set((state) => ({
              followers: reset ? res.data : [...state.followers, ...res.data],
              followersPage: res.pagination.page,
              followersTotalPages: res.pagination.totalPages,
              followingUserIds: followUpdates,
            }));
          }
        } catch (err) {
          console.error("Failed to fetch followers:", err);
          set({
            followersError: "Could not load followers. Pull down to try again.",
          });
        } finally {
          set({ followersLoading: false });
        }
      },

      refreshFollowersList: async (userId) => {
        set({ followersRefreshing: true });
        await get().fetchFollowersList(userId, { reset: true });
        set({ followersRefreshing: false });
      },

      loadMoreFollowers: async (userId) => {
        const {
          followersPage,
          followersTotalPages,
          followersLoadingMore,
          followersLoading,
          followersRefreshing,
        } = get();
        if (followersLoadingMore || followersLoading || followersRefreshing)
          return;
        if (followersPage >= followersTotalPages) return;

        set({
          followersLoadingMore: true,
          followersPage: followersPage + 1,
        });
        await get().fetchFollowersList(userId, { reset: false });
        set({ followersLoadingMore: false });
      },

      //  following list for connections screen
      fetchFollowingList: async (userId, options) => {
        const reset = options?.reset ?? true;
        const isFirstLoad = reset && get().followingList.length === 0;
        set({
          followingListLoading: isFirstLoad,
          followingListError: null,
        });

        try {
          const res = await fetchFollowing(userId, {
            page: reset ? 1 : get().followingListPage,
            limit: CONNECTIONS_PER_PAGE,
          });

          if (res.success) {
            const followUpdates: Record<string, boolean> = {
              ...get().followingUserIds,
            };
            res.data.forEach((u) => {
              if (typeof u.isFollowing === "boolean") {
                followUpdates[u.id] = u.isFollowing;
              }
            });

            set((state) => ({
              followingList: reset
                ? res.data
                : [...state.followingList, ...res.data],
              followingListPage: res.pagination.page,
              followingListTotalPages: res.pagination.totalPages,
              followingUserIds: followUpdates,
            }));
          }
        } catch (err) {
          console.error("Failed to fetch following:", err);
          set({
            followingListError:
              "Could not load following. Pull down to try again.",
          });
        } finally {
          set({ followingListLoading: false });
        }
      },

      refreshFollowingList: async (userId) => {
        set({ followingListRefreshing: true });
        await get().fetchFollowingList(userId, { reset: true });
        set({ followingListRefreshing: false });
      },

      loadMoreFollowing: async (userId) => {
        const {
          followingListPage,
          followingListTotalPages,
          followingListLoadingMore,
          followingListLoading,
          followingListRefreshing,
        } = get();
        if (
          followingListLoadingMore ||
          followingListLoading ||
          followingListRefreshing
        )
          return;
        if (followingListPage >= followingListTotalPages) return;

        set({
          followingListLoadingMore: true,
          followingListPage: followingListPage + 1,
        });
        await get().fetchFollowingList(userId, { reset: false });
        set({ followingListLoadingMore: false });
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
