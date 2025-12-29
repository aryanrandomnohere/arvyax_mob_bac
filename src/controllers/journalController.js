import mongoose from "mongoose";
import RegisterUser from "../models/UserModel.js";
import JournalEntry from "../models/JournalEntry.js";

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

async function touchJournalLastUpdatedAt(userId) {
  await RegisterUser.updateOne(
    { _id: userId },
    { $set: { journalLastUpdatedAt: new Date() } }
  );
}

function normalizeStatus(status) {
  const s = String(status ?? "")
    .trim()
    .toLowerCase();
  if (s === "completed") return "completed";
  if (s === "pending") return "pending";
  if (s === "skipped") return "skipped";
  // Default for unknown values (keeps backend stable)
  return "pending";
}

function mapEntry(entry) {
  const tasks = (entry?.tasks ?? []).map((t) => ({
    id: String(t._id),
    task: t.task,
    status: t.status,
    createdAt: t.createdAt ?? null,
    updatedAt: t.updatedAt ?? null,
  }));

  const questions = entry?.questions
    ? {
        mistakes: entry.questions.mistakes ?? "",
        whatDidYouLearn: entry.questions.whatDidYouLearn ?? "",
        anythingSpecialHappenedToday: {
          aboutIt: entry.questions.anythingSpecialHappenedToday?.aboutIt ?? "",
          photos: entry.questions.anythingSpecialHappenedToday?.photos ?? [],
        },
      }
    : null;

  return {
    dateKey: entry?.dateKey ?? null,
    tasks,
    questions,
    updatedAt: entry?.updatedAt ?? null,
    createdAt: entry?.createdAt ?? null,
  };
}

/**
 * GET /api/journal?date=YYYY-MM-DD
 * Returns the journal entry for a given day.
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

  const entry = await JournalEntry.findOne({ user: userId, dateKey }).lean();
  const user = await RegisterUser.findById(userId)
    .select("journalLastUpdatedAt updatedAt createdAt")
    .lean();

  return res.json({
    journal: {
      dateKey,
      lastUpdatedAt:
        user?.journalLastUpdatedAt ??
        user?.updatedAt ??
        user?.createdAt ??
        null,
      entry: entry ? mapEntry(entry) : { dateKey, tasks: [], questions: null },
    },
  });
};

/**
 * POST /api/journal/tasks/batch
 * Body: { dateKey?, tasks: [{ task, status? }, ...] }
 * Creates or replaces the task list for that date.
 */
export const upsertJournalTasksForDate = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { dateKey, tasks } = req.body;
  const key = dateKey ?? utcDateKey(new Date());

  if (!dateKeyToUtcDate(key)) {
    return res.status(400).json({ error: "Invalid dateKey" });
  }

  const normalizedTasks = (tasks ?? []).map((t) => ({
    task: String(t.task ?? "").trim(),
    status: normalizeStatus(t.status),
  }));

  const entry = await JournalEntry.findOneAndUpdate(
    { user: userId, dateKey: key },
    { $set: { tasks: normalizedTasks } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  await touchJournalLastUpdatedAt(userId);

  return res.status(201).json({ journal: mapEntry(entry) });
};

/**
 * GET /api/journal/active
 * Returns an array containing:
 * - today's journal entry (even if empty)
 * - all other days where at least one task is not completed
 */
export const getActiveJournals = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const todayKey = utcDateKey(new Date());

  const [todayEntry, incompleteEntries] = await Promise.all([
    JournalEntry.findOne({ user: userId, dateKey: todayKey }).lean(),
    JournalEntry.find({
      user: userId,
      dateKey: { $ne: todayKey },
      tasks: { $elemMatch: { status: { $ne: "completed" } } },
    })
      .sort({ dateKey: -1 })
      .lean(),
  ]);

  const today = todayEntry
    ? mapEntry(todayEntry)
    : { dateKey: todayKey, tasks: [], questions: null };

  const filtered = (incompleteEntries ?? [])
    .map((e) => mapEntry(e))
    .filter((e) => (e.tasks ?? []).some((t) => t.status !== "completed"));

  return res.json({ journals: [today, ...filtered] });
};

