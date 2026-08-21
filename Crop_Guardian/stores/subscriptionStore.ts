import {
    activateSubscription,
    buildPaymentReference,
    getSubscriptionStatus,
} from "@/services/subscriptionApi";
import { useAuthStore } from "@/stores/authStore";
import type { SubscriptionStatus } from "@/types/subscription";
import { create } from "zustand";

interface SubscriptionStore {
  status: SubscriptionStatus | null;
  loading: boolean;
  subscribing: boolean;
  error: string | null;

  fetchStatus: () => Promise<void>;
  subscribe: () => Promise<{ ok: boolean; message: string }>;
  clearError: () => void;
  reset: () => void;
}

const defaultFreeHint: SubscriptionStatus = {
  success: true,
  plan: "FREE",
  planName: "Free",
  isPaid: false,
  status: null,
  startsAt: null,
  endsAt: null,
  scanLimit: 5,
  remainingFreeScans: 5,
  hasCropInsights: false,
  amountGhs: 0,
  source: null,
};

export const useSubscriptionStore = create<SubscriptionStore>((set, get) => ({
  status: null,
  loading: false,
  subscribing: false,
  error: null,

  // NEW ADDITION: Load plan + remaining free scans from backend
  fetchStatus: async () => {
    const token = useAuthStore.getState().token;
    if (!token) {
      set({ status: null, loading: false });
      return;
    }

    set({ loading: true, error: null });
    try {
      const data = await getSubscriptionStatus();
      set({ status: data, loading: false });
    } catch (err: any) {
      console.error("Subscription status error:", err?.message);
      // Keep last known status if any; otherwise a safe free default
      if (!get().status) {
        set({ status: defaultFreeHint });
      }
      set({
        loading: false,
        error: "Unable to load plan status right now.",
      });
    }
  },

  // NEW ADDITION: Activate Farmer Monthly (same body shape Paystack will use later)
  subscribe: async () => {
    const user = useAuthStore.getState().user;
    const email = user?.email;

    if (!email) {
      return {
        ok: false,
        message: "Your account email is missing. Please sign in again.",
      };
    }

    if (get().subscribing) {
      return { ok: false, message: "Please wait..." };
    }

    set({ subscribing: true, error: null });

    try {
      const body = {
        email,
        amount: 5000, // 50 GHS in pesewas
        currency: "GHS" as const,
        reference: buildPaymentReference(user?.id),
        metadata: { planCode: "FARMER_MONTHLY" as const },
      };

      const result = await activateSubscription(body);

      // Refresh status so UI updates immediately
      await get().fetchStatus();
      set({ subscribing: false });

      return {
        ok: true,
        message: result.message || "Farmer Monthly is now active.",
      };
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        "Unable to complete subscription. Please try again.";
      set({ subscribing: false, error: message });
      return { ok: false, message };
    }
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      status: null,
      loading: false,
      subscribing: false,
      error: null,
    }),
}));
