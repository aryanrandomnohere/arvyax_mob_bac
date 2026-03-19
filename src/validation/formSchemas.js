import { z } from "zod";

export const submitFormSchema = z.object({
  metadata: z.record(z.any()),
  formName: z.string().trim().min(1, "formName is required"),
});
