import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth-options"; // Corrected Path
import { connectToDatabase } from "../../../../lib/db";
import Reminder from "../../../../models/Reminder";

export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  await connectToDatabase();
  const body = await req.json();
  const updated = await Reminder.findByIdAndUpdate(params.id, body, { new: true });
  return Response.json({ item: updated });
}

export async function DELETE(_req, { params }) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  await connectToDatabase();
  await Reminder.findByIdAndDelete(params.id);
  return new Response(null, { status: 204 });
}