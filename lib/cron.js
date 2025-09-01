import cron from "node-cron";
import mongoose from "mongoose";
// import Reminder from "@/lib/models/Reminder.js"; // adjust path
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

async function processReminders() {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const now = new Date();

    const reminders = await Reminder.find({
      sent: false,
      isPaused: false,
      scheduleAt: { $lte: now },
    });

    if (reminders.length === 0) {
      console.log("⏰ No due reminders");
      return;
    }

    for (const reminder of reminders) {
      const result = await sendToSlack(reminder.channelId, reminder.message);

      reminder.deliveries.push({
        at: new Date(),
        ok: result.ok,
        error: result.error || null,
      });

      if (result.ok) {
        reminder.sent = true;
        console.log(`✅ Sent reminder: ${reminder.message}`);
      } else {
        console.log(`❌ Failed reminder: ${reminder.message}`, result.error);
      }

      await reminder.save();
    }
  } catch (err) {
    console.error("Cron error:", err);
  }
}

export function startCron() {
  // Run every minute
  cron.schedule("* * * * *", processReminders);
  console.log("🚀 Cron job started (every 1 min)");
}
