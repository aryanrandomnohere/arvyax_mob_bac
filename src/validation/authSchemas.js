import { z } from "zod";

export const registerSchema = z.object({
  username: z.string().trim().min(1, "username is required"),
  email: z.string().trim().email("invalid email"),
});

export const verifyOtpSchema = z.object({
  email: z.string().trim().email("invalid email"),
  otp: z.string().trim().min(1, "otp is required"),
});

export const loginSchema = z.object({
  email: z.string().trim().email("invalid email"),
});

export const onboardingSchema = z.object({
  name: z.string().trim().min(1, "name is required").max(80),
  gender: z.enum(["male", "female", "other"]),
  dob: z.string().trim().min(1, "dob is required"),
});

export const setAmbienceSelectionSchema = z.object({
  categoryId: z.string().trim().min(1, "categoryId is required"),
  themeId: z.string().trim().min(1, "themeId is required"),
});

export const socialLoginSchema = z
  .object({
    provider: z.enum(["google", "apple"]),
    // For apple: pass idToken
    // For google: prefer idToken, but accessToken is also supported as fallback
    idToken: z.preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
      z.string().trim().optional()
    ),
    accessToken: z.preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
      z.string().trim().optional()
    ),
    // Fallback fields from client if the provider doesn't return email/name
    email: z.string().trim().email("invalid email").optional(),
    name: z.string().trim().optional(),
    photoUrl: z.string().trim().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.provider === "apple") {
      if (!val.idToken) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["idToken"],
          message: "idToken is required for apple",
        });
      }
    }
    if (val.provider === "google") {
      if (!val.idToken && !val.accessToken) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["idToken"],
          message: "Provide google idToken or accessToken",
        });
      }
    }
  });
