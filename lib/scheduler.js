import { connectToDatabase } from "./db";
import Reminder from "../models/Reminder";
import { postMessageWithRetry } from "./slack";

/**
 * Calculates the next occurrence of a recurring reminder.
 * @param {object} reminder - The reminder object from the database.
 * @param {Date} fromDate - The date to calculate from.
 * @returns {Date} The next scheduled date.
 */
function computeNextRun(reminder, fromDate) {
  const [hours, minutes] = reminder.time.split(':').map(Number);
  let nextOccurrence = new Date(fromDate);

  if (reminder.frequency === 'daily') {
    nextOccurrence.setHours(hours, minutes, 0, 0);
    // If the time has already passed for today, schedule for tomorrow
    if (nextOccurrence <= fromDate) {
      nextOccurrence.setDate(nextOccurrence.getDate() + 1);
    }
  } else if (reminder.frequency === 'weekly') {
    const targetDay = parseInt(reminder.dayOfWeek, 10);
    nextOccurrence.setHours(hours, minutes, 0, 0);

    const currentDay = nextOccurrence.getDay();
    let dayDifference = targetDay - currentDay;

    // If the target day is in the past for this week, or if it's today but the time has passed
    if (dayDifference < 0 || (dayDifference === 0 && nextOccurrence <= fromDate)) {
      dayDifference += 7;
    }
    nextOccurrence.setDate(nextOccurrence.getDate() + dayDifference);
  } else {
    // For 'once' reminders, return null to indicate they shouldn't be rescheduled.
    return null;
  }

  return nextOccurrence;
}


export async function runDueReminders(now = new Date()) {
  console.log(`[${now.toISOString()}] --- Starting runDueReminders ---`);
  await connectToDatabase();
  const results = [];

  const lockUntil = new Date(now.getTime() + 5 * 60 * 1000); // 5-minute lock

  while (true) {
    let reminder = null;
    try {
      reminder = await Reminder.findOneAndUpdate(
        // FIND a due, unlocked reminder
        { isPaused: false, scheduleAt: { $lte: now } },
        // LOCK it immediately
        { $set: { scheduleAt: lockUntil } },
        { sort: { scheduleAt: 1 }, returnDocument: 'before' } // Return ORIGINAL doc
      ).lean();
    } catch (dbError) {
      console.error('DATABASE ERROR during findOneAndUpdate:', dbError);
      break; // Exit loop on DB error
    }

    if (!reminder) {
      console.log('No more due reminders found. Exiting loop.');
      break; // No more reminders to process
    }

    console.log(`[${reminder._id}] CLAIMED. Locking until ${lockUntil.toISOString()}`);
    const originalScheduleAt = reminder.scheduleAt;

    try {
      // 1. PROCESS MESSAGE
      console.log(`[${reminder._id}] Sending message to channel ${reminder.channelId}...`);
      await postMessageWithRetry({
        channel: reminder.channelId,
        text: reminder.message,
      });
      console.log(`[${reminder._id}] Message sent successfully.`);

      // 2. RESCHEDULE OR COMPLETE
      const nextRun = computeNextRun(reminder, now);

      if (nextRun) {
        console.log(`[${reminder._id}] RESCHEDULING to ${nextRun.toISOString()}`);
        await Reminder.updateOne(
          { _id: reminder._id },
          {
            $set: { scheduleAt: nextRun },
            $push: { deliveries: { at: now, ok: true } },
          }
        );
      } else {
        console.log(`[${reminder._id}] MARKING as complete (sent: true).`);
        await Reminder.updateOne(
          { _id: reminder._id },
          {
            $set: { sent: true },
            $push: { deliveries: { at: now, ok: true } },
          }
        );
      }
      results.push({ id: reminder._id.toString(), status: "sent" });

    } catch (err) {
      console.error(`[${reminder._id}] FAILED to send message. Unlocking...`, err);
      // If sending failed, unlock the reminder by setting its schedule back
      await Reminder.updateOne(
        { _id: reminder._id },
        {
          $set: { scheduleAt: originalScheduleAt },
          $push: { deliveries: { at: now, ok: false, error: err?.message || "Failed" } },
        }
      );
      results.push({ id: reminder._id.toString(), status: "failed", error: err?.message });
    }
  }
  console.log('--- Finished runDueReminders ---');
  return results;
}