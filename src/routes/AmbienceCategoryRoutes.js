import { Router } from "express";
import mongoose from "mongoose";
import AmbienceCategory from "../models/AmbienceCategory.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const categories = await AmbienceCategory.getCategories();
    return res.json({ categories });
  } catch (err) {
    console.error("GET CATEGORIES ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({ error: "Category id is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid category id" });
    }

    const category = await AmbienceCategory.getCategoryById(id);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    return res.json({ category });
  } catch (err) {
    console.error("GET CATEGORY ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
