// schema/tipSchema.ts
// Mirrors the backend Zod schema exactly (see backend schema/tipSchema.ts).
// Keeping a matching copy on the frontend means the API response gets
// validated at runtime, not just trusted blindly - if the backend shape
// ever drifts, this throws a clear error instead of silently breaking the UI.

import { z } from "zod";

export const dailyTipItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  order: z.number().int().min(1).max(5),
  themes: z.array(z.string()).optional(),
  cropTypes: z.array(z.string()).optional(),
  personalized: z.boolean().optional(),
});

// TypeScript: `z.infer<typeof X>` reads a TypeScript type directly out of
// a Zod schema, so we only have to define the shape once (above) and get
// a matching compile-time type for free, instead of writing an interface
// separately that could drift out of sync with the runtime schema.
export type DailyTipItem = z.infer<typeof dailyTipItemSchema>;

export const todayTipsResponseSchema = z.object({
  success: z.boolean(),
  date: z.string(),
  tips: z.array(dailyTipItemSchema).min(0).max(5),
  fromCache: z.boolean().optional(),
  message: z.string().optional(),
});

export type TodayTipsResponse = z.infer<typeof todayTipsResponseSchema>;
