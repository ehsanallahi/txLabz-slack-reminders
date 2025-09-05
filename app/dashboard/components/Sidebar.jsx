"use client";
import { Bell, PlusCircle, LayoutGrid, LogOut, Home } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function Sidebar({ view, setView }) {
    return (
        <aside className="w-64 flex-col bg-[#0d1a22] text-[#f3f4f6] border-r border-gray-700 hidden md:flex">
            <div className="p-4 border-b border-gray-700">
                <h1 className="text-2xl font-semibold flex items-center gap-2 tracking-tight">
                    <Bell className="w-6 h-6 text-[#f3f4f6]" />
                    <span>TxLabz</span>
                </h1>
            </div>
            <nav className="flex-1 p-4 space-y-1">
                <Button
                    variant={view === 'home' ? 'secondary' : 'ghost'}
                    className="w-full justify-start text-base"
                    onClick={() => setView('home')}
                >
                    <Home className="w-5 h-5 mr-3" />
                    Home
                </Button>
                <Button
                    variant={view === 'view' ? 'secondary' : 'ghost'}
                    className="w-full justify-start text-base"
                    onClick={() => setView('view')}
                >
                    <LayoutGrid className="w-5 h-5 mr-3" />
                    View Reminders
                </Button>
                <Button
                    variant={view === 'create' ? 'secondary' : 'ghost'}
                    className="w-full justify-start text-base"
                    onClick={() => setView('create')}
                >
                    <PlusCircle className="w-5 h-5 mr-3" />
                    Create Reminder
                </Button>
            </nav>
            <div className="p-4 border-t border-gray-700">
                <Button
                    variant="ghost"
                    className="w-full justify-start text-base"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                >
                    <LogOut className="w-5 h-5 mr-3" />
                    Logout
                </Button>
            </div>
        </aside>
    );
}