import { z } from "zod";

// Used for PUT /profile (edit onboarding/profile info)
export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1, "name is required").max(80).optional(),
    gender: z.enum(["male", "female", "other"]).optional(),
    // Accept a string since mobile clients commonly send ISO strings.
    dob: z.string().trim().min(1, "dob is required").optional(),
  })
  .refine((v) => v.name || v.gender || v.dob, {
    message: "At least one field is required",
  });
