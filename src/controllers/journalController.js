import mongoose from "mongoose";
import RegisterUser from "../models/UserModel.js";
import JournalEntry from "../models/JournalEntry.js";
import { uploadUserImageToR2 } from "../utils/r2Upload.js";

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
    { $set: { journalLastUpdatedAt: new Date() } },
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
    req.validatedQuery?.date ?? req.query?.date ?? todayKey,
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
    { upsert: true, new: true, setDefaultsOnInsert: true },
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
 * GET /api/journal/history
 * Returns all stored journal entries for the user (newest first).
 */
export const getJournalHistory = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const entries = await JournalEntry.find({ user: userId })
    .sort({ dateKey: -1, createdAt: -1 })
    .lean();

  return res.json({ journals: (entries ?? []).map((e) => mapEntry(e)) });
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
        ? anythingSpecialHappenedToday.photos
            .map((p) => String(p ?? "").trim())
            .filter(Boolean)
        : [],
    },
  };

  // Optional: accept one or more image files in multipart payload and upload to R2.
  const files = [];
  if (Array.isArray(req.files)) {
    files.push(...req.files);
  } else if (req.files && typeof req.files === "object") {
    if (Array.isArray(req.files.image)) files.push(...req.files.image);
    if (Array.isArray(req.files.images)) files.push(...req.files.images);
  }
  if (req.file) files.push(req.file);

  for (const file of files) {
    const uploaded = await uploadUserImageToR2({
      userId,
      dateKey: key,
      file,
      prefix: "mobile-user-images/journal-questions",
    });
    questions.anythingSpecialHappenedToday.photos.push(uploaded.url);
  }

  const entry = await JournalEntry.findOneAndUpdate(
    { user: userId, dateKey: key },
    { $set: { questions } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();

  await touchJournalLastUpdatedAt(userId);

  return res.json({ journal: mapEntry(entry) });
};

/**
 * GET /api/journal/stats/total-tasks
 * Returns total tasks count and completed tasks count for the user.
 */
export const getTotalTaskStats = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const entries = await JournalEntry.find({ user: userId }).lean();

  let totalTasks = 0;
  let completedTasks = 0;

  entries.forEach((entry) => {
    if (entry.tasks && Array.isArray(entry.tasks)) {
      totalTasks += entry.tasks.length;
      completedTasks += entry.tasks.filter(
        (task) => task.status === "completed",
      ).length;
    }
  });

  return res.json({
    totalTasks,
    completedTasks,
  });
};

/**
 * GET /api/journal/stats/average-daily-tasks
 * Returns average daily tasks and average daily completed tasks for the user.
 */
export const getAverageDailyTaskStats = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const entries = await JournalEntry.find({ user: userId }).lean();

  if (entries.length === 0) {
    return res.json({
      averageDailyTasks: 0,
      averageDailyCompleted: 0,
      daysCount: 0,
    });
  }

  let totalTasks = 0;
  let totalCompleted = 0;

  entries.forEach((entry) => {
    if (entry.tasks && Array.isArray(entry.tasks)) {
      totalTasks += entry.tasks.length;
      totalCompleted += entry.tasks.filter(
        (task) => task.status === "completed",
      ).length;
    }
  });

  const daysCount = entries.length;
  const averageDailyTasks = Number((totalTasks / daysCount).toFixed(2));
  const averageDailyCompleted = Number((totalCompleted / daysCount).toFixed(2));

  return res.json({
    averageDailyTasks,
    averageDailyCompleted,
    daysCount,
  });
};

/**
 * GET /api/journal/milestones
 * Returns all milestone answers (anythingSpecialHappenedToday) by day.
 */
export const getJournalMilestones = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const entries = await JournalEntry.find({ user: userId })
    .select("dateKey questions.anythingSpecialHappenedToday")
    .sort({ dateKey: -1 })
    .lean();

  const milestones = (entries ?? [])
    .map((entry) => {
      const aboutIt = String(
        entry?.questions?.anythingSpecialHappenedToday?.aboutIt ?? "",
      ).trim();
      const photos = Array.isArray(
        entry?.questions?.anythingSpecialHappenedToday?.photos,
      )
        ? entry.questions.anythingSpecialHappenedToday.photos
        : [];

      return {
        dateKey: entry?.dateKey ?? null,
        aboutIt,
        photos,
      };
    })
    .filter((item) => item.aboutIt.length > 0 || item.photos.length > 0);

  return res.json({ milestones });
};

/**
 * GET /api/journal/learnings
 * Returns all learning answers (whatDidYouLearn) by day.
 */
export const getJournalLearnings = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const entries = await JournalEntry.find({ user: userId })
    .select("dateKey questions.whatDidYouLearn")
    .sort({ dateKey: -1 })
    .lean();

  const learnings = (entries ?? [])
    .map((entry) => ({
      dateKey: entry?.dateKey ?? null,
      whatDidYouLearn: String(entry?.questions?.whatDidYouLearn ?? "").trim(),
    }))
    .filter((item) => item.whatDidYouLearn.length > 0);

  return res.json({ learnings });
};

/**
 * GET /api/journal/stats/daily-questions
 * Returns how many days have learning/mistakes answers.
 */
export const getDailyQuestionStats = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const entries = await JournalEntry.find({ user: userId })
    .select("dateKey questions.mistakes questions.whatDidYouLearn")
    .lean();

  let daysWithLearning = 0;
  let daysWithMistakes = 0;
  let daysAnswered = 0;

  (entries ?? []).forEach((entry) => {
    const learning = String(entry?.questions?.whatDidYouLearn ?? "").trim();
    const mistakes = String(entry?.questions?.mistakes ?? "").trim();

    const hasLearning = learning.length > 0;
    const hasMistakes = mistakes.length > 0;

    if (hasLearning) daysWithLearning += 1;
    if (hasMistakes) daysWithMistakes += 1;
    if (hasLearning || hasMistakes) daysAnswered += 1;
  });

  return res.json({
    totalDays: entries.length,
    daysAnswered,
    daysWithLearning,
    daysWithMistakes,
  });
};
