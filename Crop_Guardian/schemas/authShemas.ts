// schemas/authSchemas.ts
//this is a frontend file
// This file mirrors the backend Zod schemas so we catch bad data
// BEFORE it ever reaches the network. Any change to the backend
// schema should be reflected here too.

import { z } from "zod";

// ─── Login ───────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),

  password: z.string().min(1, "Password is required"),
});

// z.infer extracts the TypeScript type from the Zod schema automatically.
// This keeps the type and validation rule always in sync — if you change
// the schema, the type updates for free.
export type LoginFormData = z.infer<typeof loginSchema>;

// ─── Sign-up ─────────────────────────────────────────────────────────────────
// Mirrors backend registerSchema + adds confirmPassword client-side.
export const signUpSchema = z
  .object({
    firstName: z
      .string()
      .min(1, "First name is required")
      .min(2, "First name must be at least 2 characters")
      // Only allow letters, spaces, hyphens, and apostrophes (common in Ghanaian names)
      .regex(/^[a-zA-Z\s'\-]+$/, "First name must only contain letters"),

    lastName: z
      .string()
      .min(1, "Last name is required")
      .min(2, "Last name must be at least 2 characters")
      .regex(/^[a-zA-Z\s'\-]+$/, "Last name must only contain letters"),

    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),

    // Phone number validation:
    // - Optional field (user may leave it blank)
    // - If provided, strip all non-digit characters first (spaces, dashes, +)
    // - Then check it's exactly 9 digits (Ghana local format without leading 0)
    //   OR 10 digits starting with 0 (Ghana local with leading 0)
    //   OR 12 digits starting with 233 (international format without +)
    // Backend stores the raw value, so we send the cleaned digits only
    phoneNumber: z
      .string()
      .optional()
      .transform((val) => {
        // If empty/undefined, return undefined so it's omitted from the payload
        if (!val || val.trim() === "") return undefined;
        // Strip everything that is not a digit
        return val.replace(/\D/g, "");
      })
      .refine(
        (val) => {
          // If undefined (user left it blank), that is fine
          if (!val) return true;
          // Ghana formats:
          // 9 digits  → e.g. 244123456   (after stripping leading 0)
          // 10 digits → e.g. 0244123456  (local format)
          // 12 digits → e.g. 233244123456 (international without +)
          return /^(0\d{9}|\d{9}|233\d{9})$/.test(val);
        },
        { message: "Enter a valid Ghana phone number (e.g. 0244123456)" },
      ),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      // At least one uppercase, one lowercase, one digit
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),

    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  // Cross-field refinement: passwords must match.
  // .refine runs after all individual field checks pass.
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    // Attaching the error to confirmPassword means react-hook-form
    // shows it under that specific field, not the whole form.
    path: ["confirmPassword"],
  });

// TypeScript type inferred from the sign-up schema.
export type SignUpFormData = z.infer<typeof signUpSchema>;
