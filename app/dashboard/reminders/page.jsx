"use client";

import { useEffect, useMemo, useState } from "react";

export default function RemindersPage() {
  const [items, setItems] = useState([]);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    message: "",
    channelId: "",
    scheduleAt: "",
  });
  const [error, setError] = useState("");

  const selectedChannel = useMemo(() => channels.find(c => c.id === form.channelId), [channels, form.channelId]);

  async function refresh() {
    setLoading(true);
    const r1 = await fetch("/api/reminders").then(r => r.json());
    const r2Resp = await fetch("/api/slack/channels");
    let r2Data = {};
    try { r2Data = await r2Resp.json(); } catch (_) { r2Data = {}; }
    const r2 = { status: r2Resp.status, ...r2Data };
    setItems(r1.items || []);
    setChannels(r2.channels || []);
    setError(r2.status !== 200 ? (r2.error || "Failed to load Slack channels") : "");
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

 async function createReminder(e) {
    e.preventDefault();
    // Convert the local datetime string from the input into a UTC ISO string
    const scheduleAtUTC = new Date(form.scheduleAt).toISOString();

    const payload = {
      message: form.message,
      channelId: form.channelId,
      scheduleAt: scheduleAtUTC, // Send the standardized UTC time
      channelName: selectedChannel?.name,
    };
    
    const res = await fetch("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      setForm({ ...form, message: "", scheduleAt: "" }); // Clear message and date on success
      await refresh();
    }
  }

  async function togglePause(id, isPaused) {
    await fetch(`/api/reminders/${id}`, { method: "PUT", body: JSON.stringify({ isPaused: !isPaused }) });
    await refresh();
  }

  async function remove(id) {
    await fetch(`/api/reminders/${id}`, { method: "DELETE" });
    await refresh();
  }

  async function runNow(id) {
    await fetch(`/api/reminders/${id}/run`, { method: "POST" });
    await refresh();
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Reminders</h1>
      {error ? (
        <div className="mb-4 rounded border border-red-300 bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>
      ) : null}
      <form onSubmit={createReminder} className="grid gap-3 md:grid-cols-2 mb-8">
        <div className="md:col-span-2">
          <label className="text-sm">Message</label>
          <textarea className="w-full rounded border border-foreground/20 bg-transparent px-3 py-2" rows={3}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="text-sm">Channel</label>
          <select className="w-full rounded border border-foreground/20 bg-transparent px-3 py-2"
            value={form.channelId} onChange={(e) => setForm({ ...form, channelId: e.target.value })} required>
            <option value="">Select channel…</option>
            {channels.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm">Send at</label>
          <input type="datetime-local" className="w-full rounded border border-foreground/20 bg-transparent px-3 py-2"
            value={form.scheduleAt} onChange={(e) => setForm({ ...form, scheduleAt: e.target.value })} required />
        </div>
        <div className="md:col-span-2">
          <button className="rounded-md bg-foreground text-background px-4 py-2">Create Reminder</button>
        </div>
      </form>

      <div className="rounded-xl border border-foreground/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-foreground/5">
            <tr>
              <th className="text-left p-3">Message</th>
              <th className="text-left p-3">Channel</th>
              <th className="text-left p-3">Send at</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Last delivery</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r._id} className="border-t border-foreground/10 hover:bg-foreground/5 cursor-pointer" onClick={() => setSelected(r)}>
                <td className="p-3 max-w-[380px] truncate" title={r.message}>{r.message}</td>
                <td className="p-3">{r.channelName || r.channelId}</td>
                <td className="p-3">{new Date(r.scheduleAt).toLocaleString()}</td>
                <td className="p-3">{r.sent ? "Sent" : (r.isPaused ? "Paused" : "Scheduled")}</td>
                <td className="p-3">{r.deliveries?.[r.deliveries.length-1]?.at ? new Date(r.deliveries[r.deliveries.length-1].at).toLocaleString() : "-"}</td>
                <td className="p-3 space-x-2">
                  <button className="rounded border px-2 py-1" onClick={() => togglePause(r._id, r.isPaused)}>
                    {r.isPaused ? "Resume" : "Pause"}
                  </button>
                  <button className="rounded border px-2 py-1" onClick={() => runNow(r._id)}>Run now</button>
                  <button className="rounded border px-2 py-1" onClick={() => remove(r._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-3 text-xs text-foreground/70">Click a reminder row to view full delivery history.</div>
      </div>

      {selected ? (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-xl rounded-lg bg-background text-foreground border border-foreground/20 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-foreground/10 flex items-center justify-between">
              <div>
                <div className="font-semibold">Delivery history</div>
                <div className="text-xs text-foreground/70 truncate max-w-[28rem]">{selected.message}</div>
              </div>
              <button className="rounded border px-2 py-1 text-sm" onClick={() => setSelected(null)}>Close</button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-auto">
              {selected.deliveries?.length ? (
                <table className="w-full text-sm">
                  <thead className="bg-foreground/5">
                    <tr>
                      <th className="text-left p-2">Time</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.deliveries.map((d, idx) => (
                      <tr key={idx} className="border-t border-foreground/10">
                        <td className="p-2">{new Date(d.at).toLocaleString()}</td>
                        <td className="p-2">{d.ok ? "OK" : "Failed"}</td>
                        <td className="p-2 text-red-600">{d.error || ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-sm text-foreground/70">No deliveries yet.</div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
