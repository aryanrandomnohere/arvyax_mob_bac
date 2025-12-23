const YogaPractice = require("../models/YogaPractice");
const cloudinary = require("cloudinary").v2;
const config = require("../config/constants");

/**
 * Yoga Practice Controller
 * Manages the practice library structure (sections/cards)
 * Used for browsing Asanas, Meditation poses, and practice cards
 */

// Cloudinary Configuration
cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
});

// Helper function to generate unique section ID
function generateSectionId(count) {
  return `S${count.toString().padStart(2, "0")}`;
}

// Helper function to generate unique card ID
function generateCardId(count) {
  return `C${count.toString().padStart(2, "0")}`;
}

// Helper function to generate audio ID
function generateAudioId(cardId, subId = null, audioIndex = 1) {
  if (subId) {
    return `${cardId}-${subId}-aud${audioIndex}`;
  }
  return `${cardId}-aud${audioIndex}`;
}

/**
 * Get all yoga practices
 * Returns the complete practice library structure
 */
exports.getAllYogaPractices = async (req, res) => {
  try {
    const practices = await YogaPractice.find().sort({ createdAt: -1 });
    console.log(`Retrieved ${practices.length} yoga practices from database`);

    // If no practices exist, create default structure
    if (practices.length === 0) {
      const defaultPractice = {
        practices: [
          { section: "Warm up", uniqueId: "S08", cards: [] },
          { section: "Pranayam", uniqueId: "S09", cards: [] },
          { section: "Asana", uniqueId: "S21", cards: [] },
          { section: "Meditation", uniqueId: "S54", cards: [] },
          { section: "Rituals", uniqueId: "S07", cards: [] },
        ],
        lastSectionCount: 5,
        lastCardCount: 0,
      };

      const newPractice = await YogaPractice.create(defaultPractice);
      return res.json(newPractice);
    }

    res.json(practices[0]);
  } catch (error) {
    console.error("Error fetching yoga practices:", error);
    res.status(500).json({
      error: "Failed to fetch yoga practices",
      details: error.message,
    });
  }
};

/**
 * Migrate audio IDs for existing practices
 * Adds audio IDs to cards that don't have them
 */
exports.migrateAudioIds = async (req, res) => {
  try {
    const practice = await YogaPractice.findOne().sort({ createdAt: -1 });

    if (!practice) {
      return res.status(404).json({ error: "Practice not found" });
    }

    let updatedCount = 0;

    practice.practices.forEach((section) => {
      section.cards.forEach((card) => {
        if (!card.audioId) {
          card.audioId = generateAudioId(card.uniqueId, null, 1);
          updatedCount++;
        }

        if (card.images && card.images.length > 0) {
          card.images.forEach((image, index) => {
            if (!image.audioId) {
              image.audioId = generateAudioId(
                card.uniqueId,
                image.subId,
                index + 1
              );
              updatedCount++;
            }
          });
        }
      });
    });

    await practice.save({ validateBeforeSave: false });

    console.log(`Audio IDs Migration Complete: Updated ${updatedCount} items`);

    res.json({
      success: true,
      message: `Migration complete. Updated ${updatedCount} items with audio IDs`,
      updatedCount,
    });
  } catch (error) {
    console.error("Error migrating audio IDs:", error);
    res.status(500).json({
      error: "Failed to migrate audio IDs",
      details: error.message,
    });
  }
};

/**
 * Upload practice image/card
 * Creates a new practice card with image, video, and audio URLs
 */
