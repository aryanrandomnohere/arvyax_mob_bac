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

export const socialLoginSchema = z.object({
  provider: z.enum(["google", "apple", "facebook", "github"]),
  // For google/apple pass idToken; for facebook/github pass accessToken
  idToken: z.string().trim().optional(),
  accessToken: z.string().trim().optional(),
  // Fallback fields from client if the provider doesn't return email/name
  email: z.string().trim().email("invalid email").optional(),
  name: z.string().trim().optional(),
  photoUrl: z.string().trim().optional(),
});