/**
 * GET /api/journal/incomplete
 * Returns only the days where at least one task is not completed.
 */
export const listIncompleteJournalDays = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const entries = await JournalEntry.find({
    user: userId,
    tasks: { $elemMatch: { status: { $ne: "completed" } } },
  })
    .sort({ dateKey: 1 })
    .lean();

  // Extra safety filter (if empty tasks somehow exist)
  const filtered = (entries ?? [])
    .map((e) => mapEntry(e))
    .filter((e) => (e.tasks ?? []).some((t) => t.status !== "completed"));

  return res.json({ days: filtered });
};

/**
 * POST /api/journal/tasks
 * Body: { dateKey?, task, status? }
 * Appends a new task to a date (even after 5 tasks).
 */
export const appendJournalTaskForDate = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { dateKey, task, status } = req.body;
  const key = dateKey ?? utcDateKey(new Date());

  if (!dateKeyToUtcDate(key)) {
    return res.status(400).json({ error: "Invalid dateKey" });
  }

  const entry = await JournalEntry.findOne({ user: userId, dateKey: key });
  const doc =
    entry ??
    (await JournalEntry.create({
      user: userId,
      dateKey: key,
      tasks: [],
    }));

  doc.tasks.push({
    task: String(task ?? "").trim(),
    status: normalizeStatus(status),
  });
  await doc.save();

  await touchJournalLastUpdatedAt(userId);

  const created = doc.tasks[doc.tasks.length - 1];
  return res.status(201).json({
    task: {
      id: String(created._id),
      task: created.task,
      status: created.status,
      dateKey: doc.dateKey,
    },
  });
};

/**
 * PATCH /api/journal/tasks/:taskId
 * Body: { status }
 */
export const updateJournalTaskStatus = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const taskId = req.params?.taskId;
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    return res.status(400).json({ error: "Invalid taskId" });
  }

  const { status } = req.body;
  const normalized = normalizeStatus(status);

  const entry = await JournalEntry.findOne({
    user: userId,
    "tasks._id": taskId,
  });

  if (!entry) return res.status(404).json({ error: "Task not found" });

  const task = entry.tasks.id(taskId);
  if (!task) return res.status(404).json({ error: "Task not found" });
  task.status = normalized;
  await entry.save();

  await touchJournalLastUpdatedAt(userId);

  return res.json({
    task: {
      id: String(task._id),
      task: task.task,
      status: task.status,
      dateKey: entry.dateKey,
    },
  });
};

/**
 * PUT /api/journal/questions
 * Body: { dateKey?, mistakes, whatDidYouLearn, anythingSpecialHappenedToday: { aboutIt, photos } }
 */
export const upsertJournalQuestionsForDate = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { dateKey, mistakes, whatDidYouLearn, anythingSpecialHappenedToday } =
    req.body;
  const key = dateKey ?? utcDateKey(new Date());

  if (!dateKeyToUtcDate(key)) {
    return res.status(400).json({ error: "Invalid dateKey" });
  }

  const questions = {
    mistakes: String(mistakes ?? "").trim(),
    whatDidYouLearn: String(whatDidYouLearn ?? "").trim(),
    anythingSpecialHappenedToday: {
      aboutIt: String(anythingSpecialHappenedToday?.aboutIt ?? "").trim(),
      photos: Array.isArray(anythingSpecialHappenedToday?.photos)
        ? anythingSpecialHappenedToday.photos.map((p) => String(p ?? "").trim())
        : [],
    },
  };

  const entry = await JournalEntry.findOneAndUpdate(
    { user: userId, dateKey: key },
    { $set: { questions } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  await touchJournalLastUpdatedAt(userId);

  return res.json({ journal: mapEntry(entry) });
};
