"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";

export function EditReminderDialog({ reminder, channels, onUpdate, onClose }) {
    const [editedReminder, setEditedReminder] = useState(reminder);

    const handleSubmit = (e) => {
        e.preventDefault();
        onUpdate(editedReminder);
    };
    
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="w-full max-w-xl rounded-lg bg-background text-foreground border shadow-lg" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-4 border-b">
                        <h2 className="font-semibold text-lg">Edit Reminder</h2>
                    </div>
                    <div className="p-4 space-y-4">
                        <div>
                            <label className="text-sm font-medium">Message</label>
                            <textarea
                                className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2"
                                rows={3}
                                value={editedReminder.message}
                                onChange={(e) => setEditedReminder({ ...editedReminder, message: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Channel</label>
                            <select
                                className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2"
                                value={editedReminder.channelId}
                                onChange={(e) => setEditedReminder({ ...editedReminder, channelId: e.target.value })}
                                required
                            >
                                <option value="">Select channel…</option>
                                {channels.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Send at</label>
                            <input
                                type="datetime-local"
                                className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2"
                                value={editedReminder.scheduleAt ? new Date(editedReminder.scheduleAt).toISOString().slice(0, 16) : ""}
                                onChange={(e) => setEditedReminder({ ...editedReminder, scheduleAt: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div className="p-4 border-t flex justify-end space-x-2">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button type="submit">Save Changes</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}