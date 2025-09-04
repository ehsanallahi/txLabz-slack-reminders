"use client";

import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Bell, CalendarClock, BotMessageSquare, Edit } from "lucide-react";

// Main Landing Page Component
export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b">
        <Link href="#" className="flex items-center justify-center" prefetch={false}>
          <Bell className="h-6 w-6 text-primary" />
          <span className="ml-2 text-lg font-semibold">TxLabz Reminder App</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="/login" prefetch={false}>
            <Button variant="outline">
              Admin Login
            </Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 text-center">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                Never Miss a Beat in Slack.
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Automate your team's workflow with powerful, recurring reminders. Schedule one-time, daily, or weekly messages with our intuitive rich text editor.
              </p>
              <div className="space-x-4">
                <Link href="/login" prefetch={false}>
                  <Button size="lg">Get Started</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* App Preview Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
          <div className="container px-4 md:px-6">
            <div className="mx-auto max-w-5xl">
              <div className="rounded-xl border bg-background shadow-2xl overflow-hidden">
                <div className="h-11 flex items-center px-4 border-b">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                  </div>
                </div>
                <img
                  src="https://placehold.co/1200x675/f0f0f0/333333?text=App+Dashboard+Screenshot&font=sans"
                  width="1200"
                  height="675"
                  alt="App Preview"
                  className="w-full h-auto aspect-video object-cover"
                />
              </div>
            </div>
          </div>
        </section>


        {/* Features Section */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Key Features</div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Everything You Need to Keep Your Team in Sync</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                From simple one-off announcements to complex weekly reports, our app handles it all.
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:grid-cols-3">
              <div className="grid gap-1 text-center">
                <div className="flex justify-center items-center mb-4">
                    <div className="bg-primary/10 p-4 rounded-full">
                        <CalendarClock className="w-8 h-8 text-primary" />
                    </div>
                </div>
                <h3 className="text-lg font-bold">Flexible Scheduling</h3>
                <p className="text-sm text-muted-foreground">
                  Schedule reminders to be sent once, every day, or on specific days of the week.
                </p>
              </div>
              <div className="grid gap-1 text-center">
                <div className="flex justify-center items-center mb-4">
                    <div className="bg-primary/10 p-4 rounded-full">
                        <Edit className="w-8 h-8 text-primary" />
                    </div>
                </div>
                <h3 className="text-lg font-bold">Rich Message Formatting</h3>
                <p className="text-sm text-muted-foreground">
                  Use bold, italics, lists, and more to create clear and compelling messages right from our editor.
                </p>
              </div>
              <div className="grid gap-1 text-center">
                <div className="flex justify-center items-center mb-4">
                    <div className="bg-primary/10 p-4 rounded-full">
                        <BotMessageSquare className="w-8 h-8 text-primary" />
                    </div>
                </div>
                <h3 className="text-lg font-bold">Automated & Reliable</h3>
                <p className="text-sm text-muted-foreground">
                  Our robust cron system ensures your messages are delivered reliably and on time, every time.
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2025 TxLabz Inc. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
