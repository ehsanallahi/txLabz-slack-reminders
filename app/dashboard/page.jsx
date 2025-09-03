"use client";
// import { getServerSession } from "next-auth";
// import { authOptions } from "../../lib/auth-options";
// import { SignOutButton } from "./signout-button";

// export default async function DashboardPage() {
//   const session = await getServerSession(authOptions);
//   const user = session?.user;

//   return (
//     <div className="min-h-screen p-6">
//       <div className="max-w-3xl mx-auto">
//         <div className="flex items-center justify-between mb-6">
//           <div>
//             <h1 className="text-2xl font-semibold">Dashboard</h1>
//             <p className="text-sm text-foreground/70">You are signed in as {user?.email}</p>
//           </div>
//           <SignOutButton />
//         </div>
//         <div className="rounded-xl border border-foreground/10 p-6">
//           <h2 className="font-medium mb-2">User Info</h2>
//           <pre className="text-sm bg-black/5 rounded p-3 overflow-auto">
// {JSON.stringify(user, null, 2)}
//           </pre>
//         </div>
//       </div>
//     </div>
//   );
// }



import { useState, useEffect, useMemo } from "react";
import { Bell, PlusCircle, LayoutGrid, LogOut, Play, Pause, Trash2, Send } from "lucide-react";

// NOTE: All components are in this single file for simplicity, as per the current structure.
// In a real project, these would be in separate files (e.g., components/layout/Sidebar.jsx).

// -- HELPER COMPONENTS --

function SidebarComponent({ view, setView }) {
    const commonButtonClasses = "flex items-center w-full text-sm font-medium rounded-lg px-3 py-2 transition-colors";
    const activeButtonClasses = "bg-gray-800 text-white";
    const inactiveButtonClasses = "text-gray-400 hover:bg-gray-800 hover:text-white";

    return (
        <aside className="w-64 flex-col bg-gray-900 text-white hidden md:flex">
            <div className="p-4 border-b border-gray-700">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Bell className="w-6 h-6" />
                    <span>TxLabz</span>
                </h1>
            </div>
            <nav className="flex-1 p-4 space-y-2">
                <button
                    onClick={() => setView('view')}
                    className={`${commonButtonClasses} ${view === 'view' ? activeButtonClasses : inactiveButtonClasses}`}
                >
                    <LayoutGrid className="w-5 h-5 mr-3" />
                    View Reminders
                </button>
                <button
                    onClick={() => setView('create')}
                    className={`${commonButtonClasses} ${view === 'create' ? activeButtonClasses : inactiveButtonClasses}`}
                >
                    <PlusCircle className="w-5 h-5 mr-3" />
                    Create Reminder
                </button>
            </nav>
            <div className="p-4 border-t border-gray-700">
                <button className={`${commonButtonClasses} ${inactiveButtonClasses}`}>
                    <LogOut className="w-5 h-5 mr-3" />
                    Logout
                </button>
            </div>
        </aside>
    );
}

function HeaderComponent({ view }) {
    const titles = {
        view: {
            title: "Scheduled Reminders",
            description: "A list of all your active and paused reminders.",
        },
        create: {
            title: "Create a New Reminder",
            description: "Set up a new message to be sent to a Slack channel.",
        },
    };
    const { title, description } = titles[view] || titles.view;

    return (
        <header className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">{title}</h2>
            <p className="mt-1 text-gray-500">{description}</p>
        </header>
    );
}

