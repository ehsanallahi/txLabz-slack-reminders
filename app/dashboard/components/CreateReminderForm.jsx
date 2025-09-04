"use client";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import dynamic from 'next/dynamic';
import TurndownService from 'turndown';

const RichTextEditor = dynamic(
  () => import('@/components/ui/RichTextEditor').then(mod => mod.RichTextEditor),
  {
    ssr: false,
    loading: () => <div className="w-full rounded-md border border-input p-4 min-h-[120px] bg-muted/50"><p>Loading editor...</p></div>
  }
);

export function CreateReminderForm({ channels, onCreate, setView }) {
    const [form, setForm] = useState({ message: "", channelId: "", scheduleAt: "", frequency: "once", time: "09:00", dayOfWeek: "1" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const selectedChannel = useMemo(() => channels.find(c => c.id === form.channelId), [channels, form.channelId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        // FIX: Update Turndown configuration
        const turndownService = new TurndownService({
            strongDelimiter: '*',
            emDelimiter: '_',
            bulletListMarker: '*',
        });

        // Add a rule for strikethrough, which Turndown doesn't handle by default for Slack
        turndownService.addRule('strikethrough', {
            filter: ['del', 's', 'strike'],
            replacement: function (content) {
                return '~' + content + '~';
            }
        });

        const markdownMessage = turndownService.turndown(form.message);
        let payload = { ...form, message: markdownMessage, channelName: selectedChannel?.name };
        
        // ... (rest of the handleSubmit function is unchanged)

        const now = new Date();
        const [hours, minutes] = form.time.split(':').map(Number);
        
        if (form.frequency === 'once') {
            payload.scheduleAt = new Date(form.scheduleAt).toISOString();
        } else {
            let nextOccurrence = new Date();
            nextOccurrence.setHours(hours, minutes, 0, 0);
            if (form.frequency === 'daily' && nextOccurrence < now) {
                nextOccurrence.setDate(nextOccurrence.getDate() + 1);
            } else if (form.frequency === 'weekly') {
                const targetDay = parseInt(form.dayOfWeek, 10);
                let dayDifference = targetDay - nextOccurrence.getDay();
                if (dayDifference < 0 || (dayDifference === 0 && nextOccurrence < now)) { dayDifference += 7; }
                nextOccurrence.setDate(nextOccurrence.getDate() + dayDifference);
            }
            payload.scheduleAt = nextOccurrence.toISOString();
        }
        await onCreate(payload);
        setIsSubmitting(false);
        setView('view');
    };

    // ... (rest of the component is unchanged)
    return (
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
            <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <RichTextEditor value={form.message} onChange={(html) => setForm({ ...form, message: html })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Channel</label>
                    <select className="w-full rounded-md border border-input bg-background px-3 py-2" value={form.channelId} onChange={(e) => setForm({ ...form, channelId: e.target.value })} required>
                        <option value="">Select channel…</option>
                        {channels.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Frequency</label>
                    <select className="w-full rounded-md border border-input bg-background px-3 py-2" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
                        <option value="once">Once</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                    </select>
                </div>
            </div>
            {form.frequency === "once" && (<div className="space-y-2"><label className="text-sm font-medium">Send at</label><input type="datetime-local" className="w-full rounded-md border border-input bg-background px-3 py-2" value={form.scheduleAt} onChange={(e) => setForm({ ...form, scheduleAt: e.target.value })} required /></div>)}
            {form.frequency === "daily" && (<div className="space-y-2"><label className="text-sm font-medium">Time</label><input type="time" className="w-full rounded-md border border-input bg-background px-3 py-2" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required /></div>)}
            {form.frequency === "weekly" && (<div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-2"><label className="text-sm font-medium">Day of the Week</label><select className="w-full rounded-md border border-input bg-background px-3 py-2" value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })} required><option value="1">Monday</option><option value="2">Tuesday</option><option value="3">Wednesday</option><option value="4">Thursday</option><option value="5">Friday</option><option value="6">Saturday</option><option value="0">Sunday</option></select></div><div className="space-y-2"><label className="text-sm font-medium">Time</label><input type="time" className="w-full rounded-md border border-input bg-background px-3 py-2" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required /></div></div>)}
            <div><Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Reminder'}</Button></div>
        </form>
    );
}