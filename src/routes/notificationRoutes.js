import express from "express";

import { authMiddleware } from "../middleware/authMiddleware.js";
import { tryCatch, validateBody } from "../utils/http.js";
import {
  createNotificationSchema,
  updateNotificationSchema,
} from "../validation/notificationSchemas.js";
import {
  createNotification,
  getNotifications,
  getNotificationById,
  updateNotification,
  deleteNotification,
} from "../controllers/notificationController.js";

const router = express.Router();

/**
 * Notification Routes
 *
 * Mounted under: /api
 */
router.post(
  "/notifications",
  authMiddleware,
  validateBody(createNotificationSchema),
  tryCatch(createNotification),
);
router.get("/notifications", authMiddleware, tryCatch(getNotifications));
router.get(
  "/notifications/:notificationId",
  authMiddleware,
  tryCatch(getNotificationById),
);
router.patch(
  "/notifications/:notificationId",
  authMiddleware,
  validateBody(updateNotificationSchema),
  tryCatch(updateNotification),
);
router.delete(
  "/notifications/:notificationId",
  authMiddleware,
  tryCatch(deleteNotification),
);

export default router;