function CreateReminderForm({ channels, onCreate, setView }) {
    const [form, setForm] = useState({
        message: "",
        channelId: "",
        scheduleAt: "",
        frequency: "once",
        time: "09:00",
        dayOfWeek: "1", // Monday
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const selectedChannel = useMemo(() => channels.find(c => c.id === form.channelId), [channels, form.channelId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        // Base payload
        let payload = {
            message: form.message,
            channelId: form.channelId,
            channelName: selectedChannel?.name,
            frequency: form.frequency,
            time: form.time,
            dayOfWeek: form.dayOfWeek
        };

        const now = new Date();
        const [hours, minutes] = form.time.split(':').map(Number);
        
        if (form.frequency === 'once') {
            payload.scheduleAt = new Date(form.scheduleAt).toISOString();
        } else if (form.frequency === 'daily') {
            let nextOccurrence = new Date();
            nextOccurrence.setHours(hours, minutes, 0, 0);
            if (nextOccurrence < now) { // If time has passed for today, schedule for tomorrow
                nextOccurrence.setDate(nextOccurrence.getDate() + 1);
            }
            payload.scheduleAt = nextOccurrence.toISOString();
        } else if (form.frequency === 'weekly') {
            const targetDay = parseInt(form.dayOfWeek, 10);
            let nextOccurrence = new Date();
            nextOccurrence.setHours(hours, minutes, 0, 0);
            
            const currentDay = nextOccurrence.getDay();
            let dayDifference = targetDay - currentDay;

            // If the day is in the past for this week, or if it's today but the time has passed
            if (dayDifference < 0 || (dayDifference === 0 && nextOccurrence < now)) {
                dayDifference += 7;
            }
            
            nextOccurrence.setDate(nextOccurrence.getDate() + dayDifference);
            payload.scheduleAt = nextOccurrence.toISOString();
        }

        await onCreate(payload);
        setIsSubmitting(false);
        setView('view');
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
            <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <textarea
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    required
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-sm font-medium">Channel</label>
                    <select
                        className="w-full rounded-md border border-gray-300 px-3 py-2"
                        value={form.channelId}
                        onChange={(e) => setForm({ ...form, channelId: e.target.value })}
                        required
                    >
                        <option value="">Select channel…</option>
                        {channels.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Frequency</label>
                     <select
                        className="w-full rounded-md border border-gray-300 px-3 py-2"
                        value={form.frequency}
                        onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                    >
                        <option value="once">Once</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                    </select>
                </div>
            </div>
             {/* Conditional Fields */}
            {form.frequency === "once" && (
                 <div className="space-y-2">
                    <label className="text-sm font-medium">Send at</label>
                    <input type="datetime-local" className="w-full rounded-md border border-gray-300 px-3 py-2"
                        value={form.scheduleAt} onChange={(e) => setForm({ ...form, scheduleAt: e.target.value })} required />
                </div>
            )}
             {form.frequency === "daily" && (
                 <div className="space-y-2">
                    <label className="text-sm font-medium">Time</label>
                    <input type="time" className="w-full rounded-md border border-gray-300 px-3 py-2"
                        value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required />
                </div>
            )}
            {form.frequency === "weekly" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Day of the Week</label>
                        <select className="w-full rounded-md border border-gray-300 px-3 py-2"
                            value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })} required>
                            <option value="1">Monday</option>
                            <option value="2">Tuesday</option>
                            <option value="3">Wednesday</option>
                            <option value="4">Thursday</option>
                            <option value="5">Friday</option>
                            <option value="6">Saturday</option>
                            <option value="0">Sunday</option>
                        </select>
                    </div>
                     <div className="space-y-2">
                        <label className="text-sm font-medium">Time</label>
                        <input type="time" className="w-full rounded-md border border-gray-300 px-3 py-2"
                            value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required />
                    </div>
                </div>
            )}

            <div>
                <button type="submit" disabled={isSubmitting} className="inline-flex items-center justify-center rounded-md text-sm font-medium px-4 py-2 bg-black text-white hover:bg-gray-800 disabled:bg-gray-400">
                    {isSubmitting ? 'Creating...' : 'Create Reminder'}
                </button>
            </div>
        </form>
    );
}

