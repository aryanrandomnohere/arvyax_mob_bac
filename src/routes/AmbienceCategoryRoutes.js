import { Router } from "express";
import mongoose from "mongoose";
import AmbienceCategory from "../models/AmbienceCategory.js";

const router = Router();

/**
 * GET /
 * Retrieve all active ambience categories
 * Returns: { categories: [] }
 */
router.get("/", async (req, res) => {
  try {
    const categories = await AmbienceCategory.getCategories();
    return res.json({ categories });
  } catch (err) {
    console.error("GET CATEGORIES ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /themes
 * Retrieve all active themes from all active categories
 * Flattens themes across categories into a single array
 * Returns: { themes: [{ id, name, imageUrl, categoryId, categoryName }] }
 */
router.get("/themes", async (req, res) => {
  try {
    const categories = await AmbienceCategory.find({ isActive: true });

    const themes = [];
    for (const category of categories) {
      for (const theme of category.themes ?? []) {
        if (theme.isActive === false) continue;
        themes.push({
          id: theme._id,
          name: theme.name,
          imageUrl: theme.imageUrl,
          categoryId: category._id,
          categoryName: category.name,
        });
      }
    }

    return res.json({ themes });
  } catch (err) {
    console.error("GET THEME IMAGES ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /themes/:themeId
 * Retrieve a specific theme by its ID
 * Validates themeId and checks if the theme and its parent category are active
 * Returns: { theme: { id, name, imageUrl, categoryId, categoryName } }
 */
router.get("/themes/:themeId", async (req, res) => {
  try {
    const { themeId } = req.params;

    if (!themeId) {
      return res.status(400).json({ error: "themeId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(themeId)) {
      return res.status(400).json({ error: "Invalid themeId" });
    }

    const category = await AmbienceCategory.findOne({
      "themes._id": themeId,
    });

    if (!category || category.isActive === false) {
      return res.status(404).json({ error: "Theme not found" });
    }

    const theme = category.themes.id(themeId);
    if (!theme || theme.isActive === false) {
      return res.status(404).json({ error: "Theme not found" });
    }

    return res.json({
      theme: {
        id: theme._id,
        name: theme.name,
        imageUrl: theme.imageUrl,
        categoryId: category._id,
        categoryName: category.name,
      },
    });
  } catch (err) {
    console.error("GET THEME IMAGE ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /:id
 * Retrieve a specific ambience category by its ID
 * Validates the category ID format and checks if it exists
 * Returns: { category: { id, name, description, themes, ... } }
 */
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
