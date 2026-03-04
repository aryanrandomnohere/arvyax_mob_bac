import Breathing from "../models/Breathing.js";

/**
 * Breathing Controller
 * Handles mindfulness breathing exercises
 * Used for guided breathing techniques like triangle, box, line breathing
 */

/**
 * Get all breathing exercises
 * Returns all breathing types with their video URLs
 */
export const getAllBreathing = async (req, res) => {
  try {
    const breathingExercises = await Breathing.find({ isActive: true }).sort({
      order: 1,
    });

    if (!breathingExercises || breathingExercises.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No breathing exercises found",
      });
    }

    return res.status(200).json({
      success: true,
      data: breathingExercises,
    });
  } catch (error) {
    console.error("Error fetching breathing exercises:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch breathing exercises",
    });
  }
};

/**
 * Get breathing exercise by type
 * Returns all videos for a specific breathing type
 * @param {string} type - breathing type initials (triangle, line, square, infinity, shuffle)
 */
export const getBreathingByType = async (req, res) => {
  try {
    const { type } = req.params;

    // Map abbreviated type to full breathing type name
    const typeMap = {
      triangle: "triangleBreathing",
      line: "lineBreathing",
      square: "squareBreathing",
      infinity: "infinityBreathing",
      shuffle: "shuffleBreathing",
    };

    const fullType = typeMap[type.toLowerCase()];

    if (!fullType) {
      return res.status(400).json({
        success: false,
        message: `Invalid breathing type. Allowed types: ${Object.keys(typeMap).join(", ")}`,
      });
    }

    const breathing = await Breathing.findOne({
      type: fullType,
      isActive: true,
    });

    if (!breathing) {
      return res.status(404).json({
        success: false,
        message: `Breathing exercise type '${type}' not found`,
      });
    }

    if (breathing.videos.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No videos available for ${type}`,
      });
    }

    return res.status(200).json({
      success: true,
      data: breathing,
    });
  } catch (error) {
    console.error("Error fetching breathing by type:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch breathing exercise",
    });
  }
};

/**
 * Get short breathing exercises (from Flutter config)
 * Returns: Array of short breathing exercise videos
 * Includes: Alternate Nostril, Breathe In Nature, Deep Chest Breathing
 */
export const getShortBreathingExercises = async (req, res) => {
  try {
    const shortExercises = await Breathing.find({
      duration: "short",
      isActive: true,
    }).sort({ order: 1 });

    if (!shortExercises || shortExercises.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No short breathing exercises found",
      });
    }

    return res.status(200).json({
      success: true,
      count: shortExercises.length,
      data: shortExercises,
    });
  } catch (error) {
    console.error("Error fetching short breathing exercises:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch short breathing exercises",
    });
  }
};

/**
 * Get long breathing exercises (from Flutter config)
 * Returns: Array of long breathing exercise videos
 * Includes: Morning Breath
 */
export const getLongBreathingExercises = async (req, res) => {
  try {
    const longExercises = await Breathing.find({
      duration: "long",
      isActive: true,
    }).sort({ order: 1 });

    if (!longExercises || longExercises.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No long breathing exercises found",
      });
    }

    return res.status(200).json({
      success: true,
      count: longExercises.length,
      data: longExercises,
    });
  } catch (error) {
    console.error("Error fetching long breathing exercises:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch long breathing exercises",
    });
  }
};
