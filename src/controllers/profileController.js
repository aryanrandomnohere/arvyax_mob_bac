import mongoose from "mongoose";
import RegisterUser from "../models/UserModel.js";
import AmbienceCategory from "../models/AmbienceCategory.js";
import FeelingLog from "../models/FeelingLog.js";
import UserActivityDay from "../models/UserActivityDay.js";
import Badge from "../models/Badge.js";

function utcDateKey(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function computeCurrentStreak(userId) {
  const today = new Date();
  const todayUtcMidnight = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );

  const windowStart = new Date(todayUtcMidnight);
  windowStart.setUTCDate(windowStart.getUTCDate() - 399);

  const fromKey = utcDateKey(windowStart);
  const toKey = utcDateKey(todayUtcMidnight);

  const days = await UserActivityDay.distinct("dateKey", {
    user: userId,
    dateKey: { $gte: fromKey, $lte: toKey },
  });

  if (!days.length) return 0;

  const daySet = new Set(days);
  let streak = 0;
  for (let i = 0; i < 400; i++) {
    const d = new Date(todayUtcMidnight);
    d.setUTCDate(d.getUTCDate() - i);
    const key = utcDateKey(d);
    if (!daySet.has(key)) break;
    streak++;
  }

  return streak;
}

/**
 * Build minimal profile payload for OTP verification (signup/login)
 * Returns only essential data: name, onboarding status, and current ambience
 */
export async function buildMinimalProfilePayload(userId) {
  const user = await RegisterUser.findById(userId).lean();
  if (!user) return null;

  // Fetch ambience selection data for wallpaper
  let currentAmbience = null;
  const ambienceSelection = user.preferences?.ambienceSelections?.[0];
  if (ambienceSelection?.categoryId) {
    const ambienceCategory = await AmbienceCategory.findById(
      ambienceSelection.categoryId,
    ).lean();

    if (ambienceCategory) {
      const selectedTheme = ambienceSelection.themeId
        ? ambienceCategory.themes?.find(
            (t) => String(t._id) === String(ambienceSelection.themeId),
          )
        : null;

      currentAmbience = {
        categoryId: String(ambienceCategory._id),
        categoryName: ambienceCategory.name,
        categoryDescription: ambienceCategory.description,
        categoryImage: ambienceCategory.images?.[0] ?? null,
        themeId: ambienceSelection.themeId
          ? String(ambienceSelection.themeId)
          : null,
        themeName: selectedTheme?.name ?? null,
        themeImage: selectedTheme?.imageUrl ?? null,
      };
    }
  }

  return {
    id: String(user._id),
    name: String(user.username ?? ""),
    nickname: String(user.preferences?.nickname ?? user.username ?? ""),
    email: user.email ?? null,
    onboardingCompleted: Boolean(user.onboardingCompleted),
    currentAmbience,
  };
}

export async function buildProfilePayload(userId) {
  const user = await RegisterUser.findById(userId)
    .populate("badges", "name imageUrl description criteria level")
    .lean();
  if (!user) return null;

  const activeStreakBadges = await Badge.find({
    isActive: true,
    milestoneDays: { $ne: null },
  })
    .sort({ order: 1, milestoneDays: 1, level: 1 })
    .lean();

  const earnedBadgeIdSet = new Set(
    (user.badges ?? []).map((badge) => String(badge?._id ?? badge)),
  );

  const currentLog = await FeelingLog.getCurrentOpenLog(userId);
  const currentStreak = await computeCurrentStreak(userId);

  // Fetch ambience selection data for wallpaper
  let currentAmbience = null;
  const ambienceSelection = user.preferences?.ambienceSelections?.[0];
  if (ambienceSelection?.categoryId) {
    const ambienceCategory = await AmbienceCategory.findById(
      ambienceSelection.categoryId,
    ).lean();

    if (ambienceCategory) {
      const selectedTheme = ambienceSelection.themeId
        ? ambienceCategory.themes?.find(
            (t) => String(t._id) === String(ambienceSelection.themeId),
          )
        : null;

      currentAmbience = {
        categoryId: String(ambienceCategory._id),
        categoryName: ambienceCategory.name,
        categoryDescription: ambienceCategory.description,
        categoryImage: ambienceCategory.images?.[0] ?? null,
        themeId: ambienceSelection.themeId
          ? String(ambienceSelection.themeId)
          : null,
        themeName: selectedTheme?.name ?? null,
        themeImage: selectedTheme?.imageUrl ?? null,
      };
    }
  }

  return {
    id: String(user._id),
    name: String(user.username ?? ""),
    nickname: String(user.preferences?.nickname ?? user.username ?? ""),
    email: user.email ?? null,
    phoneNumber: user.phoneNumber ?? null,
    photoUrl: user.photoUrl ?? null,
    onboardingCompleted: Boolean(user.onboardingCompleted),

    profileLastUpdatedAt:
      user.profileLastUpdatedAt ?? user.updatedAt ?? user.createdAt ?? null,
    journalLastUpdatedAt:
      user.journalLastUpdatedAt ?? user.updatedAt ?? user.createdAt ?? null,

    gender: user.preferences?.gender ?? "",
    dob: user.preferences?.dob ?? null,

    currentAmbience,

    badges: (user.badges ?? []).map((badge) => ({
      id: String(badge._id),
      name: badge.name,
      imageUrl: badge.imageUrl,
      description: badge.description,
      criteria: badge.criteria ?? "",
      level: badge.level ?? 1,
    })),

    // All streak badges (earned + not earned) for the streak goal UI.
    // Use `isEarned` (conventional boolean flag) instead of `earned`.
    streakBadges: (activeStreakBadges ?? []).map((badge) => ({
      id: String(badge._id),
      name: badge.name,
      imageUrl: badge.imageUrl,
      description: badge.description,
      criteria: badge.criteria ?? "",
      level: badge.level ?? 1,
      milestoneDays: badge.milestoneDays ?? null,
      order: badge.order ?? 0,
      isEarned: earnedBadgeIdSet.has(String(badge._id)),
    })),

    currentFeeling: currentLog
      ? {
          id: String(currentLog._id),
          feeling: currentLog.feeling,
          startedAt: currentLog.startedAt,
        }
      : null,

    currentStreak,
  };
}