exports.uploadPracticeImage = async (req, res) => {
  try {
    const {
      title,
      repCount,
      section,
      url,
      cloudinaryId,
      id,
      videoUrl,
      exerciseTime,
      audioUrl,
    } = req.body;

    if (!title || !repCount || !section || !url || !cloudinaryId) {
      return res.status(400).json({
        error: "Missing required fields",
        details: "Title, repCount, section, URL, and cloudinaryId are required",
      });
    }

    let practice = await YogaPractice.findOne().sort({ createdAt: -1 });

    if (!practice) {
      practice = await YogaPractice.create({
        practices: [
          { section: "Warm up", uniqueId: "S08", cards: [] },
          { section: "Pranayam", uniqueId: "S09", cards: [] },
          { section: "Asana", uniqueId: "S21", cards: [] },
          { section: "Meditation", uniqueId: "S54", cards: [] },
          { section: "Rituals", uniqueId: "S07", cards: [] },
        ],
        lastSectionCount: 5,
        lastCardCount: 0,
      });
    }

    practice.lastCardCount += 1;
    const uniqueCardId = `C${practice.lastCardCount
      .toString()
      .padStart(2, "0")}`;
    const cardId = id || Date.now().toString();

    const sectionIndex = practice.practices.findIndex(
      (p) => p.section === section
    );

    if (sectionIndex === -1) {
      return res.status(400).json({
        error: "Section not found",
        details: `Section '${section}' does not exist`,
      });
    }

    practice.practices[sectionIndex].cards.push({
      title,
      repCount,
      imagePath: url,
      cloudinaryId,
      id: cardId,
      uniqueId: uniqueCardId,
      videoUrl: videoUrl || "",
      exerciseTime: exerciseTime || "",
      audioUrl: audioUrl || "",
      audioId: generateAudioId(uniqueCardId, null, 1),
    });

    await practice.save();

    console.log("=== Practice Image Successfully Stored ===");
    console.log(
      "Title:",
      title,
      "Section:",
      section,
      "Unique Card ID:",
      uniqueCardId
    );

    res.status(201).json({
      success: true,
      practice,
    });
  } catch (error) {
    console.error("Error uploading practice image:", error);
    res.status(500).json({
      error: "Failed to upload practice image",
      details: error.message,
    });
  }
};

/**
 * Add new section
 * Creates a new practice section (e.g., new category)
 */
exports.addSection = async (req, res) => {
  try {
    const { sectionName } = req.body;

    if (!sectionName) {
      return res.status(400).json({ error: "Section name is required" });
    }

    const practice = await YogaPractice.findOne().sort({ createdAt: -1 });

    if (!practice) {
      return res.status(404).json({ error: "Practice not found" });
    }

    const sectionExists = practice.practices.some(
      (p) => p.section === sectionName
    );
    if (sectionExists) {
      return res
        .status(400)
        .json({ error: "Section with this name already exists" });
    }

    practice.lastSectionCount += 1;
    const uniqueSectionId = generateSectionId(practice.lastSectionCount);

    practice.practices.push({
      section: sectionName,
      uniqueId: uniqueSectionId,
      cards: [],
    });

    await practice.save();

    console.log("=== New Section Added ===");
    console.log(
      "Section Name:",
      sectionName,
      "Unique Section ID:",
      uniqueSectionId
    );

    res.status(201).json({
      success: true,
      practice,
    });
  } catch (error) {
    console.error("Error adding section:", error);
    res.status(500).json({
      error: "Failed to add section",
      details: error.message,
    });
  }
};

/**
 * Delete practice card/image
 * Removes card from section and deletes from Cloudinary
 */
exports.deletePracticeImage = async (req, res) => {
  try {
    const { sectionName, cardId } = req.params;
    const practice = await YogaPractice.findOne().sort({ createdAt: -1 });

    if (!practice) {
      return res.status(404).json({ error: "Practice not found" });
    }

    const sectionIndex = practice.practices.findIndex(
      (p) => p.section === sectionName
    );

    if (sectionIndex === -1) {
      return res
        .status(404)
        .json({ error: `Section '${sectionName}' not found` });
    }

    const cardIndex = practice.practices[sectionIndex].cards.findIndex(
      (card) => card.id === cardId
    );

    if (cardIndex === -1) {
      return res.status(404).json({ error: "Card not found in the section" });
    }

    const card = practice.practices[sectionIndex].cards[cardIndex];

    console.log("=== Starting Practice Image Deletion ===");
    console.log("Card ID:", cardId, "Section:", sectionName);

    // Remove from database first
    practice.practices[sectionIndex].cards.splice(cardIndex, 1);
    await practice.save();
    console.log("Image removed from database successfully");

    // Send response immediately
    res.json({
      success: true,
      message: "Practice image deleted successfully",
    });

    // Handle Cloudinary deletion asynchronously
    handleCloudinaryDeletion(card).catch((error) => {
      console.error("Cloudinary deletion error:", error);
    });
  } catch (error) {
    console.error("Error deleting practice image:", error);
    res.status(500).json({
      error: "Failed to delete practice image",
      details: error.message,
    });
  }
};

