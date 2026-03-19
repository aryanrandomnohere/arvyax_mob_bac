import express from "express";

import { authMiddleware } from "../middleware/authMiddleware.js";
import { tryCatch, validateBody } from "../utils/http.js";
import { submitFormSchema } from "../validation/formSchemas.js";
import {
  getForms,
  getPendingForms,
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
router.get("/forms/pending", authMiddleware, tryCatch(getPendingForms));
router.get("/forms/:formId", tryCatch(getFormById));
router.post(
  "/forms/:formId/submit",
  authMiddleware,
  validateBody(submitFormSchema),
  tryCatch(submitForm),
);

export default router;
