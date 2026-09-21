"use client";

import { useState } from "react";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";

type Metric = { id: string | null; name: string; value: string; unit: string };
type PhotoItem = {
  id: string;
  storage_path: string;
  caption: string | null;
  url?: string;
};
type Tag = { id: string; label: string };
type Day = {
  id: string;
  entry_id: string;
  day_date: string;
  notes: string | null;
  metrics: Metric[];
  photos: PhotoItem[];
  tags: Tag[];
};
type HomeworkItem = { id: string; description: string; done: boolean };
type EntryHeader = {
  id: string;
  week_start: string;
  title: string | null;
  summary: string | null;
};

function addDaysToDate(dateStr: string, days: number) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function nextAvailableDate(weekStart: string, taken: string[]) {
  for (let i = 0; i < 7; i++) {
    const candidate = addDaysToDate(weekStart, i);
    if (!taken.includes(candidate)) return candidate;
  }
  return weekStart;
}

export default function EntryEditor({
  entry,
  entryDays,
  homework,
  userId,
}: {
  entry: EntryHeader;
  entryDays: Day[];
  homework: HomeworkItem[];
  userId: string;
}) {
  const [title, setTitle] = useState(entry.title ?? "");
  const [summary, setSummary] = useState(entry.summary ?? "");
  const [days, setDays] = useState<Day[]>(
    entryDays.map((d) => ({
      ...d,
      metrics: d.metrics.map((m) => ({
        ...m,
        id: m.id,
        value: String(m.value),
      })),
    })),
  );
  const [tagsInput, setTagsInput] = useState<Record<string, string>>(
    Object.fromEntries(
      entryDays.map((d) => [d.id, d.tags.map((t) => t.label).join(", ")]),
    ),
  );
  const [newDayDate, setNewDayDate] = useState(
    nextAvailableDate(
      entry.week_start,
      entryDays.map((d) => d.day_date),
    ),
  );
  const [homeworkItems, setHomeworkItems] = useState(homework);
  const [newHomework, setNewHomework] = useState("");

  const weekEnd = addDaysToDate(entry.week_start, 6);

  function patchDay(dayId: string, patch: Partial<Day>) {
    setDays((prev) =>
      prev.map((d) => (d.id === dayId ? { ...d, ...patch } : d)),
    );
  }

  async function saveHeader() {
    const supabase = createClient();
    await supabase
      .from("entries")
      .update({ title: title || null, summary: summary || null })
      .eq("id", entry.id);
  }

  async function addDay(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const { data, error } = await supabase
      .from("entry_days")
      .insert({ entry_id: entry.id, day_date: newDayDate })
      .select()
      .single();
    if (error || !data) return;
    setDays((prev) =>
      [...prev, { ...data, metrics: [], photos: [], tags: [] }].sort((a, b) =>
        a.day_date.localeCompare(b.day_date),
      ),
    );
    setTagsInput((prev) => ({ ...prev, [data.id]: "" }));
    setNewDayDate(
      nextAvailableDate(entry.week_start, [
        ...days.map((d) => d.day_date),
        newDayDate,
      ]),
    );
  }

  async function deleteDay(dayId: string) {
    const supabase = createClient();
    await supabase.from("entry_days").delete().eq("id", dayId);
    setDays((prev) => prev.filter((d) => d.id !== dayId));
  }

  async function saveDayNotes(dayId: string, notes: string) {
    const supabase = createClient();
    await supabase
      .from("entry_days")
      .update({ notes: notes || null })
      .eq("id", dayId);
  }

  function addMetricRow(dayId: string) {
    const day = days.find((d) => d.id === dayId);
    if (!day) return;
    patchDay(dayId, {
      metrics: [
        ...day.metrics,
        { id: null, name: "", value: "", unit: "reps" },
      ],
    });
  }

  function updateMetricField(
    dayId: string,
    index: number,
    field: keyof Metric,
    value: string,
  ) {
    const day = days.find((d) => d.id === dayId);
    if (!day) return;
    const metrics = day.metrics.map((m, i) =>
      i === index ? { ...m, [field]: value } : m,
    );
    patchDay(dayId, { metrics });
  }

  async function saveMetric(dayId: string, index: number) {
    const day = days.find((d) => d.id === dayId);
    if (!day) return;
    const metric = day.metrics[index];
    if (!metric.name || !metric.value) return;

    const supabase = createClient();
    if (metric.id) {
      await supabase
        .from("metrics")
        .update({
          name: metric.name,
          value: Number(metric.value),
          unit: metric.unit,
        })
        .eq("id", metric.id);
    } else {
      const { data } = await supabase
        .from("metrics")
        .insert({
          day_id: dayId,
          name: metric.name,
          value: Number(metric.value),
          unit: metric.unit,
        })
        .select()
        .single();
      if (data) {
        const metrics = day.metrics.map((m, i) =>
          i === index ? { ...m, id: data.id } : m,
        );
        patchDay(dayId, { metrics });
      }
    }
  }

  async function deleteMetric(dayId: string, index: number) {
    const day = days.find((d) => d.id === dayId);
    if (!day) return;
    const metric = day.metrics[index];
    if (metric.id) {
      const supabase = createClient();
      await supabase.from("metrics").delete().eq("id", metric.id);
    }
    patchDay(dayId, { metrics: day.metrics.filter((_, i) => i !== index) });
  }

  async function saveTags(dayId: string) {
    const day = days.find((d) => d.id === dayId);
    if (!day) return;
    const labels = (tagsInput[dayId] ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const supabase = createClient();
    await supabase.from("tags").delete().eq("day_id", dayId);
    let inserted: Tag[] = [];
    if (labels.length > 0) {
      const { data } = await supabase
        .from("tags")
        .insert(labels.map((label) => ({ day_id: dayId, label })))
        .select();
      inserted = data ?? [];
    }
    patchDay(dayId, { tags: inserted });
  }

  async function handlePhotoUpload(dayId: string, files: FileList | null) {
    if (!files || files.length === 0) return;
    const supabase = createClient();
    const day = days.find((d) => d.id === dayId);
    if (!day) return;

    const uploaded: PhotoItem[] = [];
    for (const file of Array.from(files)) {
      const path = `${userId}/${dayId}/${Date.now()}-${file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from("journal-photos")
        .upload(path, file);
      if (uploadErr) continue;

      const { data: photoRow } = await supabase
        .from("photos")
        .insert({ day_id: dayId, storage_path: path })
        .select()
        .single();
      if (!photoRow) continue;

      const { data: signed } = await supabase.storage
        .from("journal-photos")
        .createSignedUrl(path, 3600);
      uploaded.push({ ...photoRow, url: signed?.signedUrl });
    }

    patchDay(dayId, { photos: [...day.photos, ...uploaded] });
  }

  async function deletePhoto(dayId: string, photo: PhotoItem) {
    const supabase = createClient();
    await supabase.storage.from("journal-photos").remove([photo.storage_path]);
    await supabase.from("photos").delete().eq("id", photo.id);
    const day = days.find((d) => d.id === dayId);
    if (!day) return;
    patchDay(dayId, { photos: day.photos.filter((p) => p.id !== photo.id) });
  }

  async function toggleHomework(id: string, done: boolean) {
    setHomeworkItems((prev) =>
      prev.map((h) => (h.id === id ? { ...h, done: !done } : h)),
    );
    const supabase = createClient();
    await supabase.from("homework").update({ done: !done }).eq("id", id);
  }

  async function addHomework(e: React.FormEvent) {
    e.preventDefault();
    if (!newHomework.trim()) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("homework")
      .insert({ entry_id: entry.id, description: newHomework.trim() })
      .select()
      .single();
    if (data) {
      setHomeworkItems((prev) => [...prev, data]);
      setNewHomework("");
    }
  }

  async function deleteHomework(id: string) {
    const supabase = createClient();
    await supabase.from("homework").delete().eq("id", id);
    setHomeworkItems((prev) => prev.filter((h) => h.id !== id));
  }

  return (
    <div className="mt-3">
      <div className="mb-6">
        <span className="text-sm text-neutral-400">
          Week of{" "}
          {format(new Date(`${entry.week_start}T00:00:00`), "MMM d, yyyy")}
        </span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveHeader}
          placeholder="Title (optional)"
          className="block w-full bg-transparent text-2xl font-semibold mt-1 outline-none placeholder:text-neutral-600"
        />
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          onBlur={saveHeader}
          placeholder="Weekly summary..."
          rows={2}
          className="block w-full bg-transparent text-neutral-300 mt-2 outline-none placeholder:text-neutral-600 resize-none"
        />
      </div>

      <div className="space-y-4 mb-6">
        {days.map((day) => (
          <div
            key={day.id}
            className="rounded-lg border border-neutral-800 bg-neutral-900 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-neutral-200">
                {format(new Date(`${day.day_date}T00:00:00`), "EEEE, MMM d")}
              </h3>
              <button
                type="button"
                onClick={() => deleteDay(day.id)}
                className="text-xs text-neutral-500 hover:text-red-400 transition"
              >
                Remove day
              </button>
            </div>

            <textarea
              value={day.notes ?? ""}
              onChange={(e) => patchDay(day.id, { notes: e.target.value })}
              onBlur={(e) => saveDayNotes(day.id, e.target.value)}
              placeholder="Notes for this day..."
              rows={2}
              className="w-full rounded-md bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm mb-3 resize-none"
            />

            <div className="space-y-2 mb-2">
              {day.metrics.map((m, i) => (
                <div key={m.id ?? `new-${i}`} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. pull-up"
                    value={m.name}
                    onChange={(e) =>
                      updateMetricField(day.id, i, "name", e.target.value)
                    }
                    onBlur={() => saveMetric(day.id, i)}
                    className="flex-1 rounded-md bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="value"
                    value={m.value}
                    onChange={(e) =>
                      updateMetricField(day.id, i, "value", e.target.value)
                    }
                    onBlur={() => saveMetric(day.id, i)}
                    className="w-20 rounded-md bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm"
                  />
                  <select
                    value={m.unit}
                    onChange={(e) => {
                      updateMetricField(day.id, i, "unit", e.target.value);
                      saveMetric(day.id, i);
                    }}
                    className="rounded-md bg-neutral-950 border border-neutral-800 px-2 py-2 text-sm"
                  >
                    <option value="reps">reps</option>
                    <option value="seconds">seconds</option>
                    <option value="level">level</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => deleteMetric(day.id, i)}
                    className="text-neutral-500 hover:text-red-400 transition px-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => addMetricRow(day.id)}
              className="text-xs text-neutral-400 hover:text-neutral-200 transition mb-3"
            >
              + Add metric
            </button>

            <input
              type="text"
              value={tagsInput[day.id] ?? ""}
              onChange={(e) =>
                setTagsInput((prev) => ({ ...prev, [day.id]: e.target.value }))
              }
              onBlur={() => saveTags(day.id)}
              placeholder="Tags, comma separated"
              className="w-full rounded-md bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm mb-3"
            />

            {day.photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-2">
                {day.photos.map((p) =>
                  p.url ? (
                    <div key={p.id} className="relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.url}
                        alt={p.caption ?? "progress photo"}
                        className="rounded-md w-full aspect-square object-cover border border-neutral-800"
                      />
                      <button
                        type="button"
                        onClick={() => deletePhoto(day.id, p)}
                        className="absolute top-1 right-1 bg-neutral-950/80 text-neutral-300 hover:text-red-400 rounded-full w-5 h-5 text-xs leading-5 text-center"
                      >
                        ×
                      </button>
                    </div>
                  ) : null,
                )}
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handlePhotoUpload(day.id, e.target.files)}
              className="w-full text-xs text-neutral-400"
            />
          </div>
        ))}
      </div>

      <form
        onSubmit={addDay}
        className="flex items-center gap-2 mb-8 rounded-lg border border-dashed border-neutral-800 p-3"
      >
        <input
          type="date"
          value={newDayDate}
          min={entry.week_start}
          max={weekEnd}
          onChange={(e) => setNewDayDate(e.target.value)}
          className="rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="text-sm text-neutral-200 hover:text-white transition"
        >
          + Add day
        </button>
      </form>

      <div className="mb-6">
        <h2 className="text-sm font-medium text-neutral-400 mb-2">Homework</h2>
        <div className="space-y-1.5 mb-3">
          {homeworkItems.map((h) => (
            <div key={h.id} className="flex items-center gap-2 text-sm group">
              <label className="flex items-center gap-2 cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={h.done}
                  onChange={() => toggleHomework(h.id, h.done)}
                  className="rounded border-neutral-700 bg-neutral-900"
                />
                <span
                  className={
                    h.done
                      ? "line-through text-neutral-500"
                      : "text-neutral-200"
                  }
                >
                  {h.description}
                </span>
              </label>
              <button
                type="button"
                onClick={() => deleteHomework(h.id)}
                className="text-neutral-600 hover:text-red-400 transition text-xs"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <form onSubmit={addHomework} className="flex gap-2">
          <input
            type="text"
            value={newHomework}
            onChange={(e) => setNewHomework(e.target.value)}
            placeholder="Add homework for next week"
            className="flex-1 rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-md bg-neutral-100 text-neutral-900 px-3 py-2 text-sm font-medium hover:bg-white transition"
          >
            Add
          </button>
        </form>
      </div>
    </div>
  );
}
