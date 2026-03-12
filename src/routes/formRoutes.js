import express from "express";

import { tryCatch, validateBody } from "../utils/http.js";
import { submitFormSchema } from "../validation/formSchemas.js";
import {
  getForms,
  getFormById,
  submitForm,
} from "../controllers/formController.js";

const router = express.Router();

/**
 * Dynamic Forms Routes
 *
 * Mounted under: /api
 */
router.get("/forms", tryCatch(getForms));
router.get("/form", tryCatch(getForms)); // Alias requested by client
router.get("/forms/:formId", tryCatch(getFormById));
router.post(
  "/forms/:formId/submit",
  validateBody(submitFormSchema),
  tryCatch(submitForm),
);

export default router;
