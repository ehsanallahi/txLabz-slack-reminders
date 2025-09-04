import cron from "node-cron";
import Reminder from "../models/Reminder.js";
import { postMessageWithRetry } from "./slack.js";
import { connectToDatabase } from "./db.js";

async function processReminders() {
  try {
    await connectToDatabase();

    const now = new Date();
    // 1. Log that the job is running and what the current UTC time is
    console.log(`\n[CRON] Running job at: ${now.toISOString()}`);

    const query = {
      sent: false,
      isPaused: false,
      scheduleAt: { $lte: now },
    };
    
    // 2. Log the exact query being sent to the database
    console.log('[CRON] Finding reminders with query:', JSON.stringify(query, null, 2));

    const reminders = await Reminder.find(query);

    if (reminders.length === 0) {
      console.log("[CRON] ⏰ No due reminders found.");
      return;
    }
    
    // 3. Log how many reminders were found
    console.log(`[CRON] Found ${reminders.length} reminder(s) to send.`);

    for (const reminder of reminders) {
      // 4. Log the details of the reminder being processed
      console.log(`[CRON] --> Processing reminder ID: ${reminder._id} scheduled for ${reminder.scheduleAt.toISOString()}`);
      
      try {
        await postMessageWithRetry({ channel: reminder.channelId, text: reminder.message });
        reminder.sent = true;
        reminder.deliveries.push({
          at: new Date(),
          ok: true,
        });
        console.log(`[CRON] ✅ Sent reminder: ${reminder.message}`);
      } catch (error) {
        reminder.deliveries.push({
          at: new Date(),
          ok: false,
          error: error.message || "Failed to send",
        });
        console.log(`[CRON] ❌ Failed reminder: ${reminder.message}`, error.message);
      }
      await reminder.save();
    }
  } catch (err) {
    console.error("[CRON] Error during job execution:", err);
  }
}

export function startCron() {
  // Run every minute
  cron.schedule("* * * * *", processReminders);
  console.log("🚀 Cron job started (every 1 min)");
}