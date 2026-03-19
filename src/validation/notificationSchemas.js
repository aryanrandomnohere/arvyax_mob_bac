import { z } from "zod";

const dateTimeSchema = z
  .string()
  .datetime({ offset: true, message: "time must be a valid ISO datetime" });

const prioritySchema = z
  .object({
    level: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).optional(),
    order: z.number().int().min(0).optional(),
  })
  .optional();

const scheduledSchema = z
  .object({
    type: z.enum(["one_time", "recurring"]).optional(),
    frequency: z.enum(["daily", "weekly", "monthly", "one_time"]).optional(),
    dayOfWeek: z
      .enum([
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ])
      .nullable()
      .optional(),
    dayOfMonth: z.number().int().min(1).max(31).nullable().optional(),
    timeOfDay: z
      .string()
      .regex(/^([01]\\d|2[0-3]):([0-5]\\d)$/, "timeOfDay must be HH:mm")
      .optional(),
    timezone: z.string().trim().min(1).optional(),
    startDate: z
      .string()
      .datetime({ offset: true, message: "startDate must be ISO datetime" })
      .nullable()
      .optional(),
    endDate: z
      .string()
      .datetime({ offset: true, message: "endDate must be ISO datetime" })
      .nullable()
      .optional(),
    isActive: z.boolean().optional(),
  })
  .optional();

export const createNotificationSchema = z.object({
  banner: z.string().trim().min(1, "banner is required"),
  title: z.string().trim().min(1, "title is required").max(200),
  message: z.string().trim().min(1, "message is required").max(3000),
  link: z.string().trim().optional().default(""),
  time: dateTimeSchema,
  priority: prioritySchema,
  scheduled: scheduledSchema,
});

export const updateNotificationSchema = z
  .object({
    banner: z.string().trim().min(1).optional(),
    title: z.string().trim().min(1).max(200).optional(),
    message: z.string().trim().min(1).max(3000).optional(),
    link: z.string().trim().optional(),
    time: dateTimeSchema.optional(),
    priority: prioritySchema,
    scheduled: scheduledSchema,
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });
