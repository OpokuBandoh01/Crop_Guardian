// stores/communityStore.ts
// Holds the Community feed's state: the tag list, the posts array,
// pagination, active filters, and separate loading flags for each kind
// of loading (first load vs. pull-to-refresh vs. infinite scroll), so
// the screen can disable exactly the right controls at the right time.
// This store is NOT persisted to AsyncStorage, feed data is meant to be
// fresh on every app open, unlike auth/onboarding state.

import {
    fetchCommunityPosts,
    fetchCommunityTags,
    likeCommunityPost,
    unlikeCommunityPost,
} from "@/services/communityApi";
import type { CommunityPost, CommunityTag } from "@/types/community";
import { create } from "zustand";

// The main feed's own hard cap is 20 (see the API guide), we ask for a
// smaller, friendlier page size well under that limit.
const POSTS_PER_PAGE = 10;

interface CommunityStore {
  // ── Tags / categories ──────────────────────────────────────────────
  tags: CommunityTag[];
  tagsLoading: boolean;

  // ── Feed ────────────────────────────────────────────────────────────
  posts: CommunityPost[];
  postsLoading: boolean; // true only during the very first load
  refreshing: boolean; // true during pull-to-refresh
  loadingMore: boolean; // true while fetching the next page
  postsError: string | null;

  page: number;
  totalPages: number;

  // ── Filters ─────────────────────────────────────────────────────────
  selectedTagSlug: string | null;
  searchQuery: string;

  // Tracks which post IDs currently have a like/unlike request in
  // flight, so only THAT post's heart button disables, not the whole
  // feed. A `Record<string, boolean>` (a plain object keyed by post id)
  // is used rather than a JS Set, since plain objects/arrays behave more
  // predictably with Zustand's shallow state updates than Set mutation
  // does.
  likingPostIds: Record<string, boolean>;

  fetchTags: () => Promise<void>;
  fetchPosts: (options?: { reset?: boolean }) => Promise<void>;
  refreshPosts: () => Promise<void>;
  loadMorePosts: () => Promise<void>;
  setSelectedTag: (slug: string | null) => void;
  setSearchQuery: (query: string) => void;
  submitSearch: () => void;
  toggleLike: (postId: string) => Promise<void>;
}

export const useCommunityStore = create<CommunityStore>((set, get) => ({
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

    // Only a genuinely empty feed shows the big centered spinner. A
    // reset triggered by changing a filter, while posts are already on
    // screen, relies on the search/filter/tab controls disabling
    // instead (handled in the screen via `isBusy`), so it does not also
    // need to blank the whole list.
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
        set((state) => ({
          posts: reset ? res.data : [...state.posts, ...res.data],
          page: res.pagination.page,
          totalPages: res.pagination.totalPages,
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
    const { page, totalPages, loadingMore, postsLoading, refreshing } = get();
    // Guard against firing a duplicate request while one is already in
    // flight, or when there simply is no next page left.
    if (loadingMore || postsLoading || refreshing) return;
    if (page >= totalPages) return;

    set({ loadingMore: true, page: page + 1 });
    await get().fetchPosts({ reset: false });
    set({ loadingMore: false });
  },

  setSelectedTag: (slug) => {
    const current = get().selectedTagSlug;
    // Tapping the already-selected chip again clears the filter, this
    // is the common "toggle" behavior for filter chips.
    const next = current === slug ? null : slug;
    set({ selectedTagSlug: next });
    get().fetchPosts({ reset: true });
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  submitSearch: () => {
    get().fetchPosts({ reset: true });
  },

  toggleLike: async (postId) => {
    const { posts, likingPostIds } = get();
    if (likingPostIds[postId]) return; // a request for this post is already in flight

    const target = posts.find((p) => p.id === postId);
    if (!target) return;

    const wasLiked = target.isLiked ?? false;
    const previousCount = target.likesCount;

    // Optimistic update: flip the like state and count immediately so
    // the tap feels instant, then roll back only if the request fails.
    set({
      likingPostIds: { ...likingPostIds, [postId]: true },
      posts: posts.map((p) =>
        p.id === postId
          ? {
              ...p,
              isLiked: !wasLiked,
              likesCount: wasLiked ? p.likesCount - 1 : p.likesCount + 1,
            }
          : p,
      ),
    });

    try {
      if (wasLiked) {
        await unlikeCommunityPost(postId);
      } else {
        await likeCommunityPost(postId);
      }
    } catch (err) {
      console.error("Failed to toggle like:", err);
      // Roll back to the exact pre-tap state on failure.
      set((state) => ({
        posts: state.posts.map((p) =>
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
}));
