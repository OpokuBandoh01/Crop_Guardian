// constants/cropTypeOptions.ts
// Display labels for each CropType enum value, used to populate the Crop
// Type picker on Create Post. Kept separate from types/user.ts, which
// only defines the TYPE (the union of valid strings) — this file defines
// the human-readable label shown next to each one in the UI.

import type { CropType } from "@/types/user";

export const CROP_TYPE_OPTIONS: { label: string; value: CropType }[] = [
  { label: "Maize", value: "MAIZE" },
  { label: "Tomato", value: "TOMATO" },
  { label: "Cassava", value: "CASSAVA" },
  { label: "Plantain", value: "PLANTAIN" },
  { label: "Pepper", value: "PEPPER" },
  { label: "Cocoa", value: "COCOA" },
  { label: "Rice", value: "RICE" },
  { label: "Yam", value: "YAM" },
  { label: "Groundnut", value: "GROUNDNUT" },
  { label: "Onion", value: "ONION" },
];
