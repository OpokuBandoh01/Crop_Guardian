// constants/ghanaRegions.ts
// The 16 official regions of Ghana, exactly as required by the backend's
// GHANA_REGIONS validation on POST /api/community/posts. Values must
// match this casing and spacing exactly (e.g. "Western North", not
// "western north" or "Western-North") or the backend rejects the post
// with "Please select a valid Ghana region".

export const GHANA_REGIONS = [
  "Ahafo",
  "Ashanti",
  "Bono",
  "Bono East",
  "Central",
  "Eastern",
  "Greater Accra",
  "North East",
  "Northern",
  "Oti",
  "Savannah",
  "Upper East",
  "Upper West",
  "Volta",
  "Western",
  "Western North",
] as const;

// `typeof GHANA_REGIONS[number]` is TypeScript pulling a union type out of
// the array's actual values ("Ahafo" | "Ashanti" | ... | "Western North"),
// so a typo'd region string anywhere else in the app gets caught at
// compile time instead of only failing when the backend rejects it.
export type GhanaRegion = (typeof GHANA_REGIONS)[number];
