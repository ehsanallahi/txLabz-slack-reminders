import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth-options";
import { SignOutButton } from "./signout-button";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="text-sm text-foreground/70">You are signed in as {user?.email}</p>
          </div>
          <SignOutButton />
        </div>
        <div className="rounded-xl border border-foreground/10 p-6">
          <h2 className="font-medium mb-2">User Info</h2>
          <pre className="text-sm bg-black/5 rounded p-3 overflow-auto">
{JSON.stringify(user, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
