"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ChannelCombobox } from "@/components/ChannelCombobox";

export function EditReminderDialog({ reminder, channels, onUpdate, onClose }) {
    const [editedReminder, setEditedReminder] = useState(reminder);

    const formatToLocalDateTime = (isoString) => {
        if (!isoString) return "";
        const date = new Date(isoString);
        const offset = date.getTimezoneOffset() * 60000;
        const localDate = new Date(date.getTime() - offset);
        return localDate.toISOString().slice(0, 16);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const localDate = new Date(editedReminder.scheduleAt);
        const payload = {
            ...editedReminder,
            scheduleAt: localDate.toISOString(),
        };
        onUpdate(payload);
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
                            <ChannelCombobox
                                channels={channels}
                                value={editedReminder.channelId}
                                onChange={(channelId) => setEditedReminder({ ...editedReminder, channelId })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">
                                Send at <span className="text-xs text-gray-500">(PST)</span>
                            </label>
                            <input
                                type="datetime-local"
                                className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2"
                                value={formatToLocalDateTime(editedReminder.scheduleAt)}
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