import YogaPoseList from "../models/YogaPoseList.js";

/**
 * Yoga Pose List Controller
 * Legacy-compatible CRUD endpoints for /api/yoga-pose-list.
 * This collection remains separate from the newer YogaPractice model.
 */

export const getAllSections = async (req, res) => {
  try {
    const sections = await YogaPoseList.find().sort({ order: 1, createdAt: 1 });

    return res.json({
      success: true,
      data: sections,
      count: sections.length,
    });
  } catch (error) {
    console.error("Error fetching yoga pose list:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching yoga pose list",
      error: error.message,
    });
  }
};

export const getSectionByUniqueId = async (req, res) => {
  try {
    const section = await YogaPoseList.findOne({
      uniqueId: req.params.uniqueId,
    });

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    return res.json({
      success: true,
      data: section,
    });
  } catch (error) {
    console.error("Error fetching section:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching section",
      error: error.message,
    });
  }
};

export const createSection = async (req, res) => {
  try {
    const { section, uniqueId, order } = req.body;

    if (!section || !uniqueId) {
      return res.status(400).json({
        success: false,
        message: "Section name and uniqueId are required",
      });
    }

    const existingSection = await YogaPoseList.findOne({ uniqueId });
    if (existingSection) {
      return res.status(400).json({
        success: false,
        message: "Section with this uniqueId already exists",
      });
    }

    const newSection = new YogaPoseList({
      section,
      uniqueId,
      cards: [],
      order: order || 0,
    });

    await newSection.save();

    return res.status(201).json({
      success: true,
      message: "Section created successfully",
      data: newSection,
    });
  } catch (error) {
    console.error("Error creating section:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating section",
      error: error.message,
    });
  }
};

export const addCardWithImageUrl = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { title, repCount, id, uniqueId, cardId, imageUrl } = req.body;

    if (!title || !repCount || !id || !uniqueId || !cardId || !imageUrl) {
      return res.status(400).json({
        success: false,
        message: "All card fields including imageUrl are required",
      });
    }

    const section = await YogaPoseList.findOne({ uniqueId: sectionId });
    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    const cardExists = section.cards.some((card) => card.uniqueId === uniqueId);
    if (cardExists) {
      return res.status(400).json({
        success: false,
        message: "Card with this uniqueId already exists",
      });
    }

    const newCard = {
      title,
      repCount,
      imagePath: imageUrl,
      imageUrl,
      id,
      uniqueId,
      cardId,
      sectionId,
    };

    section.cards.push(newCard);
    await section.save();

    return res.status(201).json({
      success: true,
      message: "Card added successfully",
      data: newCard,
    });
  } catch (error) {
    console.error("Error adding card:", error);
    return res.status(500).json({
      success: false,
      message: "Error adding card",
      error: error.message,
    });
  }
};

export const updateCardWithImageUrl = async (req, res) => {
  try {
    const { sectionId, cardId } = req.params;
    const { title, repCount, id, uniqueId, imageUrl } = req.body;

    const section = await YogaPoseList.findOne({ uniqueId: sectionId });
    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    const cardIndex = section.cards.findIndex((card) => card.cardId === cardId);
    if (cardIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Card not found",
      });
    }

    if (
      uniqueId &&
      uniqueId !== section.cards[cardIndex].uniqueId &&
      section.cards.some((card) => card.uniqueId === uniqueId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Card with this uniqueId already exists",
      });
    }

    if (title) section.cards[cardIndex].title = title;
    if (repCount) section.cards[cardIndex].repCount = repCount;
    if (id) section.cards[cardIndex].id = id;
    if (uniqueId) section.cards[cardIndex].uniqueId = uniqueId;

    if (imageUrl) {
      section.cards[cardIndex].imagePath = imageUrl;
      section.cards[cardIndex].imageUrl = imageUrl;
    }

    await section.save();

    return res.json({
      success: true,
      message: "Card updated successfully",
      data: section.cards[cardIndex],
    });
  } catch (error) {
    console.error("Error updating card:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating card",
      error: error.message,
    });
  }
};

export const deleteCard = async (req, res) => {
  try {
    const { sectionId, cardId } = req.params;

    const section = await YogaPoseList.findOne({ uniqueId: sectionId });
    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    const cardIndex = section.cards.findIndex((card) => card.cardId === cardId);
    if (cardIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Card not found",
      });
    }

    section.cards.splice(cardIndex, 1);
    await section.save();

    return res.json({
      success: true,
      message: "Card deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting card:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting card",
      error: error.message,
    });
  }
};

export const updateSection = async (req, res) => {
  try {
    const { section, order } = req.body;

    const sectionDoc = await YogaPoseList.findOne({
      uniqueId: req.params.uniqueId,
    });
    if (!sectionDoc) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    if (section) sectionDoc.section = section;
    if (order !== undefined) sectionDoc.order = order;

    await sectionDoc.save();

    return res.json({
      success: true,
      message: "Section updated successfully",
      data: sectionDoc,
    });
  } catch (error) {
    console.error("Error updating section:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating section",
      error: error.message,
    });
  }
};

export const deleteSection = async (req, res) => {
  try {
    const section = await YogaPoseList.findOneAndDelete({
      uniqueId: req.params.uniqueId,
    });

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    return res.json({
      success: true,
      message: "Section deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting section:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting section",
      error: error.message,
    });
  }
};

export const reorderSections = async (req, res) => {
  try {
    const { sections } = req.body;

    if (!Array.isArray(sections)) {
      return res.status(400).json({
        success: false,
        message: "Sections array is required",
      });
    }

    await Promise.all(
      sections.map(({ uniqueId, order }) =>
        YogaPoseList.findOneAndUpdate({ uniqueId }, { order }, { new: true }),
      ),
    );

    return res.json({
      success: true,
      message: "Sections reordered successfully",
    });
  } catch (error) {
    console.error("Error reordering sections:", error);
    return res.status(500).json({
      success: false,
      message: "Error reordering sections",
      error: error.message,
    });
  }
};
