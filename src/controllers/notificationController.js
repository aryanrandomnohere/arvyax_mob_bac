import mongoose from "mongoose";
import Notification from "../models/Notification.js";

function normalizeNotificationDoc(doc) {
  const value = typeof doc?.toObject === "function" ? doc.toObject() : doc;
  return {
    id: String(value._id),
    banner: value.banner,
    title: value.title,
    message: value.message,
    link: value.link,
    time: value.time,
    priority: {
      level: value.priority?.level ?? "MEDIUM",
      order: Number.isFinite(value.priority?.order)
        ? value.priority.order
        : 100,
    },
    scheduled: {
      type: value.scheduled?.type ?? "one_time",
      frequency: value.scheduled?.frequency ?? "one_time",
      dayOfWeek: value.scheduled?.dayOfWeek ?? null,
      dayOfMonth: value.scheduled?.dayOfMonth ?? null,
      timeOfDay: value.scheduled?.timeOfDay ?? "09:00",
      timezone: value.scheduled?.timezone ?? "UTC",
      startDate: value.scheduled?.startDate ?? null,
      endDate: value.scheduled?.endDate ?? null,
      isActive: value.scheduled?.isActive ?? true,
    },
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

export const createNotification = async (req, res) => {
  const payload = {
    ...req.body,
    time: new Date(req.body.time),
    scheduled: req.body.scheduled
      ? {
          ...req.body.scheduled,
          startDate: req.body.scheduled.startDate
            ? new Date(req.body.scheduled.startDate)
            : null,
          endDate: req.body.scheduled.endDate
            ? new Date(req.body.scheduled.endDate)
            : null,
        }
      : undefined,
  };

  const notification = await Notification.create(payload);
  return res.status(201).json({
    success: true,
    notification: normalizeNotificationDoc(notification),
  });
};

export const getNotifications = async (req, res) => {
  const notifications = await Notification.find({})
    .sort({ "priority.order": 1, time: -1, createdAt: -1 })
    .lean();

  return res.json({
    notifications: notifications.map((notification) =>
      normalizeNotificationDoc(notification),
    ),
    total: notifications.length,
  });
};

export const getNotificationById = async (req, res) => {
  const notificationId = String(req.params.notificationId || "").trim();
  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    return res.status(400).json({ error: "Invalid notificationId" });
  }

  const notification = await Notification.findById(notificationId).lean();
  if (!notification) {
    return res.status(404).json({ error: "Notification not found" });
  }

  return res.json({ notification: normalizeNotificationDoc(notification) });
};

export const updateNotification = async (req, res) => {
  const notificationId = String(req.params.notificationId || "").trim();
  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    return res.status(400).json({ error: "Invalid notificationId" });
  }

  const update = { ...req.body };

  if (typeof update.time === "string") {
    update.time = new Date(update.time);
  }

  if (update.scheduled) {
    update.scheduled = {
      ...update.scheduled,
      startDate: update.scheduled.startDate
        ? new Date(update.scheduled.startDate)
        : (update.scheduled.startDate ?? null),
      endDate: update.scheduled.endDate
        ? new Date(update.scheduled.endDate)
        : (update.scheduled.endDate ?? null),
    };
  }

  const notification = await Notification.findByIdAndUpdate(
    notificationId,
    { $set: update },
    { new: true },
  ).lean();

  if (!notification) {
    return res.status(404).json({ error: "Notification not found" });
  }

  return res.json({
    success: true,
    notification: normalizeNotificationDoc(notification),
  });
};

export const deleteNotification = async (req, res) => {
  const notificationId = String(req.params.notificationId || "").trim();
  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    return res.status(400).json({ error: "Invalid notificationId" });
  }

  const deleted = await Notification.findByIdAndDelete(notificationId).lean();

  if (!deleted) {
    return res.status(404).json({ error: "Notification not found" });
  }

  return res.json({
    success: true,
    message: "Notification deleted successfully",
  });
};
