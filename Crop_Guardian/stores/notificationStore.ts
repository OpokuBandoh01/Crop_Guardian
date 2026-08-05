// stores/notificationStore.ts
import API from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  isRead: boolean;
  sentAt: string;
  actionLink?: string;
  metadata?: any;
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;

  fetchNotifications: (unreadOnly?: boolean) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  clearError: () => void;
  // NEW ADDITION: resets the transient UI flags (loading/error) back to a
  // clean state. This is called once, automatically, right after the
  // persisted store finishes rehydrating from AsyncStorage. See the
  // "onRehydrateStorage" option below for why this matters.
  resetTransientState: () => void;
}

export const useNotificationStore = create<NotificationStore>()(
  // UPDATED: persist() now takes two generic type parameters instead of one.
  // The first (NotificationStore) is the full store shape. The second
  // (the Pick<...> type) tells TypeScript exactly what shape partialize()
  // below is allowed to return, since we are now only persisting a subset
  // of the store to disk, not the whole thing.
  persist<
    NotificationStore,
    Pick<NotificationStore, "notifications" | "unreadCount">
  >(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      loading: false,
      error: null,

      // NO CHANGES: Fetch notifications with loading state
      fetchNotifications: async (unreadOnly = false) => {
        const { loading } = get();
        if (loading) return; // prevent multiple calls

        set({ loading: true, error: null });
        try {
          const res = await API.get("/api/notifications", {
            params: { unreadOnly: unreadOnly.toString() },
          });

          if (res.data?.success) {
            const fetched = res.data.data || [];
            set({
              notifications: fetched,
              unreadCount: fetched.filter((n: Notification) => !n.isRead)
                .length,
            });
          }
        } catch (err: any) {
          console.error("Failed to fetch notifications:", err);
          set({ error: "Could not load alerts. Please pull to refresh." });

          // Fallback to cache if offline
          const cached = await AsyncStorage.getItem("notifications_cache");
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              set({
                notifications: parsed,
                unreadCount: parsed.filter((n: Notification) => !n.isRead)
                  .length,
              });
            } catch {}
          }
        } finally {
          set({ loading: false });
        }
      },

      // NO CHANGES: Mark single notification as read (optimistic)
      markAsRead: async (id: string) => {
        const currentNotifications = get().notifications;
        const notificationIndex = currentNotifications.findIndex(
          (n) => n.id === id,
        );

        if (notificationIndex === -1) return;

        // Optimistic update
        const updatedNotifications = [...currentNotifications];
        updatedNotifications[notificationIndex] = {
          ...updatedNotifications[notificationIndex],
          isRead: true,
        };

        set({
          notifications: updatedNotifications,
          unreadCount: Math.max(0, get().unreadCount - 1),
        });

        try {
          await API.patch(`/api/notifications/${id}/read`);
        } catch (err) {
          console.error("Failed to mark as read:", err);
          // Revert on error
          set({ notifications: currentNotifications });
          get().fetchNotifications(); // sync again
        }
      },

      // NO CHANGES (already fixed in the previous pass): captures unread ids
      // before the optimistic update, then sends one PATCH per id.
      markAllAsRead: async () => {
        const currentNotifications = get().notifications;

        const unreadIds = currentNotifications
          .filter((n) => !n.isRead)
          .map((n) => n.id);

        if (unreadIds.length === 0) return;

        set({ loading: true, error: null });

        const updated = currentNotifications.map((n) => ({
          ...n,
          isRead: true,
        }));
        set({
          notifications: updated,
          unreadCount: 0,
        });

        try {
          const promises = unreadIds.map((id) =>
            API.patch(`/api/notifications/${id}/read`),
          );

          await Promise.all(promises);
        } catch (err) {
          console.error("Failed to mark all as read:", err);
          set({ notifications: currentNotifications });
          get().fetchNotifications();
        } finally {
          set({ loading: false });
        }
      },

      // NO CHANGES (already added in the previous pass)
      clearAllNotifications: async () => {
        const currentNotifications = get().notifications;
        const currentUnreadCount = get().unreadCount;

        if (currentNotifications.length === 0) return;

        set({ loading: true, error: null });

        set({ notifications: [], unreadCount: 0 });

        try {
          await API.delete("/api/notifications/clear-all");
          await AsyncStorage.removeItem("notifications_cache");
        } catch (err) {
          console.error("Failed to clear alerts:", err);
          set({
            notifications: currentNotifications,
            unreadCount: currentUnreadCount,
            error: "Could not clear alerts. Please try again.",
          });
        } finally {
          set({ loading: false });
        }
      },

      clearError: () => set({ error: null }),

      // NEW ADDITION: simple setter used only during rehydration, see below
      resetTransientState: () => set({ loading: false, error: null }),
    }),
    {
      name: "notification-storage",
      storage: createJSONStorage(() => AsyncStorage),

      // NEW ADDITION: this is the actual fix. Without partialize, zustand's
      // persist middleware writes the ENTIRE store to AsyncStorage, including
      // "loading" and "error", which are transient UI flags, not real data.
      // If the app was ever killed, crashed, or hot-reloaded while a request
      // was mid-flight, "loading: true" got saved to disk. On the next app
      // launch, that stale "true" was read back as the starting value.
      // Since fetchNotifications starts with "if (loading) return", it could
      // never run again to reset itself, AND both header buttons in
      // alerts.tsx are wired to disabled={loading}, so they rendered
      // permanently disabled, taps did nothing. partialize tells persist to
      // only ever save "notifications" and "unreadCount" to disk, loading
      // and error always start fresh (false / null) on every app launch.
      partialize: (state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
      }),

      // NEW ADDITION: extra safety net. Runs once, right after the persisted
      // subset above is loaded back into the store. Even if a bad
      // "loading: true" is somehow already sitting in an old install's
      // AsyncStorage from before this fix, this line clears it immediately,
      // no manual app reinstall or cache clear needed.
      onRehydrateStorage: () => (state) => {
        state?.resetTransientState();
      },
    },
  ),
);
