import { z } from "zod";

export const journalDateQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD")
    .optional(),
});

export const journalMonthQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Expected YYYY-MM")
    .optional(),
});

const dateKeySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD")
  .optional();

const statusSchema = z.enum(["pending", "completed", "skipped"]);

const taskItemSchema = z.object({
  task: z.string().trim().min(1, "task is required").max(500),
  status: statusSchema.optional().default("pending"),
});

// POST /api/journal/tasks/batch
export const upsertJournalTasksSchema = z.object({
  dateKey: dateKeySchema,
  tasks: z
    .array(taskItemSchema)
    .min(1, "Expected at least 1 task")
    .max(50, "Too many tasks in one request"),
});

// POST /api/journal/tasks
export const appendJournalTaskSchema = z.object({
  dateKey: dateKeySchema,
  task: z.string().trim().min(1, "task is required").max(500),
  status: statusSchema.optional().default("pending"),
});

// PATCH /api/journal/tasks/:taskId
export const updateJournalTaskStatusSchema = z.object({
  status: statusSchema,
});

// PUT /api/journal/questions
export const upsertJournalQuestionsSchema = z.object({
  dateKey: dateKeySchema,
  mistakes: z.string().trim().max(5000),
  whatDidYouLearn: z.string().trim().max(5000),
  anythingSpecialHappenedToday: z.object({
    aboutIt: z.string().trim().max(5000),
    photos: z.array(z.string().trim().min(1)).max(50).optional().default([]),
  }),
});
