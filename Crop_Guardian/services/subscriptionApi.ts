import API from "@/services/api";
import type {
    SubscribeRequestBody,
    SubscribeSuccessResponse,
    SubscriptionStatus,
} from "@/types/subscription";

export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  const res = await API.get<SubscriptionStatus>("/api/subscribe/status");
  return res.data;
}

export async function activateSubscription(
  body: SubscribeRequestBody,
): Promise<SubscribeSuccessResponse> {
  const res = await API.post<SubscribeSuccessResponse>("/api/subscribe", body);
  return res.data;
}

export function formatPlanEndDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function buildPaymentReference(userId?: string): string {
  const idPart = userId ? userId.slice(0, 8) : "guest";
  return `cg_${idPart}_${Date.now()}`;
}
