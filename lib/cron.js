import cron from "node-cron";
import Reminder from "../models/Reminder.js";
import { postMessageWithRetry } from "./slack.js";
import { connectToDatabase } from "./db.js";

// Helper function to calculate the next occurrence of a reminder
function getNextSchedule(reminder) {
    const now = new Date();
    const [hours, minutes] = reminder.time.split(':').map(Number);
    let nextOccurrence = new Date();
    nextOccurrence.setHours(hours, minutes, 0, 0);

    if (reminder.frequency === 'daily') {
        if (nextOccurrence <= now) { // If time has passed for today, schedule for tomorrow
            nextOccurrence.setDate(nextOccurrence.getDate() + 1);
        }
    } else if (reminder.frequency === 'weekly') {
        const targetDay = parseInt(reminder.dayOfWeek, 10);
        const currentDay = nextOccurrence.getDay();
        let dayDifference = targetDay - currentDay;

        if (dayDifference < 0 || (dayDifference === 0 && nextOccurrence <= now)) {
            dayDifference += 7;
        }
        nextOccurrence.setDate(nextOccurrence.getDate() + dayDifference);
    }
    return nextOccurrence;
}


async function processReminders() {
    try {
        await connectToDatabase();
        const now = new Date();
        const reminders = await Reminder.find({
            isPaused: false,
            scheduleAt: { $lte: now },
        });

        if (reminders.length === 0) {
            return; // No log needed for quiet operation
        }

        for (const reminder of reminders) {
            try {
                // For 'once' reminders, only send if not already sent
                if (reminder.frequency === 'once' && reminder.sent) {
                    continue;
                }
            
                await postMessageWithRetry({ channel: reminder.channelId, text: reminder.message });
                reminder.deliveries.push({ at: new Date(), ok: true });

                if (reminder.frequency === 'once') {
                    reminder.sent = true;
                } else {
                    // Reschedule for the next time
                    reminder.scheduleAt = getNextSchedule(reminder);
                }
                console.log(`✅ Sent reminder: ${reminder.message}`);
            } catch (error) {
                reminder.deliveries.push({
                    at: new Date(),
                    ok: false,
                    error: error.message || "Failed to send",
                });
                console.log(`❌ Failed reminder: ${reminder.message}`, error.message);
            }
            await reminder.save();
        }
    } catch (err) {
        console.error("Cron error:", err);
    }
}

export function startCron() {
    cron.schedule("* * * * *", processReminders);
    console.log("🚀 Cron job started (every 1 min)");
}