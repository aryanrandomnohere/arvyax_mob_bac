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
  gender: z.enum(["male", "female", "other"]),
  dob: z.string().trim().min(1, "dob is required"),
});
