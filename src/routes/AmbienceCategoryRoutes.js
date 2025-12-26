import { Router } from "express";
import mongoose from "mongoose";
import AmbienceCategory from "../models/AmbienceCategory.js";
import RegisterUser from "../models/UserModel.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

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

/**
 * ============ USER THEME SELECTION ROUTES ============
 */

/**
 * POST /user/select-theme/:themeId
 * User selects an ambience theme
 * Only one theme can be selected at a time (replaces previous selection)
 * Params: themeId - Theme ID to select
 * Auth: Required (Bearer token)
 * Returns: {
 *   message: "Theme selected successfully",
 *   selectedTheme: { id, name, imageUrl, categoryId, categoryName },
 *   user: { userId, email, selectedTheme }
 * }
 */
router.post("/user/select-theme/:themeId", authMiddleware, async (req, res) => {
  try {
    const { themeId } = req.params;
    const userId = req.user.id;

    if (!themeId) {
      return res.status(400).json({ error: "themeId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(themeId)) {
      return res.status(400).json({ error: "Invalid themeId" });
    }

    // Verify theme exists and is active
    const theme = await AmbienceCategory.getThemeById(themeId);
    if (!theme) {
      return res.status(404).json({ error: "Theme not found or inactive" });
    }

    // Get the category to verify it's active
    const category = await AmbienceCategory.findOne({
      "themes._id": themeId,
    });

    if (!category || category.isActive === false) {
      return res
        .status(404)
        .json({ error: "Theme's category not found or inactive" });
    }

    // Update user's ambience selection (only one allowed)
    const user = await RegisterUser.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Replace previous selection with new one
    user.preferences.ambienceSelections = [
      {
        categoryId: category._id,
        themeId: new mongoose.Types.ObjectId(themeId),
      },
    ];
    user.preferences.lastUpdated = new Date();

    await user.save();

    return res.json({
      message: "Theme selected successfully",
      selectedTheme: theme,
      user: {
        userId: user._id,
        email: user.email,
        selectedTheme: {
          themeId: theme.id,
          themeName: theme.name,
          themeImageUrl: theme.imageUrl,
          categoryId: theme.categoryId,
          categoryName: theme.categoryName,
        },
      },
    });
  } catch (err) {
    console.error("SELECT THEME ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /user/selected-theme
 * Get the user's currently selected theme
 * Auth: Required (Bearer token)
 * Returns: {
 *   selectedTheme: { id, name, imageUrl, categoryId, categoryName } | null,
 *   message: "No theme selected" (if none)
 * }
 */
router.get("/user/selected-theme", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await RegisterUser.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get user's selected theme
    const ambienceSelection = user.preferences.ambienceSelections?.[0];

    if (!ambienceSelection || !ambienceSelection.themeId) {
      return res.json({
        selectedTheme: null,
        message: "No theme selected",
      });
    }

    const theme = await AmbienceCategory.getThemeById(
      ambienceSelection.themeId
    );

    if (!theme) {
      // Theme was deleted or deactivated, clear the selection
      user.preferences.ambienceSelections = [];
      user.preferences.lastUpdated = new Date();
      await user.save();

      return res.json({
        selectedTheme: null,
        message: "Previously selected theme no longer available",
      });
    }

    return res.json({
      selectedTheme: theme,
    });
  } catch (err) {
    console.error("GET SELECTED THEME ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * DELETE /user/selected-theme
 * Deselect/remove the user's current theme selection
 * Auth: Required (Bearer token)
 * Returns: { message: "Theme deselected successfully" }
 */
router.delete("/user/selected-theme", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await RegisterUser.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.preferences.ambienceSelections = [];
    user.preferences.lastUpdated = new Date();
    await user.save();

    return res.json({
      message: "Theme deselected successfully",
    });
  } catch (err) {
    console.error("DESELECT THEME ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
