import RegisterUser from "../models/UserModel.js";
import UserActivityDay from "../models/UserActivityDay.js";

function utcDateKey(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function computeStreakFromDaySet(daySet, todayUtcMidnight) {
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
 * GET /api/leaderboard/streak
 * Returns a sorted leaderboard by current streak (desc).
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
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
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
    const streak = computeStreakFromDaySet(daySet, todayUtcMidnight);

    return {
      userId,
      name: String(u.preferences?.nickname ?? u.username ?? ""),
      photoUrl: u.photoUrl ?? null,
      streak,
    };
  });

  entries.sort((a, b) => {
    if (b.streak !== a.streak) return b.streak - a.streak;
    return a.name.localeCompare(b.name);
  });

  const sliced = entries.slice(0, limit);

  const leaderboard = sliced.map((e, index) => ({
    rank: index + 1,
    ...e,
  }));

  return res.json({ leaderboard });
};
