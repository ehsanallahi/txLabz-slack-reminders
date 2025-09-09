import { runDueReminders } from "../../../../lib/scheduler";
import { NextResponse } from "next/server";

export async function POST(request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const results = await runDueReminders(new Date());
    return NextResponse.json({ ok: true, count: results.length, results });
  } catch (e) {
    console.error("Cron job failed:", e);
    return new Response("Cron job failed", { status: 500 });
  }
}