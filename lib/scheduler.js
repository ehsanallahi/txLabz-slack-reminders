import { connectToDatabase } from "./db";
import Reminder from "../models/Reminder";
import { postMessageWithRetry } from "./slack";

// No cron now; single scheduled datetime via scheduleAt

export async function runDueReminders(now = new Date()) {
  await connectToDatabase();
  const reminders = await Reminder.find({ isPaused: false, sent: false, scheduleAt: { $lte: now } }).lean();

  const results = [];
  for (const r of reminders) {
    try {
      await postMessageWithRetry({ channel: r.channelId, text: r.message });
      await Reminder.updateOne(
        { _id: r._id },
        {
          $set: { sent: true },
          $push: { deliveries: { at: now, ok: true } },
        }
      );
      results.push({ id: r._id.toString(), sent: true, channelId: r.channelId });
    } catch (err) {
      await Reminder.updateOne(
        { _id: r._id },
        { $push: { deliveries: { at: now, ok: false, error: err?.message || "" } } }
      );
      results.push({ id: r._id.toString(), sent: false, error: err?.message });
    }
  }
  return results;
}