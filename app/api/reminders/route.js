import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db";
import Reminder from "@/models/Reminder";

export async function GET() {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  await connectToDatabase();
  const items = await Reminder.find().sort({ createdAt: -1 }).lean();
  return Response.json({ items });
}

export async function POST(req) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  await connectToDatabase();
  const body = await req.json();
  const payload = { ...body };
  if (payload.scheduleAt && typeof payload.scheduleAt === "string") {
    payload.scheduleAt = new Date(payload.scheduleAt);
  }
  const doc = await Reminder.create({ ...payload, createdBy: session.user?.email || "admin" });
  return Response.json({ item: doc });
}