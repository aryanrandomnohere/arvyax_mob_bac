import type { Request, Response } from "express";
import UserActivityDay from "../models/UserActivityDay.js";

function utcDateKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// User hits this whenever they enter/open the app
export const pingActivity = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const now = new Date();
    await UserActivityDay.markActive(String(userId), now);

    return res.json({
      active: true,
      dateKey: utcDateKey(now),
    });
  } catch (err) {
    console.error("ACTIVITY PING ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