/**
 * Update card details
 * Updates title, rep count, URLs, etc.
 */
exports.updateCard = async (req, res) => {
  try {
    const { sectionName, cardId } = req.params;
    const { title, repCount, videoUrl, exerciseTime, audioUrl } = req.body;

    if (!title || !repCount) {
      return res.status(400).json({
        error: "Missing required fields",
        details: "Title and repCount are required",
      });
    }

    const practice = await YogaPractice.findOne().sort({ createdAt: -1 });

    if (!practice) {
      return res.status(404).json({ error: "Practice not found" });
    }

    const sectionIndex = practice.practices.findIndex(
      (p) => p.section === sectionName
    );

    if (sectionIndex === -1) {
      return res
        .status(404)
        .json({ error: `Section '${sectionName}' not found` });
    }

    const cardIndex = practice.practices[sectionIndex].cards.findIndex(
      (card) => card.id === cardId
    );

    if (cardIndex === -1) {
      return res.status(404).json({ error: "Card not found in the section" });
    }

    practice.practices[sectionIndex].cards[cardIndex].title = title;
    practice.practices[sectionIndex].cards[cardIndex].repCount = repCount;
    practice.practices[sectionIndex].cards[cardIndex].videoUrl = videoUrl || "";
    practice.practices[sectionIndex].cards[cardIndex].exerciseTime =
      exerciseTime || "";
    practice.practices[sectionIndex].cards[cardIndex].audioUrl = audioUrl || "";

    await practice.save();

    console.log("=== Card Updated ===");
    console.log("Card ID:", cardId, "Section:", sectionName);

    res.json({
      success: true,
      practice,
      message: "Card updated successfully",
    });
  } catch (error) {
    console.error("Error updating card:", error);
    res.status(500).json({
      error: "Failed to update card",
      details: error.message,
    });
  }
};

/**
 * Delete section
 * Removes entire section with all cards
 */
exports.deleteSection = async (req, res) => {
  try {
    const { sectionName } = req.params;
    const practice = await YogaPractice.findOne().sort({ createdAt: -1 });

    if (!practice) {
      return res.status(404).json({ error: "Practice not found" });
    }

    const sectionIndex = practice.practices.findIndex(
      (p) => p.section === sectionName
    );

    if (sectionIndex === -1) {
      return res
        .status(404)
        .json({ error: `Section '${sectionName}' not found` });
    }

    console.log("=== Deleting Section ===");
    console.log("Section Name:", sectionName);

    // Delete all images from Cloudinary
    const deletionResults = [];
    for (const card of practice.practices[sectionIndex].cards) {
      try {
        const result = await cloudinary.uploader.destroy(card.cloudinaryId);
        deletionResults.push({ id: card.cloudinaryId, result });
      } catch (cloudinaryError) {
        console.error(
          `Failed to delete image ${card.cloudinaryId}:`,
          cloudinaryError
        );
        deletionResults.push({
          id: card.cloudinaryId,
          error: cloudinaryError.message,
        });
      }
    }

    // Remove section
    practice.practices.splice(sectionIndex, 1);
    await practice.save();

    res.json({
      success: true,
      message: "Section deleted successfully",
      cloudinaryResults: deletionResults,
    });
  } catch (error) {
    console.error("Error deleting section:", error);
    res.status(500).json({
      error: "Failed to delete section",
      details: error.message,
    });
  }
};

/**
 * Upload additional image to existing card
 * Adds sub-images (A, B, C, etc.) to a card
 */
