// constants/cropOptions.ts
// Single shared list of selectable crops, mapping each backend CropType
// enum value to a display label and (where available) an image asset.
// Both the Add Crop form and any future crop picker should import this
// instead of redefining their own list, so adding a new crop type only
// ever happens in one place.

import type { CropType } from "@/types/user";

export interface CropOption {
  type: CropType;
  label: string;
  // `image` is optional, the four newest crop types do not have artwork
  // yet, screens should fall back to a generic leaf icon when this is
  // undefined (see the fallback handling in CropFormModal.tsx).
  image?: any;
}

export const CROP_OPTIONS: CropOption[] = [
  {
    type: "MAIZE",
    label: "Maize",
    image: require("@/assets/images/maize.png"),
  },
  {
    type: "CASSAVA",
    label: "Cassava",
    image: require("@/assets/images/cassava.png"),
  },
  {
    type: "TOMATO",
    label: "Tomato",
    image: require("@/assets/images/tomato.png"),
  },
  {
    type: "PEPPER",
    label: "Pepper",
    image: require("@/assets/images/pepper.png"),
  },
  {
    type: "PLANTAIN",
    label: "Plantain",
    image: require("@/assets/images/plantain.png"),
  },
  {
    type: "COCOA",
    label: "Cocoa",
    image: require("@/assets/images/cocoa.png"),
  },
  // NEW ADDITION: no dedicated artwork yet, `image` is left undefined on
  // purpose, send the four image files if you want these to match the
  // others visually.
  { type: "RICE", label: "Rice" },
  { type: "YAM", label: "Yam" },
  { type: "GROUNDNUT", label: "Groundnut" },
  { type: "ONION", label: "Onion" },
];

export function getCropLabel(cropType: CropType): string {
  return CROP_OPTIONS.find((c) => c.type === cropType)?.label || cropType;
}
