import { Router } from "express";
import type { Request, Response } from "express";
import mongoose from "mongoose";
import AmbienceCategory from "../models/AmbienceCategory.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

// -------------------------------------
//     GET ALL CATEGORIES (ACTIVE)
// -------------------------------------
router.get("/", async (req: Request, res: Response) => {
  try {
    const categories = await AmbienceCategory.getCategories();
    return res.json({ categories });
  } catch (err) {
    console.error("GET CATEGORIES ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// -------------------------------------
//        GET SINGLE CATEGORY
// -------------------------------------
router.get("/:id", async (req: Request, res: Response) => {
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

// // -------------------------------------
// //          CREATE CATEGORY
// // -------------------------------------
// router.post("/", authMiddleware, async (req: Request, res: Response) => {
//   try {
//     const { name, description, images, isActive, order } = req.body;

//     if (!name || !description) {
//       return res
//         .status(400)
//         .json({ error: "Name and description are required" });
//     }

//     const category = new AmbienceCategory({
//       name,
//       description,
//       images: Array.isArray(images) ? images : undefined,
//       isActive: typeof isActive === "boolean" ? isActive : undefined,
//       order: typeof order === "number" ? order : undefined,
//     });

//     await category.save();
//     return res.status(201).json({ message: "Category created", category });
//   } catch (err: any) {
//     // Duplicate key for unique name
//     if (err?.code === 11000) {
//       return res.status(400).json({ error: "Category already exists" });
//     }

//     console.error("CREATE CATEGORY ERROR:", err);
//     return res.status(500).json({ error: "Server error" });
//   }
// });

export default router;
