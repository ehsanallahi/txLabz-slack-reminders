import { backfillNextRunForAll } from "../../../../lib/scheduler";

export async function POST() {
  try {
    await backfillNextRunForAll(new Date());
    return Response.json({ ok: true });
  } catch (e) {
    return new Response("Backfill failed", { status: 500 });
  }
}


