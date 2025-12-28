import mongoose from "mongoose";
import RegisterUser from "../models/UserModel.js";
import JournalTask from "../models/JournalTask.js";

function utcDateKey(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateKeyToUtcDate(dateKey) {
  const [y, m, d] = String(dateKey)
    .split("-")
    .map((v) => Number(v));
  const dt = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
  if (Number.isNaN(dt.getTime())) return null;
  // Validate round-trip (catches invalid 2025-02-30)
  if (utcDateKey(dt) !== dateKey) return null;
  return dt;
}

function diffDaysUtc(fromDateKey, toDateKey) {
  const from = dateKeyToUtcDate(fromDateKey);
  const to = dateKeyToUtcDate(toDateKey);
  if (!from || !to) return 0;
  const ms = to.getTime() - from.getTime();
  return Math.max(0, Math.floor(ms / 86400000));
}

async function touchJournalLastUpdatedAt(userId) {
  await RegisterUser.updateOne(
    { _id: userId },
    { $set: { journalLastUpdatedAt: new Date() } }
  );
}

/**
 * GET /api/journal?date=YYYY-MM-DD
 * Returns daily journal data for a date.
 *
 * Carry-forward rule:
 * - Any pending task with dueDateKey <= date is included.
 * - Completed tasks are included only if completedDateKey === date.
 */
export const getJournalForDate = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const todayKey = utcDateKey(new Date());
  const dateKey = String(
    req.validatedQuery?.date ?? req.query?.date ?? todayKey
  );

  if (!dateKeyToUtcDate(dateKey)) {
    return res.status(400).json({ error: "Invalid date" });
  }

  const tasks = await JournalTask.find({
    user: userId,
    $or: [
      { isCompleted: false, dueDateKey: { $lte: dateKey } },
      { isCompleted: true, completedDateKey: dateKey },
    ],
  })
    .sort({ isCompleted: 1, dueDateKey: 1, createdAt: 1 })
    .lean();

  const user = await RegisterUser.findById(userId)
    .select("journalLastUpdatedAt updatedAt createdAt")
    .lean();

  const mapped = (tasks ?? []).map((t) => {
    const completionKey = t.completedDateKey ?? null;
    const effectiveKey = completionKey ?? dateKey;
    const daysLate = diffDaysUtc(t.dueDateKey, effectiveKey);

    return {
      id: String(t._id),
      title: t.title,
      dueDateKey: t.dueDateKey,
      isCompleted: Boolean(t.isCompleted),
      completedAt: t.completedAt ?? null,
      completedDateKey: completionKey,
      daysLate,
      isLate: daysLate > 0,
    };
  });

  return res.json({
    journal: {
      dateKey,
      lastUpdatedAt:
        user?.journalLastUpdatedAt ??
        user?.updatedAt ??
        user?.createdAt ??
        null,
      tasks: mapped,
    },
  });
};

/**
 * POST /api/journal/tasks
 * Body: { title, dueDateKey? }
 */
export const createJournalTask = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { title, dueDateKey } = req.body;
  const key = dueDateKey ?? utcDateKey(new Date());

  if (!dateKeyToUtcDate(key)) {
    return res.status(400).json({ error: "Invalid dueDateKey" });
  }

  const task = await JournalTask.create({
    user: userId,
    title: String(title).trim(),
    dueDateKey: key,
  });

  await touchJournalLastUpdatedAt(userId);

  return res.status(201).json({
    task: {
      id: String(task._id),
      title: task.title,
      dueDateKey: task.dueDateKey,
      isCompleted: Boolean(task.isCompleted),
      completedAt: task.completedAt,
      completedDateKey: task.completedDateKey,
    },
  });
};

/**
 * PATCH /api/journal/tasks/:taskId
 * Body: { isCompleted }
 */
export const updateJournalTask = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const taskId = req.params?.taskId;
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    return res.status(400).json({ error: "Invalid taskId" });
  }

  const { isCompleted } = req.body;
  const now = new Date();
  const completionKey = utcDateKey(now);

  const update = isCompleted
    ? {
        isCompleted: true,
        completedAt: now,
        completedDateKey: completionKey,
      }
    : {
        isCompleted: false,
        completedAt: null,
        completedDateKey: null,
      };

  const task = await JournalTask.findOneAndUpdate(
    { _id: taskId, user: userId },
    { $set: update },
    { new: true }
  ).lean();

  if (!task) return res.status(404).json({ error: "Task not found" });

  await touchJournalLastUpdatedAt(userId);

  return res.json({
    task: {
      id: String(task._id),
      title: task.title,
      dueDateKey: task.dueDateKey,
      isCompleted: Boolean(task.isCompleted),
      completedAt: task.completedAt ?? null,
      completedDateKey: task.completedDateKey ?? null,
    },
  });
};
