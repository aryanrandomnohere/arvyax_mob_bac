import type { Request, Response } from "express";
import FeelingLog from "../models/FeelingLog.js";
import UserActivityDay from "../models/UserActivityDay.js";

function parseOptionalDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return undefined;
  return d;
}

function utcDateKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const startFeeling = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { feeling } = req.body;
    if (!feeling || typeof feeling !== "string") {
      return res.status(400).json({ error: "Feeling is required" });
    }

    // Close any existing open feeling
    const open = await FeelingLog.getCurrentOpenLog(userId);
    if (open) {
      open.endedAt = new Date();
      await open.save();
    }

    const startedAt = new Date();
    const log = new FeelingLog({
      user: userId,
      feeling: feeling.trim(),
      startedAt,
      endedAt: null,
      dateKey: utcDateKey(startedAt),
    });

    await log.save();

    return res.status(201).json({ message: "Feeling started", log });
  } catch (err) {
    console.error("START FEELING ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const endFeeling = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const open = await FeelingLog.getCurrentOpenLog(userId);
    if (!open) {
      return res.status(400).json({ error: "No active feeling session" });
    }

    open.endedAt = new Date();
    await open.save();

    return res.json({ message: "Feeling ended", log: open });
  } catch (err) {
    console.error("END FEELING ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const getCurrentFeeling = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const open = await FeelingLog.getCurrentOpenLog(userId);
    if (open) {
      return res.json({ current: open });
    }

    const last = await FeelingLog.findOne({ user: userId }).sort({
      startedAt: -1,
    });
    return res.json({ current: last || null });
  } catch (err) {
    console.error("GET CURRENT FEELING ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const getFeelingLogs = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const from = parseOptionalDate(req.query.from);
    const to = parseOptionalDate(req.query.to);

    const logs = await FeelingLog.getLogsForRange(userId, from, to);
    return res.json({ logs });
  } catch (err) {
    console.error("GET FEELING LOGS ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const getTodayFeelingLogs = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const todayKey = utcDateKey(new Date());
    const logs = await FeelingLog.find({
      user: userId,
      dateKey: todayKey,
    }).sort({
      startedAt: -1,
    });

    return res.json({ logs, dateKey: todayKey });
  } catch (err) {
    console.error("GET TODAY FEELING LOGS ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// Get a specific day's feeling timeline (UTC): ?date=YYYY-MM-DD
export const getDayFeelingTimeline = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const date = String(req.query.date || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res
        .status(400)
        .json({ error: "Invalid date. Expected YYYY-MM-DD" });
    }

    const logs = await FeelingLog.find({ user: userId, dateKey: date }).sort({
      startedAt: 1,
    });

    // Shape it like segments for easy UI rendering.
    const segments = logs.map((l) => ({
      id: String(l._id),
      feeling: l.feeling,
      startedAt: l.startedAt,
      endedAt: l.endedAt ?? null,
    }));

    return res.json({ dateKey: date, segments, logs });
  } catch (err) {
    console.error("GET DAY FEELING TIMELINE ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const getFeelingStreak = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Activity streak = consecutive UTC days with at least one authenticated request/app-open ping.
    // Only fetch a bounded window for streak calculation.
    const today = new Date();
    const todayUtcMidnight = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
    );
    const windowStart = new Date(todayUtcMidnight);
    windowStart.setUTCDate(windowStart.getUTCDate() - 399);

    const fromKey = utcDateKey(windowStart);
    const toKey = utcDateKey(todayUtcMidnight);

    const days = (await UserActivityDay.distinct("dateKey", {
      user: userId,
      dateKey: { $gte: fromKey, $lte: toKey },
    })) as string[];

    if (!days.length) return res.json({ currentStreak: 0 });

    const daySet = new Set(days);
    let streak = 0;
    for (let i = 0; i < 400; i++) {
      const d = new Date(todayUtcMidnight);
      d.setUTCDate(d.getUTCDate() - i);
      const key = utcDateKey(d);
      if (!daySet.has(key)) break;
      streak++;
    }

    return res.json({ currentStreak: streak });
  } catch (err) {
    console.error("GET FEELING STREAK ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

function parseMonth(value: unknown): { year: number; month: number } | null {
  if (!value) return null;
  const s = String(value);
  // YYYY-MM
  const match = /^([0-9]{4})-([0-9]{2})$/.exec(s);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null;
  if (month < 1 || month > 12) return null;
  return { year, month };
}

function dateFromDateKey(dateKey: string): Date | null {
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(dateKey);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if ([year, month, day].some((n) => !Number.isFinite(n))) return null;
  return new Date(Date.UTC(year, month - 1, day));
}

function computeStreakStats(dateKeys: string[]): {
  bestStreak: number;
  currentStreak: number;
  firstAchievedAt: Record<number, string>; // milestoneDays -> dateKey (UTC)
} {
  const sorted = [...new Set(dateKeys)].sort();
  const todayKey = utcDateKey(new Date());
  const today = dateFromDateKey(todayKey)!;

  let bestStreak = 0;
  let currentStreak = 0;
  let run = 0;
  let prevDate: Date | null = null;
  const firstAchievedAt: Record<number, string> = {};
  const milestones = [5, 10, 30, 50, 100];

  for (const key of sorted) {
    const d = dateFromDateKey(key);
    if (!d) continue;

    if (!prevDate) {
      run = 1;
    } else {
      const diffDays = Math.round(
        (d.getTime() - prevDate.getTime()) / 86400000
      );
      run = diffDays === 1 ? run + 1 : 1;
    }

    for (const m of milestones) {
      if (run >= m && !firstAchievedAt[m]) firstAchievedAt[m] = key;
    }

    if (run > bestStreak) bestStreak = run;
    prevDate = d;
  }

  // current streak: consecutive days ending today
  const daySet = new Set(sorted);
  for (let i = 0; i < 400; i++) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const key = utcDateKey(d);
    if (!daySet.has(key)) break;
    currentStreak++;
  }

  return { bestStreak, currentStreak, firstAchievedAt };
}

// Calendar: which days user was active (has at least 1 log) for a month (UTC)
export const getActiveDaysCalendar = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const parsed = parseMonth(req.query.month);
    const now = new Date();
    const year = parsed?.year ?? now.getUTCFullYear();
    const month = parsed?.month ?? now.getUTCMonth() + 1; // 1-12

    const from = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const to = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const fromKey = utcDateKey(from);
    const toKey = utcDateKey(to);

    const activeDateKeys = (
      (await UserActivityDay.distinct("dateKey", {
        user: userId,
        dateKey: { $gte: fromKey, $lte: toKey },
      })) as string[]
    ).sort();
    const activeDaysOfMonth = activeDateKeys
      .map((k) => Number(k.split("-")[2]))
      .filter((d) => Number.isFinite(d));

    return res.json({
      month: `${String(year).padStart(4, "0")}-${String(month).padStart(
        2,
        "0"
      )}`,
      activeDateKeys,
      activeDaysOfMonth,
    });
  } catch (err) {
    console.error("GET ACTIVE DAYS CALENDAR ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// Badges: milestone unlocks based on best streak (plus current streak)
export const getStreakBadges = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Badges are based on activity streak (not feelings).
    const dateKeys = (await UserActivityDay.distinct("dateKey", {
      user: userId,
    })) as string[];
    const { bestStreak, currentStreak, firstAchievedAt } =
      computeStreakStats(dateKeys);

    const milestones = [5, 10, 30, 50, 100];
    const badges = milestones.map((days) => ({
      days,
      achieved: bestStreak >= days,
      achievedAt: firstAchievedAt[days] || null,
    }));

    return res.json({ currentStreak, bestStreak, badges });
  } catch (err) {
    console.error("GET STREAK BADGES ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
