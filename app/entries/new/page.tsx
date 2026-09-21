"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AccountBar from "@/components/account-bar";

type MetricRow = { name: string; value: string; unit: string };

function mondayOf(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

export default function NewEntryPage() {
  const router = useRouter();
  const [weekStart, setWeekStart] = useState(mondayOf(new Date()));
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [summary, setSummary] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [homeworkInput, setHomeworkInput] = useState("");
  const [metrics, setMetrics] = useState<MetricRow[]>([
    { name: "", value: "", unit: "reps" },
  ]);
  const [files, setFiles] = useState<FileList | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });
  }, []);

  function updateMetric(i: number, field: keyof MetricRow, val: string) {
    setMetrics((prev) =>
      prev.map((m, idx) => (idx === i ? { ...m, [field]: val } : m)),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Not signed in.");
      setSaving(false);
      return;
    }

    // 1. Create the entry
    const { data: entry, error: entryErr } = await supabase
      .from("entries")
      .insert({
        user_id: user.id,
        week_start: weekStart,
        title: title || null,
        notes: notes || null,
        summary: summary || null,
      })
      .select()
      .single();

    if (entryErr || !entry) {
      setError(entryErr?.message ?? "Could not create entry.");
      setSaving(false);
      return;
    }

    // 2. Metrics
    const validMetrics = metrics.filter((m) => m.name && m.value);
    if (validMetrics.length > 0) {
      await supabase.from("metrics").insert(
        validMetrics.map((m) => ({
          entry_id: entry.id,
          name: m.name,
          value: Number(m.value),
          unit: m.unit,
        })),
      );
    }

    // 3. Tags
    const tagLabels = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (tagLabels.length > 0) {
      await supabase
        .from("tags")
        .insert(tagLabels.map((label) => ({ entry_id: entry.id, label })));
    }

    // 4. Homework
    const homeworkLines = homeworkInput
      .split("\n")
      .map((h) => h.trim())
      .filter(Boolean);
    if (homeworkLines.length > 0) {
      await supabase.from("homework").insert(
        homeworkLines.map((description) => ({
          entry_id: entry.id,
          description,
        })),
      );
    }

    // 5. Photos
    if (files && files.length > 0) {
      for (const file of Array.from(files)) {
        const path = `${user.id}/${entry.id}/${Date.now()}-${file.name}`;
        const { error: uploadErr } = await supabase.storage
          .from("journal-photos")
          .upload(path, file);
        if (!uploadErr) {
          await supabase
            .from("photos")
            .insert({ entry_id: entry.id, storage_path: path });
        }
      }
    }

    setSaving(false);
    router.push(`/entries/${entry.id}`);
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {userEmail && <AccountBar email={userEmail} />}

        <h1 className="text-2xl font-semibold mb-6">New week</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-neutral-400 mb-1">
              Week starting
            </label>
            <input
              type="date"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
              className="w-full rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-400 mb-1">
              Title (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Deload week, focus on shoulders"
              className="w-full rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-400 mb-1">
              Summary
            </label>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="One or two lines: how did the week go?"
              className="w-full rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-400 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              placeholder="Free-form notes for the week..."
              className="w-full rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-400 mb-2">
              Metrics
            </label>
            <div className="space-y-2">
              {metrics.map((m, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. pull-up"
                    value={m.name}
                    onChange={(e) => updateMetric(i, "name", e.target.value)}
                    className="flex-1 rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="value"
                    value={m.value}
                    onChange={(e) => updateMetric(i, "value", e.target.value)}
                    className="w-24 rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm"
                  />
                  <select
                    value={m.unit}
                    onChange={(e) => updateMetric(i, "unit", e.target.value)}
                    className="rounded-md bg-neutral-900 border border-neutral-800 px-2 py-2 text-sm"
                  >
                    <option value="reps">reps</option>
                    <option value="seconds">seconds</option>
                    <option value="level">level</option>
                  </select>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                setMetrics((prev) => [
                  ...prev,
                  { name: "", value: "", unit: "reps" },
                ])
              }
              className="mt-2 text-sm text-neutral-400 hover:text-neutral-200"
            >
              + Add metric
            </button>
          </div>

          <div>
            <label className="block text-sm text-neutral-400 mb-1">
              Tags / what I learned (comma separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="shoulder anatomy, scapular control, false grip"
              className="w-full rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-400 mb-1">
              Homework for next week (one per line)
            </label>
            <textarea
              value={homeworkInput}
              onChange={(e) => setHomeworkInput(e.target.value)}
              rows={3}
              placeholder={
                "Practice tuck planche 3x/week\nStretch shoulders daily"
              }
              className="w-full rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-400 mb-1">
              Photos
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setFiles(e.target.files)}
              className="w-full text-sm text-neutral-400"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-md bg-neutral-100 text-neutral-900 py-2.5 text-sm font-medium hover:bg-white transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save entry"}
          </button>
        </form>
      </div>
    </div>
  );
}