/**
 * GET /api/auth/profile
 * Returns the current user's profile details used across the app (including onboarding screens).
 */
export const getMyProfile = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const payload = await buildProfilePayload(userId);
  if (!payload) return res.status(404).json({ error: "User not found" });

  return res.json({ profile: payload });
};

function parseDob(dob) {
  if (!dob) return null;
  const date = new Date(String(dob));
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

/**
 * PUT /api/auth/profile
 * Updates profile info (name / dob / gender). This is also the "edit onboarding info" route.
 */
export const updateMyProfile = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { name, gender, dob } = req.body;

  const user = await RegisterUser.findById(userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  if (typeof name === "string" && name.trim().length) {
    const trimmed = name.trim();
    user.username = trimmed;
    user.preferences.nickname = trimmed;
  }

  if (typeof gender === "string") {
    user.preferences.gender = gender;
  }

  if (typeof dob === "string") {
    const parsedDob = parseDob(dob);
    if (!parsedDob) {
      return res.status(400).json({ error: "Invalid dob" });
    }
    user.preferences.dob = parsedDob;
  }

  user.profileLastUpdatedAt = new Date();

  await user.save();

  const payload = await buildProfilePayload(userId);
  return res.json({ message: "Profile updated", profile: payload });
};

/**
 * GET /api/preferences/ambience
 * Returns the current user's saved ambience selections, hydrated with category/theme details.
 */
export const getAmbiencePreferences = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const user = await RegisterUser.findById(userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const selection = (user.preferences?.ambienceSelections ?? [])[0];
  if (!selection) {
    return res.json({ ambienceSelections: [] });
  }

  const category = await AmbienceCategory.findById(selection.categoryId);
  if (!category) {
    return res.json({ ambienceSelections: [] });
  }

  const theme = selection.themeId && category.themes?.id(selection.themeId);

  return res.json({
    ambienceSelections: [
      {
        categoryId: selection.categoryId,
        themeId: selection.themeId ?? null,
        theme: theme
          ? { id: theme._id, name: theme.name, imageUrl: theme.imageUrl }
          : null,
      },
    ],
  });
};

/**
 * PUT /api/auth/preferences/ambience
 * Upserts the single allowed ambience selection (one category/theme total).
 */
export const setAmbiencePreference = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { categoryId, themeId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    return res.status(400).json({ error: "Invalid categoryId" });
  }

  if (!mongoose.Types.ObjectId.isValid(themeId)) {
    return res.status(400).json({ error: "Invalid themeId" });
  }

  const category = await AmbienceCategory.findById(categoryId);
  if (!category) {
    return res.status(404).json({ error: "Category not found" });
  }

  const theme = category.themes?.id(themeId);
  if (!theme) {
    return res.status(404).json({ error: "Theme not found in category" });
  }

  if (theme.isActive === false) {
    return res.status(400).json({ error: "Theme is not active" });
  }

  const user = await RegisterUser.findById(userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  // Only one selection is allowed; overwrite any previous choice.
  user.preferences.ambienceSelections = [
    { categoryId: category._id, themeId: theme._id },
  ];
  user.markModified("preferences.ambienceSelections");
  await user.save();

  return res.json({
    message: "Ambience selection updated",
    selection: {
      categoryId: category._id,
      themeId: theme._id,
      theme: { id: theme._id, name: theme.name, imageUrl: theme.imageUrl },
    },
  });
};
