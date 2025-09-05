"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, List, Clock, CheckCircle, PauseCircle, AlertTriangle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sidebar } from "./components/Sidebar";
import { MobileNav } from "./components/MobileNav";
import { Header } from "./components/Header";
import { CreateReminderForm } from "./components/CreateReminderForm";
import { RemindersList } from "./components/RemindersList";
import { DeliveryHistoryDialog } from "./components/DeliveryHistoryDialog";
import { EditReminderDialog } from "./components/EditReminderDialog";

const PAGE_SIZE = 6;

// Component for the stats dashboard
function HomeStats({ stats }) {
    return (
        <div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Reminders</CardTitle>
                        <List className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">All reminders created</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Reminders</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.active}</div>
                        <p className="text-xs text-muted-foreground">Scheduled and not paused</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Delivered Reminders</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.delivered}</div>
                         <p className="text-xs text-muted-foreground">Successfully sent reminders</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Paused Reminders</CardTitle>
                        <PauseCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.paused}</div>
                        <p className="text-xs text-muted-foreground">Currently paused reminders</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Failed Deliveries</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.failed}</div>
                        <p className="text-xs text-muted-foreground">Reminders that failed to send</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Upcoming Reminders</CardTitle>
                        <Send className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.upcoming}</div>
                        <p className="text-xs text-muted-foreground">Scheduled for the next 24 hours</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}


export default function DashboardPage() {
    const [view, setView] = useState("home");
    const [reminders, setReminders] = useState([]);
    const [channels, setChannels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedReminder, setSelectedReminder] = useState(null);
    const [editingReminder, setEditingReminder] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isNavOpen, setIsNavOpen] = useState(false);

    // Calculate stats for the home dashboard
    const stats = useMemo(() => {
        const now = new Date();
        const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const total = reminders.length;
        const active = reminders.filter(r => !r.isPaused && !r.sent).length;
        const delivered = reminders.filter(r => r.sent).length;
        const paused = reminders.filter(r => r.isPaused).length;
        const failed = reminders.filter(r => r.deliveries.some(d => !d.ok)).length;
        const upcoming = reminders.filter(r => {
            const scheduleAt = new Date(r.scheduleAt);
            return scheduleAt > now && scheduleAt <= next24Hours && !r.isPaused && !r.sent;
        }).length;

        return { total, active, delivered, paused, failed, upcoming };
    }, [reminders]);

    const { paginatedItems, totalPages } = useMemo(() => {
        const totalPages = Math.ceil(reminders.length / PAGE_SIZE);
        const start = (currentPage - 1) * PAGE_SIZE;
        const end = start + PAGE_SIZE;
        return { paginatedItems: reminders.slice(start, end), totalPages };
    }, [reminders, currentPage]);

    const refresh = async () => {
        setLoading(true);
        setError("");
        try {
            const [remindersRes, channelsRes] = await Promise.all([
                fetch("/api/reminders"),
                fetch("/api/slack/channels")
            ]);
            if (!remindersRes.ok) throw new Error("Failed to fetch reminders");
            if (!channelsRes.ok) throw new Error("Failed to load Slack channels");
            const remindersData = await remindersRes.json();
            const channelsData = await channelsRes.json();
            setReminders(remindersData.items || []);
            setChannels(channelsData.channels || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { refresh(); }, []);
    
    const createReminder = async (payload) => {
        const res = await fetch("/api/reminders", { method: "POST", body: JSON.stringify(payload), headers: {'Content-Type': 'application/json'} });
        if (res.ok) {
            await refresh();
            setView('view'); 
        } else {
            setError((await res.text()) || "Failed to create reminder");
        }
    };
    
    const updateReminder = async (payload) => {
        const res = await fetch(`/api/reminders/${payload._id}`, { method: "PUT", body: JSON.stringify(payload), headers: {'Content-Type': 'application/json'} });
        if (res.ok) {
            await refresh();
            setEditingReminder(null);
        } else {
            setError((await res.text()) || "Failed to update reminder");
        }
    };

    const togglePause = async (id, isPaused) => {
        await fetch(`/api/reminders/${id}`, { method: "PUT", body: JSON.stringify({ isPaused: !isPaused }), headers: {'Content-Type': 'application/json'} });
        await refresh();
    };

    const remove = async (id) => {
        await fetch(`/api/reminders/${id}`, { method: "DELETE" });
        await refresh();
    };

    const runNow = async (id) => {
        await fetch(`/api/reminders/${id}/run`, { method: "POST" });
        await refresh();
    };

    return (
        <div className="flex h-screen bg-background">
            <Sidebar view={view} setView={setView} />
            <MobileNav view={view} setView={setView} isNavOpen={isNavOpen} setIsNavOpen={setIsNavOpen} />
            <main className="flex-1 flex flex-col overflow-y-auto">
                <div className="p-4 md:p-8 flex-1 flex flex-col">
                    <Header view={view} onMenuClick={() => setIsNavOpen(true)} />
                    {error && (<div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 text-destructive p-3 text-sm"><strong>Error:</strong> {error}</div>)}
                    
                    <div className="flex-1">
                        {loading && <p>Loading...</p>}

                        {!loading && view === 'home' && (
                            <HomeStats stats={stats} />
                        )}

                        {!loading && view === 'view' && (
                            <>
                                <RemindersList
                                    reminders={paginatedItems}
                                    onPause={togglePause}
                                    onDelete={remove}
                                    onRunNow={runNow}
                                    onSelect={setSelectedReminder}
                                    onEdit={setEditingReminder}
                                />
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-end space-x-2 py-4">
                                        <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages || 1}</span>
                                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}><ChevronLeft className="w-4 h-4 mr-1" />Previous</Button>
                                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Next<ChevronRight className="w-4 h-4 ml-1" /></Button>
                                    </div>
                                )}
                            </>
                        )}
                        {!loading && view === 'create' && (<CreateReminderForm channels={channels} onCreate={createReminder} setView={setView} />)}
                    </div>
                </div>
            </main>
            <DeliveryHistoryDialog reminder={selectedReminder} onClose={() => setSelectedReminder(null)} />
            
            {editingReminder && (
                <EditReminderDialog
                    reminder={editingReminder}
                    channels={channels}
                    onUpdate={updateReminder}
                    onClose={() => setEditingReminder(null)}
                />
            )}
        </div>
    );
}