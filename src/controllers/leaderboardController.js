import RegisterUser from "../models/UserModel.js";
import UserActivityDay from "../models/UserActivityDay.js";

function utcDateKey(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function computeCurrentStreakFromDaySet(daySet, todayUtcMidnight) {
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

function computeMaxStreakFromDaySet(daySet) {
  if (!daySet || daySet.size === 0) return 0;

  const sortedKeys = Array.from(daySet).sort();
  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sortedKeys.length; i++) {
    const prev = new Date(`${sortedKeys[i - 1]}T00:00:00Z`);
    const curr = new Date(`${sortedKeys[i]}T00:00:00Z`);
    const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      currentStreak += 1;
      if (currentStreak > maxStreak) maxStreak = currentStreak;
    } else {
      currentStreak = 1;
    }
  }

  return maxStreak;
}

/**
 * GET /api/leaderboard/streak
 * Returns a sorted leaderboard by max streak (desc).
 */
export const getStreakLeaderboard = async (req, res) => {
  const rawLimit = req.query?.limit;
  const parsedLimit = Number.parseInt(String(rawLimit ?? ""), 10);
  const limit = Number.isFinite(parsedLimit)
    ? Math.min(Math.max(parsedLimit, 1), 200)
    : 100;

  const users = await RegisterUser.find({})
    .select("username photoUrl preferences.nickname")
    .lean();

  const today = new Date();
  const todayUtcMidnight = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );

  const windowStart = new Date(todayUtcMidnight);
  windowStart.setUTCDate(windowStart.getUTCDate() - 399);

  const fromKey = utcDateKey(windowStart);
  const toKey = utcDateKey(todayUtcMidnight);

  const activity = await UserActivityDay.aggregate([
    { $match: { dateKey: { $gte: fromKey, $lte: toKey } } },
    { $group: { _id: "$user", days: { $addToSet: "$dateKey" } } },
  ]);

  const userIdToDaySet = new Map();
  for (const row of activity) {
    const id = String(row._id);
    const set = new Set(Array.isArray(row.days) ? row.days : []);
    userIdToDaySet.set(id, set);
  }

  const entries = users.map((u) => {
    const userId = String(u._id);
    const daySet = userIdToDaySet.get(userId) ?? new Set();
    const currentStreak = computeCurrentStreakFromDaySet(
      daySet,
      todayUtcMidnight,
    );
    const maxStreak = computeMaxStreakFromDaySet(daySet);

    return {
      userId,
      name: String(u.preferences?.nickname ?? u.username ?? ""),
      photoUrl: u.photoUrl ?? null,
      currentStreak,
      maxStreak,
      streak: maxStreak,
    };
  });

  const nonZeroEntries = entries.filter((entry) => entry.maxStreak > 0);

  nonZeroEntries.sort((a, b) => {
    if (b.maxStreak !== a.maxStreak) return b.maxStreak - a.maxStreak;
    return a.name.localeCompare(b.name);
  });

  const sliced = nonZeroEntries.slice(0, limit);

  const leaderboard = sliced.map((e, index) => ({
    rank: index + 1,
    ...e,
  }));

  return res.json({ leaderboard });
};
