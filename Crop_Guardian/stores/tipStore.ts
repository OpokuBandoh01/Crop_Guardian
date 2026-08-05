// stores/tipStore.ts
// Manages the Daily Tips feature end to end on the client: fetching
// today's tips, caching them for offline use, and exposing loading/error
// state so any component (card, full screen) can disable interactive
// elements while a request is in flight. Follows the same shape and
// conventions as stores/notificationStore.ts for consistency.

import {
    todayTipsResponseSchema,
    type DailyTipItem,
} from "@/schemas/tipSchema";
import API from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// TypeScript: this interface declares every piece of state and every
// action (function) the store exposes. Any component reading from this
// store gets autocomplete and a compile error if it tries to access a
// field that doesn't exist here.
interface TipStore {
  todayTips: DailyTipItem[];
  date: string | null; // YYYY-MM-DD in Africa/Accra, as returned by the backend
  fromCache: boolean; // true if the backend served this from its own day-cache
  loading: boolean;
  error: string | null;

  fetchTodayTips: () => Promise<void>;
  clearError: () => void;
}

export const useTipStore = create<TipStore>()(
  persist(
    // TypeScript: `set` updates state, `get` reads current state from
    // inside an action. `get` is used below to guard against firing two
    // fetches at once (e.g. pull-to-refresh + screen focus both firing).
    (set, get) => ({
      todayTips: [],
      date: null,
      fromCache: false,
      loading: false,
      error: null,

      fetchTodayTips: async () => {
        const { loading } = get();
        if (loading) return; // prevent duplicate in-flight requests

        set({ loading: true, error: null });

        try {
          const res = await API.get("/api/tips/today");

          // TypeScript + Zod: `.parse()` validates the response shape at
          // runtime AND narrows `parsed`'s TypeScript type to
          // TodayTipsResponse. If the backend shape ever changes
          // unexpectedly, this throws here instead of corrupting state.
          const parsed = todayTipsResponseSchema.parse(res.data);

          if (!parsed.success) {
            // Backend responded 200 but reported failure (defensive check;
            // current backend sends this case as a non-2xx status instead,
            // which is handled in the catch block below).
            set({ error: parsed.message || "No tips available right now." });
            return;
          }

          set({
            todayTips: parsed.tips,
            date: parsed.date,
            fromCache: parsed.fromCache ?? false,
          });
        } catch (err: any) {
          console.error("Failed to fetch daily tips:", err);

          // Use the backend's own message when available (e.g. "No tips
          // available yet. Please seed the daily tips pool and try again."),
          // otherwise fall back to a generic, secure message.
          const backendMessage = err?.response?.data?.message;
          set({
            error:
              backendMessage || "Could not load today's tips. Pull to refresh.",
          });
          // No manual AsyncStorage fallback needed: zustand's `persist`
          // below already keeps the last successful `todayTips` in
          // storage, so on failure we simply keep whatever was already
          // there instead of clearing the screen.
        } finally {
          set({ loading: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "tip-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
