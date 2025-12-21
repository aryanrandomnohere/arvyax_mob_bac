import FeelingLog from "../models/FeelingLog.js";
import UserActivityDay from "../models/UserActivityDay.js";

function parseOptionalDate(value) {
  if (!value) return undefined;
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return undefined;
  return d;
}

function utcDateKey(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const startFeeling = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { feeling } = req.body;
    if (!feeling || typeof feeling !== "string") {
      return res.status(400).json({ error: "Feeling is required" });
    }

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

export const endFeeling = async (req, res) => {
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

export const getCurrentFeeling = async (req, res) => {
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

export const getFeelingLogs = async (req, res) => {
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

export const getTodayFeelingLogs = async (req, res) => {
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

export const getDayFeelingTimeline = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const query = req.validatedQuery ?? req.query;
    const date = String(query?.date || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        error: "Invalid date. Expected YYYY-MM-DD",
      });
    }

    const logs = await FeelingLog.find({ user: userId, dateKey: date }).sort({
      startedAt: 1,
    });

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

export const getFeelingStreak = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

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

function parseMonth(value) {
  if (!value) return null;
  const s = String(value);
  const match = /^([0-9]{4})-([0-9]{2})$/.exec(s);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null;
  if (month < 1 || month > 12) return null;
  return { year, month };
}

export const getActiveDaysCalendar = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const query = req.validatedQuery ?? req.query;
    const parsed = parseMonth(query?.month);
    const now = new Date();
    const year = parsed?.year ?? now.getUTCFullYear();
    const month = parsed?.month ?? now.getUTCMonth() + 1;

    const from = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const to = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const fromKey = utcDateKey(from);
    const toKey = utcDateKey(to);

    const activeDateKeys = (
      await UserActivityDay.distinct("dateKey", {
        user: userId,
        dateKey: { $gte: fromKey, $lte: toKey },
      })
    ).sort();

    const activeDaysOfMonth = activeDateKeys
      .map((k) => Number(String(k).split("-")[2]))
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
