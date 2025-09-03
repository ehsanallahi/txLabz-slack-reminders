import cron from "node-cron";
import mongoose from "mongoose";
import Reminder from "@/models/Reminder";

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

async function sendToSlack(channelId, text) {
  try {
    const res = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SLACK_BOT_TOKEN}`,
      },
      body: JSON.stringify({ channel: channelId, text }),
    });

    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "Slack API error");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function scheduleNextOccurrence(reminder) {
  const now = new Date();
  
  if (reminder.frequency === "daily") {
    // Schedule for next day at the same time
    const nextRun = new Date(reminder.scheduleAt);
    nextRun.setDate(nextRun.getDate() + 1);
    reminder.scheduleAt = nextRun;
  } else if (reminder.frequency === "weekly") {
    // Schedule for next week at the same day and time
    const nextRun = new Date(reminder.scheduleAt);
    nextRun.setDate(nextRun.getDate() + 7);
    reminder.scheduleAt = nextRun;
  }
  // For "once" frequency, we don't reschedule
}

async function processReminders() {
  try {
    // Ensure database connection
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const now = new Date();

    // Find reminders that are due and not paused
    const reminders = await Reminder.find({
      isPaused: { $ne: true }, // Not paused (handles undefined/null as false)
      scheduleAt: { $lte: now }, // Due time has passed
      $or: [
        { sent: { $ne: true } }, // Never sent or sent is false/undefined
        {
          sent: true,
          frequency: { $in: ["daily", "weekly"] } // Recurring reminders that were sent
        }
      ]
    });

    if (reminders.length === 0) {
      console.log("No due reminders");
      return;
    }

    console.log(`Processing ${reminders.length} reminder(s)`);

    for (const reminder of reminders) {
      const result = await sendToSlack(reminder.channelId, reminder.message);

      // Initialize deliveries array if it doesn't exist
      if (!reminder.deliveries) {
        reminder.deliveries = [];
      }

      // Log the delivery attempt
      reminder.deliveries.push({
        at: new Date(),
        ok: result.ok,
        error: result.error || null,
      });

      if (result.ok) {
        console.log(`✅ Sent reminder: ${reminder.message}`);
        
        // Handle different frequency types
        if (reminder.frequency === "once") {
          reminder.sent = true; // Mark as sent, won't repeat
        } else if (reminder.frequency === "daily" || reminder.frequency === "weekly") {
          // Schedule next occurrence for recurring reminders
          await scheduleNextOccurrence(reminder);
          reminder.sent = true; // Mark current occurrence as sent
          console.log(`📅 Next occurrence scheduled for: ${reminder.scheduleAt}`);
        }
      } else {
        console.log(`❌ Failed to send reminder: ${reminder.message}`, result.error);
        
        // For failed recurring reminders, still schedule next occurrence
        // You might want to implement retry logic here
        if (reminder.frequency === "daily" || reminder.frequency === "weekly") {
          await scheduleNextOccurrence(reminder);
          reminder.sent = true; // Mark as processed even if failed
          console.log(`📅 Next occurrence scheduled despite failure: ${reminder.scheduleAt}`);
        } else {
          // For "once" reminders, you might want to retry or mark as failed
          // For now, we'll leave sent as false so it can be retried
        }
      }

      // Save the updated reminder
      await reminder.save();
    }
  } catch (err) {
    console.error("❌ Cron error:", err);
    
    // Optionally, you might want to send an alert to Slack about the cron failure
    // This would help with monitoring
    if (SLACK_BOT_TOKEN && process.env.ERROR_CHANNEL_ID) {
      try {
        await sendToSlack(
          process.env.ERROR_CHANNEL_ID, 
          `🚨 Reminder cron job failed: ${err.message}`
        );
      } catch (alertErr) {
        console.error("Failed to send error alert to Slack:", alertErr);
      }
    }
  }
}

export function startCron() {
  // Run every minute
  cron.schedule("* * * * *", processReminders);
  console.log("🚀 Reminder cron job started (runs every minute)");
}

// Optional: Export the processReminders function for manual testing
export { processReminders };