function RemindersTable({ reminders, onPause, onDelete, onRunNow, onSelect }) {
    const handleActionClick = (e, action) => {
        e.stopPropagation(); // Prevent row click from firing
        action();
    };

    const formatSchedule = (reminder) => {
        if (reminder.frequency === 'daily') {
            return `Daily at ${reminder.time}`;
        }
        if (reminder.frequency === 'weekly') {
            const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            return `Weekly on ${days[reminder.dayOfWeek]} at ${reminder.time}`;
        }
        // Fallback for 'once' or older reminders
        return new Date(reminder.scheduleAt).toLocaleString();
    };
    
    return (
        <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Message</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Channel</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Schedule</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Last Delivery</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                    {reminders.map((r) => (
                        <tr key={r._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onSelect(r)}>
                            <td className="px-4 py-3 max-w-xs truncate" title={r.message}>{r.message}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{r.channelName}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{formatSchedule(r)}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${r.isPaused ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                    {r.isPaused ? "Paused" : "Scheduled"}
                                </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">{r.deliveries?.length ? new Date(r.deliveries[r.deliveries.length - 1].at).toLocaleString() : '—'}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center space-x-2">
                                     <button onClick={(e) => handleActionClick(e, () => onPause(r._id, r.isPaused))} className="text-gray-500 hover:text-gray-800" title={r.isPaused ? "Resume" : "Pause"}>
                                        {r.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                                    </button>
                                     <button onClick={(e) => handleActionClick(e, () => onRunNow(r._id))} className="text-gray-500 hover:text-gray-800" title="Run Now">
                                        <Send className="w-4 h-4" />
                                    </button>
                                    <button onClick={(e) => handleActionClick(e, () => onDelete(r._id))} className="text-red-500 hover:text-red-700" title="Delete">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function DeliveryHistoryDialog({ reminder, onClose }) {
    if (!reminder) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
            <div className="relative w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between pb-4 border-b">
                    <div>
                        <h3 className="text-lg font-semibold">Delivery History</h3>
                        <p className="text-sm text-gray-500 truncate">{reminder.message}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
                </div>
                 <div className="max-h-[60vh] overflow-y-auto mt-4">
                    {reminder.deliveries?.length ? (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="p-2 text-left font-semibold text-gray-600">Time</th>
                                    <th className="p-2 text-left font-semibold text-gray-600">Status</th>
                                    <th className="p-2 text-left font-semibold text-gray-600">Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reminder.deliveries.map((d, idx) => (
                                    <tr key={idx} className="border-t">
                                        <td className="p-2">{new Date(d.at).toLocaleString()}</td>
                                        <td className="p-2">{d.ok ? "OK" : "Failed"}</td>
                                        <td className="p-2 text-red-600">{d.error || ""}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-sm text-gray-500 text-center py-8">No deliveries yet.</div>
                    )}
                 </div>
            </div>
        </div>
    );
}

// -- MAIN PAGE COMPONENT --

export default function DashboardPage() {
    const [view, setView] = useState("view");
    const [reminders, setReminders] = useState([]);
    const [channels, setChannels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedReminder, setSelectedReminder] = useState(null);

    // -- API Functions --
    const refresh = async () => {
        setLoading(true);
        setError("");
        try {
            const remindersRes = await fetch("/api/reminders");
            if (!remindersRes.ok) throw new Error("Failed to fetch reminders");
            const remindersData = await remindersRes.json();
            setReminders(remindersData.items || []);

            const channelsRes = await fetch("/api/slack/channels");
            if (!channelsRes.ok) throw new Error("Failed to load Slack channels");
            const channelsData = await channelsRes.json();
            setChannels(channelsData.channels || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
    }, []);

    const createReminder = async (payload) => {
        const res = await fetch("/api/reminders", { method: "POST", body: JSON.stringify(payload), headers: {'Content-Type': 'application/json'} });
        if (res.ok) {
            await refresh();
        } else {
            let errorMessage = "Failed to create reminder";
            // Read the response as text first, as the body can only be read once.
            const errorText = await res.text();
            try {
                // Attempt to parse the text as JSON.
                const err = JSON.parse(errorText);
                errorMessage = err.error || errorMessage;
            } catch (e) {
                // If JSON parsing fails, the error is likely plain text.
                errorMessage = errorText || res.statusText || errorMessage;
            }
            setError(errorMessage);
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
        <div className="flex h-screen bg-gray-50">
            <SidebarComponent view={view} setView={setView} />
            <main className="flex-1 overflow-y-auto p-8">
                <HeaderComponent view={view} />

                {error && (
                    <div className="mb-4 rounded border border-red-300 bg-red-50 text-red-700 px-3 py-2 text-sm">
                        <strong>Error:</strong> {error}
                    </div>
                )}
                
                {loading && <p>Loading...</p>}

                {!loading && view === 'view' && (
                    <RemindersTable
                        reminders={reminders}
                        onPause={togglePause}
                        onDelete={remove}
                        onRunNow={runNow}
                        onSelect={setSelectedReminder}
                    />
                )}

                {!loading && view === 'create' && (
                    <CreateReminderForm
                        channels={channels}
                        onCreate={createReminder}
                        setView={setView}
                    />
                )}
            </main>
            <DeliveryHistoryDialog
                reminder={selectedReminder}
                onClose={() => setSelectedReminder(null)}
            />
        </div>
    );
}

