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
  clearError: () => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      loading: false,
      error: null,

      // NEW ADDITION: Fetch notifications with loading state
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

      // NEW ADDITION: Mark single notification as read (optimistic)
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

      // NEW ADDITION: Mark all as read
      markAllAsRead: async () => {
        set({ loading: true });
        try {
          // Optimistic
          const updated = get().notifications.map((n) => ({
            ...n,
            isRead: true,
          }));
          set({
            notifications: updated,
            unreadCount: 0,
          });

          // TODO: Add backend bulk endpoint later if needed. For now, mark one-by-one or use existing.
          const promises = get()
            .notifications.filter((n) => !n.isRead)
            .map((n) => API.patch(`/api/notifications/${n.id}/read`));

          await Promise.all(promises);
        } catch (err) {
          console.error("Failed to mark all as read:", err);
          get().fetchNotifications();
        } finally {
          set({ loading: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "notification-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
