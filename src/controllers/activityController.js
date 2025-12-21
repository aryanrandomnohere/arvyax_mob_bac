import UserActivityDay from "../models/UserActivityDay.js";

function utcDateKey(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const pingActivity = async (req, res) => {
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
