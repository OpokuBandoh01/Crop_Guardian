export interface SubscriptionStatus {
  success: boolean;
  plan: "FREE" | "FARMER_MONTHLY" | string;
  planName: string;
  isPaid: boolean;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED" | null;
  startsAt: string | null;
  endsAt: string | null;
  scanLimit: number | null;
  remainingFreeScans: number;
  scansUsedThisMonth?: number;
  hasCropInsights: boolean;
  amountGhs: number | null;
  source: "DEMO" | "PAYSTACK" | "MANUAL" | null;
}

export interface SubscribeRequestBody {
  email: string;
  amount: number; // pesewas: 50 GHS = 5000
  currency: "GHS";
  reference?: string;
  metadata?: {
    planCode: "FARMER_MONTHLY";
  };
}

export interface SubscribeSuccessResponse {
  success: true;
  message: string;
  plan: string;
  planName: string;
  startsAt: string;
  endsAt: string;
  amountGhs: number;
  source: string;
  reference: string | null;
}

export interface SubscribeErrorResponse {
  success: false;
  message: string;
}
