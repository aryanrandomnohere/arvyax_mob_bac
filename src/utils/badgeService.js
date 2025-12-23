import RegisterUser from "../models/UserModel.js";
import Badge from "../models/Badge.js";
import UserActivityDay from "../models/UserActivityDay.js";

function utcDateKey(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Calculate the current streak for a user
 */
async function calculateCurrentStreak(userId) {
  const today = new Date();
  const todayUtcMidnight = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
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
 * Check and assign badges to a user based on their current streak
 * Returns array of newly earned badges
 */
export async function checkAndAssignBadges(userId) {
  try {
    const user = await RegisterUser.findById(userId).select("badges");
    if (!user) return [];

    // Get current streak
    const currentStreak = await calculateCurrentStreak(userId);

    // Get all streak badges ordered by milestone
    const allBadges = await Badge.find({
      milestoneDays: { $exists: true, $ne: null },
    })
      .sort({ milestoneDays: 1 })
      .lean();

    if (!allBadges.length) return [];

    // Get user's current badge IDs to prevent duplicate assignments
    const userBadgeIds = new Set(user.badges.map((id) => id.toString()));

    // Find badges user should have based on streak
    // ONLY add badges the user doesn't already have
    const earnedBadges = [];
    for (const badge of allBadges) {
      // Check: user qualifies for badge AND user doesn't already have it
      if (
        currentStreak >= badge.milestoneDays &&
        !userBadgeIds.has(badge._id.toString())
      ) {
        earnedBadges.push(badge);
        userBadgeIds.add(badge._id.toString());
      }
    }

    // Assign newly earned badges to user (skips if earnedBadges is empty)
    if (earnedBadges.length > 0) {
      user.badges.push(...earnedBadges.map((b) => b._id));
      await user.save();
    }

    return earnedBadges;
  } catch (error) {
    console.error("Error in checkAndAssignBadges:", error);
    return [];
  }
}

/**
 * Format badge for API response
 */
export function formatBadge(badge) {
  return {
    id: String(badge._id),
    name: badge.name,
    imageUrl: badge.imageUrl,
    description: badge.description,
    criteria: badge.criteria || "",
    level: badge.level || 1,
    milestoneDays: badge.milestoneDays || null,
  };
}