exports.uploadCardImage = async (req, res) => {
  try {
    const { sectionName, cardId } = req.params;
    const { url, cloudinaryId, audioUrl } = req.body;

    if (!url || !cloudinaryId) {
      return res.status(400).json({
        error: "Missing required fields",
        details: "URL and cloudinaryId are required",
      });
    }

    let practice = await YogaPractice.findOne().sort({ createdAt: -1 });

    if (!practice) {
      return res.status(404).json({ error: "Practice not found" });
    }

    const sectionIndex = practice.practices.findIndex(
      (p) => p.section === sectionName
    );

    if (sectionIndex === -1) {
      return res.status(400).json({
        error: "Section not found",
        details: `Section '${sectionName}' does not exist`,
      });
    }

    const cardIndex = practice.practices[sectionIndex].cards.findIndex(
      (card) => card.id === cardId
    );

    if (cardIndex === -1) {
      return res.status(400).json({
        error: "Card not found",
        details: `Card '${cardId}' does not exist in section '${sectionName}'`,
      });
    }

    const card = practice.practices[sectionIndex].cards[cardIndex];

    if (!card.images) {
      card.images = [];
      card.images.push({
        imagePath: card.imagePath,
        cloudinaryId: card.cloudinaryId,
        subId: "A",
        uniqueSubId: `${card.uniqueId}-A`,
        audioUrl: card.audioUrl || "",
        audioId: generateAudioId(card.uniqueId, "A", 1),
      });
    }

    const nextSubId = String.fromCharCode(65 + card.images.length);
    const uniqueSubId = `${card.uniqueId}-${nextSubId}`;

    card.images.push({
      imagePath: url,
      cloudinaryId: cloudinaryId,
      subId: nextSubId,
      uniqueSubId: uniqueSubId,
      audioUrl: audioUrl || "",
      audioId: generateAudioId(
        card.uniqueId,
        nextSubId,
        card.images.length + 1
      ),
    });

    await practice.save();

    console.log("=== Additional Image Added to Card ===");
    console.log("Card ID:", cardId, "New Sub ID:", nextSubId);

    res.status(201).json({
      success: true,
      practice,
      newSubId: uniqueSubId,
    });
  } catch (error) {
    console.error("Error uploading card image:", error);
    res.status(500).json({
      error: "Failed to upload card image",
      details: error.message,
    });
  }
};

/**
 * Delete specific sub-image from card
 * Removes one of multiple images in a card
 */
exports.deleteCardImage = async (req, res) => {
  try {
    const { sectionName, cardId, subId } = req.params;
    const practice = await YogaPractice.findOne().sort({ createdAt: -1 });

    if (!practice) {
      return res.status(404).json({ error: "Practice not found" });
    }

    const sectionIndex = practice.practices.findIndex(
      (p) => p.section === sectionName
    );
    if (sectionIndex === -1) {
      return res
        .status(404)
        .json({ error: `Section '${sectionName}' not found` });
    }

    const cardIndex = practice.practices[sectionIndex].cards.findIndex(
      (card) => card.id === cardId
    );
    if (cardIndex === -1) {
      return res.status(404).json({ error: "Card not found in the section" });
    }

    const card = practice.practices[sectionIndex].cards[cardIndex];

    if (!card.images || card.images.length === 0) {
      return res.status(400).json({ error: "No images found in this card" });
    }

    const imageIndex = card.images.findIndex((img) => img.subId === subId);
    if (imageIndex === -1) {
      return res.status(404).json({ error: "Image not found in the card" });
    }

    const imageToDelete = card.images[imageIndex];

    console.log("=== Starting Card Image Deletion ===");
    console.log("Card ID:", cardId, "Sub ID:", subId);

    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(imageToDelete.cloudinaryId);
      console.log("Image successfully deleted from Cloudinary");
    } catch (cloudinaryError) {
      console.error("Cloudinary deletion failed:", cloudinaryError);
    }

    // Remove the image
    card.images.splice(imageIndex, 1);

    // If last image, remove card
    if (card.images.length === 0) {
      practice.practices[sectionIndex].cards.splice(cardIndex, 1);
      console.log("Card removed as it had no more images");
    } else {
      card.imagePath = card.images[0].imagePath;
      card.cloudinaryId = card.images[0].cloudinaryId;
    }

    await practice.save();

    res.json({
      success: true,
      message: "Card image deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting card image:", error);
    res.status(500).json({
      error: "Failed to delete card image",
      details: error.message,
    });
  }
};

