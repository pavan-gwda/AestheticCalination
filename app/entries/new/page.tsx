"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AccountBar from "@/components/account-bar";

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
  const [summary, setSummary] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });
  }, []);

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

    const { data: entry, error: entryErr } = await supabase
      .from("entries")
      .insert({
        user_id: user.id,
        week_start: weekStart,
        title: title || null,
        summary: summary || null,
      })
      .select()
      .single();

    setSaving(false);

    if (entryErr || !entry) {
      setError(entryErr?.message ?? "Could not create entry.");
      return;
    }

    router.push(`/entries/${entry.id}`);
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {userEmail && <AccountBar email={userEmail} />}

        <h1 className="text-2xl font-semibold mb-1">New week</h1>
        <p className="text-neutral-400 text-sm mb-6">
          Add day-by-day details after creating the week.
        </p>

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
              Summary (optional)
            </label>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="One or two lines: how did the week go?"
              className="w-full rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-md bg-neutral-100 text-neutral-900 py-2.5 text-sm font-medium hover:bg-white transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Create week"}
          </button>
        </form>
      </div>
    </div>
  );
}
