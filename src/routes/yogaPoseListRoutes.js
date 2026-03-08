import express from "express";
import * as yogaPoseListController from "../controllers/yogaPoseListController.js";

const router = express.Router();

/**
 * Yoga Pose List Routes
 * Legacy-compatible routes migrated from arvyax_back_end.
 * Mounted on /api so existing clients can continue using /api/yoga-pose-list.
 */

router.get("/yoga-pose-list", yogaPoseListController.getAllSections);
router.get(
  "/yoga-pose-list/:uniqueId",
  yogaPoseListController.getSectionByUniqueId,
);
router.post("/yoga-pose-list/section", yogaPoseListController.createSection);
router.post(
  "/yoga-pose-list/:sectionId/card-url",
  yogaPoseListController.addCardWithImageUrl,
);
router.put(
  "/yoga-pose-list/:sectionId/card-url/:cardId",
  yogaPoseListController.updateCardWithImageUrl,
);
router.delete(
  "/yoga-pose-list/:sectionId/card/:cardId",
  yogaPoseListController.deleteCard,
);
router.put("/yoga-pose-list/:uniqueId", yogaPoseListController.updateSection);
router.delete(
  "/yoga-pose-list/:uniqueId",
  yogaPoseListController.deleteSection,
);
router.post("/yoga-pose-list/reorder", yogaPoseListController.reorderSections);

export default router;