/**
 * Update specific sub-image in card
 * Edits individual images within a card
 */
exports.updateCardImage = async (req, res) => {
  try {
    const { sectionName, cardId, subId } = req.params;
    const { url, cloudinaryId, audioUrl } = req.body;

    if (!url || !cloudinaryId) {
      return res.status(400).json({
        error: "Missing required fields",
        details: "URL and cloudinaryId are required",
      });
    }

    const practice = await YogaPractice.findOne().sort({ createdAt: -1 });

    if (!practice) {
      return res.status(404).json({ error: "Practice not found" });
    }

    const sectionIndex = practice.practices.findIndex(
      (p) => p.section === sectionName
    );
    if (sectionIndex === -1) {
      return res
        .status(404)
        .json({ error: `Section '${sectionName}' not found` });
    }

    const cardIndex = practice.practices[sectionIndex].cards.findIndex(
      (card) => card.id === cardId
    );
    if (cardIndex === -1) {
      return res.status(404).json({ error: "Card not found in the section" });
    }

    const card = practice.practices[sectionIndex].cards[cardIndex];

    if (!card.images || card.images.length === 0) {
      return res.status(400).json({ error: "No images found in this card" });
    }

    const imageIndex = card.images.findIndex((img) => img.subId === subId);
    if (imageIndex === -1) {
      return res.status(404).json({ error: "Image not found in the card" });
    }

    // Delete old image from Cloudinary
    try {
      await cloudinary.uploader.destroy(card.images[imageIndex].cloudinaryId);
    } catch (cloudinaryError) {
      console.error(
        "Failed to delete old image from Cloudinary:",
        cloudinaryError
      );
    }

    card.images[imageIndex].imagePath = url;
    card.images[imageIndex].cloudinaryId = cloudinaryId;
    card.images[imageIndex].audioUrl = audioUrl || "";

    if (imageIndex === 0) {
      card.imagePath = url;
      card.cloudinaryId = cloudinaryId;
      card.audioUrl = audioUrl || "";
    }

    await practice.save();

    console.log("=== Card Image Updated ===");
    console.log("Card ID:", cardId, "Sub ID:", subId);

    res.json({
      success: true,
      practice,
      message: "Card image updated successfully",
    });
  } catch (error) {
    console.error("Error updating card image:", error);
    res.status(500).json({
      error: "Failed to update card image",
      details: error.message,
    });
  }
};

// Helper function for async Cloudinary deletion
async function handleCloudinaryDeletion(card, retryCount = 0) {
  const maxRetries = 3;
  const retryDelay = 2000;

  try {
    console.log(`Attempting Cloudinary deletion (attempt ${retryCount + 1})`);

    const deletePromise = cloudinary.uploader.destroy(card.cloudinaryId);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Cloudinary deletion timeout")), 10000)
    );

    const result = await Promise.race([deletePromise, timeoutPromise]);

    if (result.result === "ok") {
      console.log("✅ Image successfully deleted from Cloudinary");
    } else if (result.result === "not found") {
      console.log("ℹ️ Image was already deleted from Cloudinary");
    } else if (retryCount < maxRetries) {
      setTimeout(
        () => handleCloudinaryDeletion(card, retryCount + 1),
        retryDelay
      );
    }
  } catch (error) {
    console.error(
      `❌ Cloudinary deletion failed (attempt ${retryCount + 1}):`,
      error.message
    );
    if (retryCount < maxRetries) {
      setTimeout(
        () => handleCloudinaryDeletion(card, retryCount + 1),
        retryDelay
      );
    }
  }
}

module.exports = exports;
