export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <main className="text-center">
        <h1 className="text-3xl font-bold mb-4">Welcome</h1>
        <a className="rounded-md bg-foreground text-background px-4 py-2" href="/login">Admin Login</a>
      </main>
    </div>
  );
}
