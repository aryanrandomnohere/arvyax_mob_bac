import { z } from "zod";

export const startFeelingSchema = z.object({
  feeling: z.string().trim().min(1, "feeling is required"),
});

export const dayTimelineQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
});
